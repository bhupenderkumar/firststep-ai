import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key);

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function shortId(len = 6): string {
  let out = "";
  const arr = new Uint8Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < len; i++) out += CHARS[arr[i] % CHARS.length];
  return out;
}

/** Save a plan payload and return a short code. Retries on collision. */
export async function createShortLink(
  payload: string,
  className: string,
  dateIso: string,
  inputHash?: string,
  inputPreview?: string
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = shortId();
    const { error } = await supabase.from("short_links").insert({
      id,
      payload,
      class_name: className,
      date_iso: dateIso,
      input_hash: inputHash ?? null,
      input_preview: inputPreview ?? null,
    });
    if (!error) return id;
    // 23505 = unique_violation → collision, retry
    if (error.code === "23505") continue;
    throw new Error(`Supabase insert failed: ${error.message}`);
  }
  throw new Error("Could not generate unique short code after 5 attempts");
}

/** Look up a short code → base64url payload */
export async function resolveShortLink(
  id: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("short_links")
    .select("payload")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data.payload;
}

/**
 * Look up a previously-generated plan by its input hash + className + date.
 * Lets the admin click "Generate" repeatedly without spending Cerebras tokens.
 */
export async function findPlanByInputHash(
  inputHash: string,
  className: string,
  dateIso: string
): Promise<{ id: string; payload: string } | null> {
  const { data, error } = await supabase
    .from("short_links")
    .select("id, payload")
    .eq("input_hash", inputHash)
    .eq("class_name", className)
    .eq("date_iso", dateIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, payload: data.payload };
}

export type HistoryRow = {
  id: string;
  class_name: string;
  date_iso: string;
  created_at: string;
  input_preview: string | null;
};

/** List recent plans for the admin history panel. */
export async function listRecentPlans(limit = 30): Promise<HistoryRow[]> {
  const { data, error } = await supabase
    .from("short_links")
    .select("id, class_name, date_iso, created_at, input_preview")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as HistoryRow[];
}

// ─────────── Audio cache (Storage bucket: audio-cache) ───────────

const AUDIO_BUCKET = "audio-cache";

/** Fetch cached audio bytes for a key, or null if missing. */
export async function fetchCachedAudio(
  key: string
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).download(key);
  if (error || !data) return null;
  const ab = await data.arrayBuffer();
  return {
    bytes: new Uint8Array(ab),
    contentType: data.type || "audio/wav",
  };
}

/** Upload audio bytes for a key. Idempotent (upsert). Non-fatal on failure. */
export async function uploadCachedAudio(
  key: string,
  bytes: Uint8Array,
  contentType = "audio/wav"
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(key, bytes, { contentType, upsert: true });
    return !error;
  } catch {
    return false;
  }
}

/** Get the public URL for a cached audio key (bucket is public). */
export function publicAudioUrl(key: string): string {
  return supabase.storage.from(AUDIO_BUCKET).getPublicUrl(key).data.publicUrl;
}
