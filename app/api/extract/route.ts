import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { groq, SYSTEM_PROMPT } from "@/lib/groq";
import { llmJson } from "@/lib/llm";
import { PlanSchema } from "@/lib/schema";
import { planId, savePlan } from "@/lib/store";
import { encodePlan, decodePlan } from "@/lib/codec";
import {
  createShortLink,
  findPlanByInputHash,
} from "@/lib/supabase";

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
      // Vision OCR via Groq Llama-4 Scout (rare path — most teachers paste text).
      const v = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Read this teacher's diary page verbatim. Keep subject labels, lists, and the date if visible." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
      });
      rawText = v.choices[0]?.message?.content ?? "";
    }

    const cls = className ?? "UKG - A";

    // ─── Cache check ───
    // Hash the (cleaned) input + class + date. If we've seen this exact
    // request today, skip the LLM call and reuse the previously generated
    // plan. Saves Cerebras tokens on retries / accidental double-clicks.
    const normalized = rawText.replace(/\s+/g, " ").trim();
    const inputHash = createHash("sha256")
      .update(`${cls}|${tomorrowIso}|${normalized}`)
      .digest("hex")
      .slice(0, 32);

    try {
      const hit = await findPlanByInputHash(inputHash, cls, tomorrowIso);
      if (hit) {
        const plan = PlanSchema.parse(decodePlan(hit.payload));
        const id = planId(plan);
        savePlan(id, plan);
        return NextResponse.json({
          id,
          p: hit.payload,
          plan,
          shortCode: hit.id,
          cached: true,
        });
      }
    } catch {
      // Cache lookup failed — fall through to fresh generation.
    }

    // Plan extraction via Cerebras Qwen-3-235B (excellent Hindi/English).
    const content = await llmJson(
      SYSTEM_PROMPT,
      `Class: ${cls}\nTomorrow date (use this exact value for date_iso): ${tomorrowIso}\nTomorrow weekday: ${tomorrowWeekday}\n\nDiary contents:\n${rawText}`,
      { temperature: 0.4 }
    );

    const json = JSON.parse(content);
    const parsed = PlanSchema.parse(json);
    // Hard-pin the date to the server-computed tomorrow (IST) so the poster is never wrong.
    const plan = { ...parsed, date_iso: tomorrowIso, weekday: tomorrowWeekday };

    const id = planId(plan);
    savePlan(id, plan);
    const p = encodePlan(plan);

    // Create a short link via Supabase for easy sharing AND for history.
    let shortCode: string | null = null;
    try {
      shortCode = await createShortLink(
        p,
        plan.class_name,
        plan.date_iso,
        inputHash,
        normalized.slice(0, 240)
      );
    } catch {
      // Non-fatal — teacher can still share the long /p/ URL.
    }

    return NextResponse.json({ id, p, plan, shortCode, cached: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
