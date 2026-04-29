import { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

// A4 portrait at 72 DPI (PDF point system) = 595.28 x 841.89 pt.
// Our PNG is 1240 x 1754 (150 DPI A4) which has the SAME aspect ratio,
// so it scales perfectly into A4 with no margins.
const A4_W = 595.28;
const A4_H = 841.89;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("p");
  const view = (req.nextUrl.searchParams.get("view") ?? "parent").toLowerCase();
  const both = req.nextUrl.searchParams.get("both") === "1";

  if (!p) return new Response("Missing ?p=", { status: 400 });

  const origin = req.nextUrl.origin;
  async function fetchPng(v: "parent" | "teacher") {
    const r = await fetch(`${origin}/api/render?p=${encodeURIComponent(p!)}&view=${v}`, {
      cache: "force-cache",
    });
    if (!r.ok) throw new Error(`render ${v} ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  }

  try {
    const views: Array<"parent" | "teacher"> = both
      ? ["parent", "teacher"]
      : [view === "teacher" ? "teacher" : "parent"];

    const pngs = await Promise.all(views.map((v) => fetchPng(v)));

    const pdf = await PDFDocument.create();
    pdf.setTitle("First Step School - Daily Plan");
    pdf.setAuthor("First Step School - Saurabh Vihar");

    for (const pngBytes of pngs) {
      const img = await pdf.embedPng(pngBytes);
      const page = pdf.addPage([A4_W, A4_H]);
      // Cover entire page (PNG already 1240x1754 = A4 ratio).
      page.drawImage(img, { x: 0, y: 0, width: A4_W, height: A4_H });
    }

    const bytes = await pdf.save();
    const filename = both
      ? "firststep-daily-plan.pdf"
      : `firststep-${views[0]}.pdf`;

    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`PDF generation failed: ${message}`, { status: 500 });
  }
}
