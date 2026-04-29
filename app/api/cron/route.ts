import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Vercel Cron pings this endpoint nightly. Implementation is intentionally a stub
// here - wire WhatsApp / Telegram in lib/whatsapp.ts and call it below.
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Cron ran. Wire WhatsApp reminder here.",
    at: new Date().toISOString(),
  });
}
