import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/groq";
import { geminiJson, geminiVision } from "@/lib/gemini";
import { PlanSchema } from "@/lib/schema";
import { planId, savePlan } from "@/lib/store";
import { encodePlan } from "@/lib/codec";
import { createShortLink } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // ─────────── AUTH GATE ───────────
    // Only authenticated school staff can spend Groq credits.
    const expected = process.env.ADMIN_PASSWORD;
    if (expected) {
      const provided = req.headers.get("x-admin-key") || "";
      if (provided !== expected) {
        return NextResponse.json(
          { error: "Unauthorized. Enter the admin password to generate plans." },
          { status: 401 }
        );
      }
    }

    const { imageBase64, text, className } = await req.json();

    if (!imageBase64 && !text) {
      return NextResponse.json(
        { error: "Provide imageBase64 or text" },
        { status: 400 }
      );
    }

    // Compute tomorrow in IST so the model never invents a date.
    const nowIst = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const tomorrow = new Date(nowIst);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = `${tomorrow.getFullYear()}-${String(
      tomorrow.getMonth() + 1
    ).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    const tomorrowWeekday = tomorrow.toLocaleDateString("en-US", {
      weekday: "long",
    });

    let rawText: string = text ?? "";

    if (imageBase64) {
      // Gemini 2.0 Flash handles vision OCR natively.
      rawText = await geminiVision(
        "Read this teacher's diary page verbatim. Keep subject labels, lists, and the date if visible. Output plain text only.",
        imageBase64,
        "image/jpeg"
      );
    }

    const content = await geminiJson(
      SYSTEM_PROMPT,
      `Class: ${className ?? "UKG - A"}\nTomorrow date (use this exact value for date_iso): ${tomorrowIso}\nTomorrow weekday: ${tomorrowWeekday}\n\nDiary contents:\n${rawText}`,
      { temperature: 0.4 }
    );

    const json = JSON.parse(content);
    const parsed = PlanSchema.parse(json);
    // Hard-pin the date to the server-computed tomorrow (IST) so the poster is never wrong.
    const plan = { ...parsed, date_iso: tomorrowIso, weekday: tomorrowWeekday };

    const id = planId(plan);
    savePlan(id, plan);
    const p = encodePlan(plan);

    // Create a short link via Supabase for easy sharing.
    let shortCode: string | null = null;
    try {
      shortCode = await createShortLink(p, plan.class_name, plan.date_iso);
    } catch {
      // Non-fatal — teacher can still share the long /p/ URL.
    }

    return NextResponse.json({ id, p, plan, shortCode });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
