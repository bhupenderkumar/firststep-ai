// Cerebras Cloud — OpenAI-compatible API.
// We use Qwen-3-235B because it has excellent Hindi/English bilingual output
// and a generous free tier (1M tokens/day).
// Same endpoint shape as OpenAI/Groq, just a different host.

const CEREBRAS_BASE = "https://api.cerebras.ai/v1";
// Qwen-3-235B: best Hindi quality on Cerebras. Fallback to llama3.1-8b only
// if qwen is rate-limited/unavailable.
const PRIMARY_MODEL = "qwen-3-235b-a22b-instruct-2507";
const FALLBACK_MODEL = "llama3.1-8b";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type ChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
  message?: string;
  code?: string;
};

function apiKey(): string {
  const k = process.env.CEREBRAS_API_KEY;
  if (!k) throw new Error("CEREBRAS_API_KEY is not set");
  return k;
}

async function callOnce(
  model: string,
  messages: ChatMessage[],
  opts: { temperature?: number; json?: boolean; maxTokens?: number }
): Promise<string> {
  const r = await fetch(`${CEREBRAS_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 4096,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const data = (await r.json()) as ChatResponse;
  if (!r.ok) {
    const msg = data.error?.message || data.message || JSON.stringify(data);
    throw new Error(`Cerebras ${r.status} [${model}]: ${msg}`);
  }
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error(`Cerebras [${model}]: empty response`);
  return text;
}

// Auto-retry on transient queue/rate errors with the fallback model.
async function callWithFallback(
  messages: ChatMessage[],
  opts: { temperature?: number; json?: boolean; maxTokens?: number }
): Promise<string> {
  try {
    return await callOnce(PRIMARY_MODEL, messages, opts);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Retry once on queue/rate limit; bubble all other errors.
    if (/queue|rate.?limit|429|too_many|503|502/i.test(msg)) {
      // Brief backoff, then try fallback model.
      await new Promise((r) => setTimeout(r, 600));
      return await callOnce(FALLBACK_MODEL, messages, opts);
    }
    throw e;
  }
}

/** Plain-text completion. */
export async function llmText(
  system: string,
  user: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  return callWithFallback(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: opts.temperature, maxTokens: opts.maxTokens }
  );
}

/** JSON completion. Caller does `JSON.parse`. */
export async function llmJson(
  system: string,
  user: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  return callWithFallback(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: opts.temperature ?? 0.4, json: true, maxTokens: opts.maxTokens }
  );
}
