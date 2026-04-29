import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPlan } from "@/lib/store";
import PlanPoster from "@/components/PlanPoster";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("Missing id", { status: 400 });

  const plan = getPlan(id);
  if (!plan) return new Response("Plan not found", { status: 404 });

  return new ImageResponse(<PlanPoster plan={plan} />, {
    width: 1600,
    height: 2520,
    headers: { "Cache-Control": "public, max-age=600" },
  });
}
