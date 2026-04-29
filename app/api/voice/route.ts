import { NextRequest } from "next/server";
import { groq } from "@/lib/groq";
import { decodePlan } from "@/lib/codec";
import { PlanSchema, type Plan } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const ORPHEUS_MAX = 180; // safe under 200-char hard limit

const NARRATION_SYSTEM = `You are "Miss Riya", a warm, kind teacher at First Step School - Saurabh Vihar.
Write a friendly spoken-word audio script (no headings, no markdown, no asterisks, no emojis, no stage directions).

Voice rules:
- Address the CHILD directly first ("Hello little champ!"), then the PARENT ("Dear Mom and Dad,").
- Switch back and forth between speaking to the child and to the parent so both listen together.
- Use very simple grade-2 English. Short sentences. Lots of warmth.
- For EACH subject:
  1. Name the topic and say the Hindi word in transliteration in brackets, e.g. "we will learn about Myself, in Hindi we say 'main' (मैं) - which means me!"
  2. Briefly EXPLAIN what the topic is in 1-2 sentences (use the 'explanation' field).
  3. Speak out 2 to 3 of the WORKED EXAMPLES so parents can repeat them with the child (e.g. "5 ones are 5, 5 twos are 10, 5 threes are 15"; or "A for Apple, B for Ball, C for Cat").
  4. Give 1 home activity tip.
- Mention the homework clearly so parents can pack the bag.
- Share at least one fun fact a child will love.
- If there is a festival, explain it warmly to the child and tell parents what to do.
- Sentences must be SHORT (under 180 characters EACH) so they can be sent to a TTS engine.
- Total length: about 28 to 40 sentences (richer, more detailed than before, but never over 45).
- End with a cheerful sign-off from Miss Riya wishing good night and sweet dreams.
Output: ONLY the spoken script as plain sentences separated by single newlines. No numbering. No labels.`;

async function generateScript(plan: Plan): Promise<string> {
  const planText = JSON.stringify(
    {
      class_name: plan.class_name,
      date_iso: plan.date_iso,
      weekday: plan.weekday,
      festival_today: plan.festival_today,
      parents: plan.parents.map((p) => ({
        subject: p.subject,
        topic: p.topic,
        topic_hi: p.topic_hi,
        explanation: p.explanation,
        examples: p.examples,
        fun_fact: p.fun_fact,
        home_tip: p.home_tip,
      })),
      homework: plan.homework,
      homework_hi: plan.homework_hi,
    },
    null,
    2
  );
  const r = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    messages: [
      { role: "system", content: NARRATION_SYSTEM },
      {
        role: "user",
        content: `Tomorrow's plan for ${plan.class_name}:\n${planText}\n\nWrite the audio script now. Use the explanations and examples; do not skip them.`,
      },
    ],
  });
  return r.choices[0]?.message?.content?.trim() ?? "";
}

