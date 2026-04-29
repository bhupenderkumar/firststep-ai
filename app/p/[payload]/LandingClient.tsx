"use client";

import { useEffect, useMemo, useState } from "react";
import type { Plan } from "@/lib/schema";

const PRIMARY = "#C02942";
const ACCENT = "#185A9D";
const GOLD = "#F2B705";
const DARK = "#28283C";

const VOICES = [
  { id: "hannah", label: "Miss Hannah (warm)" },
  { id: "autumn", label: "Miss Autumn (bright)" },
  { id: "diana", label: "Miss Diana (clear)" },
  { id: "daniel", label: "Mr. Daniel (calm)" },
  { id: "austin", label: "Mr. Austin (friendly)" },
  { id: "troy", label: "Mr. Troy (confident)" },
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function LandingClient({
  plan,
  payload,
}: {
  plan: Plan;
  payload: string;
}) {
  const [voice, setVoice] = useState("hannah");
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioErr, setAudioErr] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const parentImg = useMemo(
    () => `/api/render?p=${payload}&view=parent`,
    [payload]
  );
  const teacherImg = useMemo(
    () => `/api/render?p=${payload}&view=teacher`,
    [payload]
  );

  async function generateAudio() {
    setAudioLoading(true);
    setAudioErr(null);
    setAudioUrl(null);
    try {
      const res = await fetch(`/api/voice?p=${payload}&voice=${voice}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (e) {
      setAudioErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setAudioLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  }

  const waText = `${plan.class_name} - ${formatDate(plan.date_iso)} - First Step School daily plan (with audio narration):\n${shareUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <main
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: "24px 16px 80px",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
        color: DARK,
      }}
    >
      {/* Print-only style: hide non-essentials, scale poster to A4 */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          .print-poster {
            width: 100% !important;
            page-break-after: always;
            display: block !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 700;
          text-decoration: none;
          border: 0;
          cursor: pointer;
          font-size: 16px;
        }
      `}</style>

      {/* HERO */}
      <section
        className="no-print"
        style={{
          background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
          color: "#fff",
          padding: "28px 24px",
          borderRadius: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.9, letterSpacing: 1 }}>
          FIRST STEP SCHOOL - SAURABH VIHAR
        </div>
        <h1 style={{ fontSize: 36, margin: "8px 0 6px", lineHeight: 1.2 }}>
          {plan.class_name} - Tomorrow&apos;s Plan
        </h1>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          {formatDate(plan.date_iso)}
        </div>
        {plan.festival_today ? (
          <div
            style={{
              marginTop: 14,
              background: GOLD,
              color: DARK,
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            🎉 {plan.festival_today.name} -{" "}
            {plan.festival_today.closed
              ? "School CLOSED"
              : "School open as usual"}
          </div>
        ) : null}
      </section>

      {/* AUDIO NARRATION */}
      <section
        className="no-print"
        style={{
          background: "#fff",
          border: `2px solid ${ACCENT}`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 28 }}>🎧</span>
          <h2 style={{ margin: 0, color: ACCENT, fontSize: 22 }}>
            Listen with your child
          </h2>
        </div>
        <p style={{ margin: "4px 0 14px", color: "#555", fontSize: 15 }}>
          A friendly teacher reads tomorrow&apos;s plan to BOTH parent and
          child. Each subject is explained simply, with a fun fact and a home
          activity. Hindi words are sprinkled in so children learn both
          languages. Perfect at bedtime.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
          }}
        >
          <label style={{ fontSize: 14, fontWeight: 700 }}>Voice:</label>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            disabled={audioLoading}
            style={{
              padding: "10px 12px",
              fontSize: 15,
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            onClick={generateAudio}
            disabled={audioLoading}
            className="btn"
            style={{ background: ACCENT, color: "#fff" }}
          >
            {audioLoading
              ? "Generating audio... (15-30s)"
              : audioUrl
              ? "Re-generate"
              : "▶ Generate audio narration"}
          </button>
        </div>

        {audioErr ? (
          <div
            style={{
              color: PRIMARY,
              marginTop: 12,
              padding: 12,
              background: "#FFE9EC",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              ⚠️ Audio not available yet
            </div>
            {audioErr.includes("terms") || audioErr.includes("model_terms") ? (
              <div>
                The text-to-speech model needs a one-time terms acceptance by
                the Groq org admin.{" "}
                <a
                  href="https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: ACCENT, fontWeight: 700 }}
                >
                  Click here to accept terms
                </a>{" "}
                (login as the Groq org admin), then come back and click
                Generate again.
              </div>
            ) : (
              <div style={{ wordBreak: "break-word" }}>{audioErr}</div>
            )}
          </div>
        ) : null}

        {audioUrl ? (
          <div style={{ marginTop: 16 }}>
            <audio
              key={audioUrl}
              controls
              autoPlay
              src={audioUrl}
              style={{ width: "100%" }}
            />
            <a
              href={audioUrl}
              download={`firststep-${plan.class_name.replace(
                /\s+/g,
                "_"
              )}-${plan.date_iso}.wav`}
              style={{
                display: "inline-block",
                marginTop: 8,
                color: ACCENT,
                fontSize: 14,
              }}
            >
              ⬇ Download audio (.wav)
            </a>
          </div>
        ) : null}
      </section>

      {/* QUICK SUMMARY */}
      <section
        className="no-print"
        style={{
          background: "#FFFAF0",
          border: `2px solid ${PRIMARY}`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, color: PRIMARY, fontSize: 22 }}>
          📚 What we&apos;ll learn tomorrow
        </h2>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {plan.parents.map((p, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: 14,
                borderLeft: `6px solid ${PRIMARY}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    background: PRIMARY,
                    color: "#fff",
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {p.subject}
                </span>
                <strong style={{ fontSize: 17 }}>{p.topic}</strong>
                {p.topic_hi ? (
                  <span style={{ color: "#555", fontSize: 16 }}>
                    ({p.topic_hi})
                  </span>
                ) : null}
              </div>
              <div style={{ marginTop: 6, color: ACCENT, fontSize: 14 }}>
                💡 Home tip: {p.home_tip}
              </div>
              {p.home_tip_hi ? (
                <div style={{ color: "#444", fontSize: 14 }}>
                  💡 घर पर सुझाव: {p.home_tip_hi}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 14,
            background: GOLD,
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          📝 Homework: {plan.homework}
          {plan.homework_hi ? (
            <div style={{ fontWeight: 600, marginTop: 2 }}>
              गृहकार्य: {plan.homework_hi}
            </div>
          ) : null}
        </div>
      </section>

      {/* ACTIONS */}
      <section
        className="no-print"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 24,
        }}
      >
        <a
          href={parentImg}
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ background: PRIMARY, color: "#fff" }}
        >
          📄 Open Parent A4 (new tab)
        </a>
        <a
          href={teacherImg}
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ background: ACCENT, color: "#fff" }}
        >
          📄 Open Teacher A4 (new tab)
        </a>
        <button
          onClick={() => window.print()}
          className="btn"
          style={{ background: DARK, color: "#fff" }}
        >
          🖨 Print as PDF
        </button>
        <button
          onClick={copyLink}
          className="btn"
          style={{ background: "#eee", color: DARK }}
        >
          {copied ? "✓ Copied" : "🔗 Copy share link"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="btn"
          style={{ background: "#25D366", color: "#fff" }}
        >
          💬 Share on WhatsApp
        </a>
      </section>

      {/* INLINE POSTERS (also used by print) */}
      <section style={{ display: "grid", gap: 16 }}>
        <div
          className="print-poster"
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #ddd",
            padding: 8,
          }}
        >
          <div
            className="no-print"
            style={{ fontWeight: 700, color: PRIMARY, marginBottom: 6 }}
          >
            Parent Sheet
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={parentImg}
            alt="Parent A4 sheet"
            style={{ width: "100%", display: "block", borderRadius: 6 }}
          />
        </div>
        <div
          className="print-poster"
          style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #ddd",
            padding: 8,
          }}
        >
          <div
            className="no-print"
            style={{ fontWeight: 700, color: ACCENT, marginBottom: 6 }}
          >
            Teacher Sheet (with worked example)
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={teacherImg}
            alt="Teacher A4 sheet"
            style={{ width: "100%", display: "block", borderRadius: 6 }}
          />
        </div>
      </section>

      <footer
        className="no-print"
        style={{
          marginTop: 40,
          color: "#888",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        First Step School - Saurabh Vihar - With love from your teachers ❤️
      </footer>
    </main>
  );
}
