import { NextRequest, NextResponse } from "next/server";
import { groq, SYSTEM_PROMPT } from "@/lib/groq";
import { PlanSchema } from "@/lib/schema";
import { planId, savePlan } from "@/lib/store";
import { encodePlan } from "@/lib/codec";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
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
      const v = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Read this teacher's diary page verbatim. Keep subject labels, lists, and the date if visible.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
      });
      rawText = v.choices[0]?.message?.content ?? "";
    }

    const r = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Class: ${className ?? "UKG - A"}\nTomorrow date (use this exact value for date_iso): ${tomorrowIso}\nTomorrow weekday: ${tomorrowWeekday}\n\nDiary contents:\n${rawText}`,
        },
      ],
    });

    const content = r.choices[0]?.message?.content ?? "{}";
    const json = JSON.parse(content);
    const parsed = PlanSchema.parse(json);
    // Hard-pin the date to the server-computed tomorrow (IST) so the poster is never wrong.
    const plan = { ...parsed, date_iso: tomorrowIso, weekday: tomorrowWeekday };

    const id = planId(plan);
    savePlan(id, plan);
    const p = encodePlan(plan);

    return NextResponse.json({ id, p, plan });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