// Split a long script into TTS-safe chunks (<= 180 chars), preferring sentence boundaries.
function chunkForTts(text: string, max = ORPHEUS_MAX): string[] {
  const cleaned = text
    .replace(/[*_#`>]+/g, "")
    .replace(/\r/g, "")
    .replace(/\n+/g, "\n")
    .trim();
  // Split on sentence-ish punctuation but keep the punctuation.
  const sentences = cleaned
    .split(/(?<=[.!?\u0964])\s+|\n+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    // Hard-split anything that is itself too long.
    let parts: string[] = [s];
    if (s.length > max) {
      parts = [];
      for (let i = 0; i < s.length; i += max) parts.push(s.slice(i, i + max));
    }
    for (const p of parts) {
      if ((buf + " " + p).trim().length > max) {
        if (buf) chunks.push(buf.trim());
        buf = p;
      } else {
        buf = (buf ? buf + " " : "") + p;
      }
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.filter((c) => c.length <= max && c.length > 0);
}

// Locate the "data" subchunk in a WAV buffer. Returns { headerEnd, pcmStart, pcmEnd }.
function findDataChunk(buf: Buffer): { headerEnd: number; pcm: Buffer } {
  // Search for ASCII "data" marker.
  const marker = Buffer.from("data", "ascii");
  const idx = buf.indexOf(marker, 12);
  if (idx < 0) {
    // Fall back: assume standard 44-byte header.
    return { headerEnd: 44, pcm: buf.slice(44) };
  }
  const headerEnd = idx + 8; // 4 bytes "data" + 4 bytes size
  const sizeLE = buf.readUInt32LE(idx + 4);
  const pcmEnd = Math.min(buf.length, headerEnd + sizeLE);
  return { headerEnd, pcm: buf.slice(headerEnd, pcmEnd) };
}

function concatWavs(wavs: Buffer[]): Buffer {
  if (wavs.length === 0) return Buffer.alloc(0);
  if (wavs.length === 1) return wavs[0];
  const first = wavs[0];
  const firstParse = findDataChunk(first);
  const header = first.slice(0, firstParse.headerEnd);
  const allPcm = [firstParse.pcm];
  for (let i = 1; i < wavs.length; i++) {
    allPcm.push(findDataChunk(wavs[i]).pcm);
  }
  const pcmLen = allPcm.reduce((n, b) => n + b.length, 0);
  const out = Buffer.concat([header, ...allPcm]);
  // Patch RIFF chunk size at offset 4 (file size - 8).
  out.writeUInt32LE(out.length - 8, 4);
  // Patch data subchunk size at headerEnd - 4.
  out.writeUInt32LE(pcmLen, firstParse.headerEnd - 4);
  return out;
}

async function synthChunk(text: string, voice: string): Promise<Buffer> {
  const r = await fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "canopylabs/orpheus-v1-english",
      voice,
      input: text,
      response_format: "wav",
    }),
  });
  if (!r.ok) {
    throw new Error(`TTS ${r.status}: ${await r.text()}`);
  }
  const ab = await r.arrayBuffer();
  return Buffer.from(ab);
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("p");
  const voice = req.nextUrl.searchParams.get("voice") || "hannah";
  if (!p) return new Response("Missing ?p=", { status: 400 });

  let plan: Plan;
  try {
    plan = PlanSchema.parse(decodePlan(p));
  } catch {
    return new Response("Invalid plan payload", { status: 400 });
  }

  try {
    const script = await generateScript(plan);
    if (!script) return new Response("Empty script", { status: 500 });

    const chunks = chunkForTts(script);
    if (chunks.length === 0) return new Response("No chunks", { status: 500 });

    // Run TTS in parallel, but cap concurrency to avoid hammering the API.
    const concurrency = 4;
    const results: Buffer[] = new Array(chunks.length);
    const errors: string[] = [];
    let next = 0;
    async function worker() {
      while (true) {
        const i = next++;
        if (i >= chunks.length) return;
        // Try up to 2 times per chunk (transient 5xx / network blips).
        let lastErr: unknown = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            results[i] = await synthChunk(chunks[i], voice);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
            await new Promise((r) => setTimeout(r, 400));
          }
        }
        if (lastErr) {
          results[i] = Buffer.alloc(0);
          errors.push(lastErr instanceof Error ? lastErr.message : String(lastErr));
        }
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(concurrency, chunks.length) }, worker)
    );

    const valid = results.filter((b) => b.length > 100);
    // If MORE than 1/3 of chunks failed, refuse — partial audio is confusing.
    if (valid.length === 0 || valid.length < Math.ceil(chunks.length * 0.66)) {
      const firstErr = errors[0] || "TTS returned empty audio";
      const hint = /terms|accept/i.test(firstErr)
        ? " (Hint: accept Orpheus TTS terms at https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english)"
        : "";
      return new Response(`${firstErr}${hint}`, {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    const wav = concatWavs(valid);

    return new Response(new Uint8Array(wav), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=604800, s-maxage=604800, immutable",
        "Content-Disposition": `inline; filename="firststep-${plan.class_name.replace(/\s+/g, "_")}-${plan.date_iso}.wav"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Voice generation failed: ${message}`, { status: 500 });
  }
}
