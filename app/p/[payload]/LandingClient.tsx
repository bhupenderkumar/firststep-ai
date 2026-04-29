"use client";

import { useEffect, useMemo, useState } from "react";
import type { Plan } from "@/lib/schema";

const PRIMARY = "#C02942";
const ACCENT = "#185A9D";
const DARK = "#28283C";

const VOICES = [
  { id: "hannah", label: "Miss Hannah" },
  { id: "autumn", label: "Miss Autumn" },
  { id: "diana", label: "Miss Diana" },
  { id: "daniel", label: "Mr. Daniel" },
  { id: "austin", label: "Mr. Austin" },
  { id: "troy", label: "Mr. Troy" },
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
  const [audioReady, setAudioReady] = useState(false);
  const [audioErr, setAudioErr] = useState<string | null>(null);

  const audioUrl = `/api/voice?p=${payload}&voice=${voice}`;
  const parentImg = useMemo(() => `/api/render?p=${payload}&view=parent`, [payload]);
  const parentPdf = `/api/pdf?p=${payload}&view=parent`;

  // Probe whether audio is already cached. Errors get surfaced with friendly hints.
  useEffect(() => {
    let cancelled = false;
    setAudioReady(false);
    setAudioErr(null);
    (async () => {
      try {
        const r = await fetch(audioUrl, { cache: "force-cache" });
        if (cancelled) return;
        if (r.ok && (r.headers.get("content-type") || "").includes("audio")) {
          setAudioReady(true);
        } else if (!r.ok) {
          const text = await r.text();
          setAudioErr(text || `HTTP ${r.status}`);
        }
      } catch (e) {
        if (!cancelled) setAudioErr(e instanceof Error ? e.message : "load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  return (
    <main
      style={{
        background: "#EDEEF1",
        minHeight: "100vh",
        padding: "20px 12px 60px",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
        color: DARK,
      }}
    >
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .pdf-page {
            box-shadow: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
            page-break-after: always;
          }
          @page { size: A4 portrait; margin: 0; }
        }
        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 18px; border-radius: 10px;
          font-weight: 700; font-size: 15px;
          text-decoration: none; border: 0; cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          transition: transform 0.05s ease;
        }
        .btn:active { transform: translateY(1px); }
        .pdf-page {
          background: #fff;
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 1240 / 1754;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }
        .pdf-page img { width: 100%; height: 100%; display: block; object-fit: contain; }
      `}</style>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        {/* Top control bar */}
        <section
          className="no-print"
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 16,
            marginBottom: 18,
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#888", letterSpacing: 1 }}>
                FIRST STEP SCHOOL - SAURABH VIHAR
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: PRIMARY }}>
                {plan.class_name} - {formatDate(plan.date_iso)}
              </div>
            </div>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 14,
              }}
              title="Choose a voice"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>

          {/* AUDIO PLAYER - browser/CDN cache makes repeat plays instant */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 12,
              background: "#F4F6FB",
              borderRadius: 10,
              border: `1px solid ${audioReady ? "#cfe5cf" : "#e0e0e0"}`,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 22 }}>🎧</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Listen with your child
              </div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {audioReady
                  ? "Ready - press play. Hindi words included for kids."
                  : audioErr
                  ? "Audio unavailable - read the sheets below."
                  : "Loading audio (first time may take 20-30s)..."}
              </div>
            </div>
          </div>
          <audio
            key={audioUrl}
            controls
            preload="auto"
            src={audioUrl}
            style={{ width: "100%" }}
            onCanPlay={() => setAudioReady(true)}
            onError={() => {
              if (!audioErr) setAudioErr("Audio could not load");
            }}
          />

          {audioErr && audioErr.toLowerCase().includes("term") ? (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: "#FFE9EC",
                color: PRIMARY,
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              ⚠️ The TTS model needs a one-time terms acceptance.{" "}
              <a
                href="https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english"
                target="_blank"
                rel="noreferrer"
                style={{ color: ACCENT, fontWeight: 700 }}
              >
                Accept here
              </a>{" "}
              (Groq org admin), then refresh.
            </div>
          ) : null}

          {/* ACTION BUTTONS */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 14,
            }}
          >
            <a href={parentPdf} target="_blank" rel="noreferrer" className="btn" style={{ background: PRIMARY, color: "#fff" }}>
              📄 Open Parent PDF
            </a>
          </div>
        </section>

        {/* PDF-LIKE POSTER PAGES */}
        <section style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div className="pdf-page">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={parentImg} alt="Parent A4 sheet" />
          </div>
        </section>

        <footer
          className="no-print"
          style={{
            marginTop: 36,
            color: "#888",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          First Step School - Saurabh Vihar - With love from your teachers
        </footer>
      </div>
    </main>
  );
}
