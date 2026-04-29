// Thin wrapper around Google Gemini's REST API.
// We use Gemini 2.0 Flash for all LLM text generation because its free tier
// allows ~1,500 requests/day vs. Groq's much smaller daily token bucket.
// No SDK dependency — fetch only — keeps the bundle small and the cold start
// fast on Vercel.

const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

// Default to 2.0 Flash (fast, cheap, generous free tier). Can be overridden
// per call.
const DEFAULT_MODEL = "gemini-2.0-flash";

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

function apiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");
  return k;
}

async function callGemini(
  parts: GeminiPart[],
  opts: {
    system?: string;
    temperature?: number;
    json?: boolean;
    model?: string;
  } = {}
): Promise<string> {
  const model = opts.model || DEFAULT_MODEL;
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey()}`;

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      // Most plans + scripts comfortably fit in 4k tokens.
      maxOutputTokens: 4096,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (opts.system) {
    body.systemInstruction = {
      role: "system",
      parts: [{ text: opts.system }],
    };
  }

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await r.json()) as GeminiResponse;
  if (!r.ok) {
    throw new Error(
      `Gemini ${r.status}: ${data.error?.message || JSON.stringify(data)}`
    );
  }
  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini blocked: ${data.promptFeedback.blockReason}`);
  }
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Gemini returned empty response");
  }
  return text;
}

/** Plain text completion. */
export async function geminiText(
  system: string,
  user: string,
  opts: { temperature?: number; model?: string } = {}
): Promise<string> {
  return callGemini([{ text: user }], {
    system,
    temperature: opts.temperature,
    model: opts.model,
  });
}

/** JSON completion. Caller is responsible for `JSON.parse`. */
export async function geminiJson(
  system: string,
  user: string,
  opts: { temperature?: number; model?: string } = {}
): Promise<string> {
  return callGemini([{ text: user }], {
    system,
    temperature: opts.temperature ?? 0.4,
    json: true,
    model: opts.model,
  });
}

/** Vision: extract text from a base64 JPEG/PNG image. */
export async function geminiVision(
  prompt: string,
  imageBase64: string,
  mimeType = "image/jpeg"
): Promise<string> {
  return callGemini(
    [
      { text: prompt },
      { inline_data: { mime_type: mimeType, data: imageBase64 } },
    ],
    { temperature: 0.2 }
  );
}
