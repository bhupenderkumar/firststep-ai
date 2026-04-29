import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPlan } from "@/lib/store";
import { decodePlan } from "@/lib/codec";
import { PlanSchema } from "@/lib/schema";
import ParentPoster from "@/components/ParentPoster";
import TeacherPoster from "@/components/TeacherPoster";
import { A4 } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const p = req.nextUrl.searchParams.get("p");
  const view = (req.nextUrl.searchParams.get("view") ?? "parent").toLowerCase();

  let plan;
  if (p) {
    try {
      plan = PlanSchema.parse(decodePlan(p));
    } catch {
      return new Response("Invalid plan payload", { status: 400 });
    }
  } else if (id) {
    plan = getPlan(id);
    if (!plan) {
      return new Response(
        "Plan not found - this URL only works briefly. Re-generate from the home page; new URLs use a stateless ?p= payload.",
        { status: 404 }
      );
    }
  } else {
    return new Response("Missing ?p= or ?id=", { status: 400 });
  }

  const node =
    view === "teacher" ? (
      <TeacherPoster plan={plan} />
    ) : (
      <ParentPoster plan={plan} />
    );

  return new ImageResponse(node, {
    width: A4.width,
    height: A4.height,
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
