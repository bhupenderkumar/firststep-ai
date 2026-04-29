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
  dateIso: string
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = shortId();
    const { error } = await supabase.from("short_links").insert({
      id,
      payload,
      class_name: className,
      date_iso: dateIso,
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
