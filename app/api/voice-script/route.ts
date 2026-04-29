import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { groq } from "@/lib/groq";
import { decodePlan } from "@/lib/codec";
import { PlanSchema, type Plan } from "@/lib/schema";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30;

// Same persona but tuned for browser SpeechSynthesis (which handles Hindi/English
// mixed text on most devices). Slightly shorter to keep playback under ~3 minutes.
const SCRIPT_SYSTEM = `You are "Miss Riya", a warm, kind teacher at First Step School - Saurabh Vihar.
Write a friendly spoken-word audio script (no headings, no markdown, no asterisks, no emojis, no stage directions).

Voice rules:
- Greet the CHILD ("Hello little champ!") and the PARENT ("Dear Mom and Dad,").
- Use very simple grade-2 English. Short sentences. Lots of warmth.
- For EACH subject:
  1. Name the topic.
  2. Briefly EXPLAIN what the topic is in 1 sentence.
  3. Speak out 2 of the WORKED EXAMPLES so parents can repeat them with the child.
  4. Give 1 home tip.
- Mention the homework once.
- Sentences must be SHORT (under 200 characters EACH).
- Total length: about 20 to 30 sentences.
- End with a cheerful sign-off from Miss Riya wishing good night.
Output: ONLY the spoken script as plain sentences separated by single newlines. No numbering. No labels.`;

const SCRIPT_BUCKET = "audio-cache";

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
        explanation: p.explanation,
        examples: p.examples,
        home_tip: p.home_tip,
      })),
      homework: plan.homework,
    },
    null,
    2
  );
  const r = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    messages: [
      { role: "system", content: SCRIPT_SYSTEM },
      {
        role: "user",
        content: `Tomorrow's plan for ${plan.class_name}:\n${planText}\n\nWrite the audio script now.`,
      },
    ],
  });
  return r.choices[0]?.message?.content?.trim() ?? "";
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("p");
  if (!p) return NextResponse.json({ error: "Missing ?p=" }, { status: 400 });

  let plan: Plan;
  try {
    plan = PlanSchema.parse(decodePlan(p));
  } catch {
    return NextResponse.json({ error: "Invalid plan payload" }, { status: 400 });
  }

  // Cache the script as a tiny txt file in the same bucket so we don't burn
  // LLM tokens for every parent that opens the page.
  const key =
    "script-" +
    createHash("sha256").update(p).digest("hex").slice(0, 24) +
    ".txt";

  try {
    const dl = await supabase.storage.from(SCRIPT_BUCKET).download(key);
    if (!dl.error && dl.data) {
      const txt = await dl.data.text();
      if (txt && txt.length > 50) {
        return NextResponse.json({ script: txt, cached: true });
      }
    }
  } catch {
    // miss → generate
  }

  try {
    const script = await generateScript(plan);
    if (!script) {
      return NextResponse.json({ error: "Empty script" }, { status: 500 });
    }
    // Best-effort upload — don't block the response.
    supabase.storage
      .from(SCRIPT_BUCKET)
      .upload(key, script, { contentType: "text/plain", upsert: true })
      .catch(() => {});
    return NextResponse.json(
      { script, cached: false },
      {
        headers: {
          "Cache-Control": "public, max-age=604800, s-maxage=604800",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
