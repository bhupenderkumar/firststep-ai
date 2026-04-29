import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getPlan } from "@/lib/store";
import { decodePlan } from "@/lib/codec";
import { PlanSchema } from "@/lib/schema";
import ParentPoster from "@/components/ParentPoster";
import TeacherPoster from "@/components/TeacherPoster";
import { A4 } from "@/lib/constants";

export const runtime = "nodejs";

// Cache fonts in module scope so we only fetch once per cold start.
let fontPromise: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 700 }[]> | null = null;
function loadFonts() {
  if (!fontPromise) {
    fontPromise = (async () => {
      // Resolve current TTF URLs via Google Fonts CSS API (UA trick returns TTF, not WOFF2).
      const css = await fetch(
        "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&family=Noto+Sans:wght@400;700",
        { headers: { "User-Agent": "Mozilla/5.0" }, cache: "force-cache" }
      ).then((r) => r.text());
      // Parse each @font-face block: capture family name + ttf URL together so
      // we can correctly assign each TTF to "Noto" or "NotoDev" (order from
      // Google's CSS API is not guaranteed).
      const blocks = css.split("@font-face").slice(1);
      type F = { name: string; weight: 400 | 700; url: string };
      const found: F[] = [];
      for (const b of blocks) {
        const fam = /font-family:\s*'([^']+)'/.exec(b)?.[1] ?? "";
        const w = /font-weight:\s*(\d+)/.exec(b)?.[1] ?? "400";
        const url = /https:[^)]+\.ttf/.exec(b)?.[0];
        if (!url) continue;
        const isDev = /Devanagari/i.test(fam);
        found.push({
          name: isDev ? "NotoDev" : "Noto",
          weight: w === "700" ? 700 : 400,
          url,
        });
      }
      const datas = await Promise.all(
        found.map((f) =>
          fetch(f.url, { cache: "force-cache" }).then((r) => r.arrayBuffer())
        )
      );
      return found.map((f, i) => ({ name: f.name, weight: f.weight, data: datas[i] }));
    })();
  }
  return fontPromise;
}

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

  const fonts = await loadFonts();
  return new ImageResponse(node, {
    width: A4.width,
    height: A4.height,
    fonts: fonts.map((f) => ({ name: f.name, data: f.data, weight: f.weight, style: "normal" as const })),
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
