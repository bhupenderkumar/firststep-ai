import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPlan } from "@/lib/store";
import ParentPoster from "@/components/ParentPoster";
import TeacherPoster from "@/components/TeacherPoster";
import { A4 } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const view = (req.nextUrl.searchParams.get("view") ?? "parent").toLowerCase();
  if (!id) return new Response("Missing id", { status: 400 });

  const plan = getPlan(id);
  if (!plan) return new Response("Plan not found", { status: 404 });

  const node =
    view === "teacher" ? (
      <TeacherPoster plan={plan} />
    ) : (
      <ParentPoster plan={plan} />
    );

  return new ImageResponse(node, {
    width: A4.width,
    height: A4.height,
    headers: { "Cache-Control": "public, max-age=600" },
  });
}
