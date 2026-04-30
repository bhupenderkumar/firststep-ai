import { NextRequest, NextResponse } from "next/server";
import { listRecentPlans } from "@/lib/supabase";

export const runtime = "nodejs";

// Admin-only: list recent generated plans with their share codes.
export async function GET(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (expected) {
    const provided =
      req.headers.get("x-admin-key") ||
      req.nextUrl.searchParams.get("key") ||
      "";
    if (provided !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "30", 10))
  );
  const rows = await listRecentPlans(limit);
  return NextResponse.json({ rows });
}
