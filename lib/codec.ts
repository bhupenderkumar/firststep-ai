import type { Plan } from "@/lib/schema";

// URL-safe base64 (works in browser, edge, and node)
export function encodePlan(plan: Plan): string {
  const json = JSON.stringify(plan);
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(json, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodePlan(p: string): unknown {
  const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const raw =
    typeof Buffer !== "undefined"
      ? Buffer.from(b64 + pad, "base64").toString("utf8")
      : decodeURIComponent(escape(atob(b64 + pad)));
  return JSON.parse(raw);
}
