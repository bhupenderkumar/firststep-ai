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
  const [browserTtsState, setBrowserTtsState] = useState<
    "idle" | "loading" | "speaking" | "paused" | "done" | "error"
  >("idle");
  const [browserTtsAvailable, setBrowserTtsAvailable] = useState(false);

  const audioUrl = `/api/voice?p=${payload}&voice=${voice}`;
  const parentImg = useMemo(() => `/api/render?p=${payload}&view=parent`, [payload]);
  const parentPdf = `/api/pdf?p=${payload}&view=parent`;

  useEffect(() => {
    setBrowserTtsAvailable(
      typeof window !== "undefined" && "speechSynthesis" in window
    );
  }, []);

  // Lightweight HEAD check to detect rate-limit / failure BEFORE the <audio>
  // element fires its (non-descriptive) onError. We use HEAD instead of GET
  // so we don't double-download the WAV bytes that the audio element will
  // also fetch. A 200 means cached/ready; 429 means studio voice is rate-
  // limited (fall back to device voice); other 5xx is a real failure.
  useEffect(() => {
    let cancelled = false;
    setAudioReady(false);
    setAudioErr(null);
    (async () => {
      try {
        const r = await fetch(audioUrl, { method: "HEAD" });
        if (cancelled) return;
        if (r.ok && (r.headers.get("content-type") || "").includes("audio")) {
          setAudioReady(true);
        } else if (r.status === 429) {
          setAudioErr("rate_limited");
        } else if (!r.ok) {
          setAudioErr(`HTTP ${r.status}`);
        }
      } catch (e) {
        if (!cancelled) setAudioErr(e instanceof Error ? e.message : "load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  // Speak the narration script using the device's built-in voice.
  // This works on every modern phone/tablet, is free, and works offline once
  // the script is loaded. Falls back automatically when Groq is rate-limited.
  async function speakWithBrowser() {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      setBrowserTtsState("loading");
      const r = await fetch(`/api/voice-script?p=${payload}`);
      const data = await r.json();
      if (!r.ok || !data.script) {
        throw new Error(data.error || "Could not load script");
      }
      // Split into sentences so each utterance is short enough that mobile
      // browsers don't truncate (Chrome on Android cuts off >~250 chars).
      const sentences = (data.script as string)
        .split(/\n+|(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const synth = window.speechSynthesis;
      const allVoices = synth.getVoices();
      // Prefer English (India) → English (US) → any English; otherwise default.
      const preferred =
        allVoices.find((v) => /en[-_]IN/i.test(v.lang)) ||
        allVoices.find((v) => /^en[-_]US/i.test(v.lang)) ||
        allVoices.find((v) => /^en/i.test(v.lang)) ||
        allVoices[0];

      setBrowserTtsState("speaking");
      let idx = 0;
      const next = () => {
        if (idx >= sentences.length) {
          setBrowserTtsState("done");
          return;
        }
        const u = new SpeechSynthesisUtterance(sentences[idx++]);
        if (preferred) u.voice = preferred;
        u.rate = 0.95;
        u.pitch = 1.05;
        u.onend = next;
        u.onerror = () => setBrowserTtsState("error");
        synth.speak(u);
      };
      next();
    } catch (e) {
      console.error(e);
      setBrowserTtsState("error");
    }
  }

  function pauseResumeBrowser() {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    if (synth.paused) {
      synth.resume();
      setBrowserTtsState("speaking");
    } else if (synth.speaking) {
      synth.pause();
      setBrowserTtsState("paused");
    }
  }

  function stopBrowser() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setBrowserTtsState("idle");
  }

  // Stop any in-flight browser TTS when the component unmounts or voice changes.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
                  : audioErr === "rate_limited"
                  ? browserTtsAvailable
                    ? "Studio voice is busy today — tap 'Read aloud on this device' below for free playback."
                    : "Studio voice is busy today. Read the sheets below."
                  : audioErr
                  ? browserTtsAvailable
                    ? "Studio audio unavailable - tap 'Read aloud on this device' below."
                    : "Audio unavailable - read the sheets below."
                  : "Loading audio (first time may take 20-30s)..."}
              </div>
            </div>
          </div>
          {audioErr === "rate_limited" ? null : (
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
          )}

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

          {/* BROWSER TTS FALLBACK — works on every phone/tablet, free, offline. */}
          {audioErr && browserTtsAvailable ? (
            <div
              style={{
                marginTop: 10,
                padding: 12,
                background: "#EAF3FB",
                border: `1px solid ${ACCENT}33`,
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6, color: ACCENT }}>
                🔊 Use your device&apos;s built-in voice
              </div>
              <div style={{ color: "#555", marginBottom: 8 }}>
                Studio audio isn&apos;t available right now. Your phone or tablet
                can read the lesson aloud instead — works everywhere, no data needed.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {browserTtsState === "idle" || browserTtsState === "done" || browserTtsState === "error" ? (
                  <button
                    type="button"
                    onClick={speakWithBrowser}
                    className="btn"
                    style={{ background: ACCENT, color: "#fff" }}
                  >
                    ▶ Read aloud on this device
                  </button>
                ) : null}
                {browserTtsState === "loading" ? (
                  <span style={{ color: "#666" }}>Preparing script…</span>
                ) : null}
                {browserTtsState === "speaking" ? (
                  <>
                    <button
                      type="button"
                      onClick={pauseResumeBrowser}
                      className="btn"
                      style={{ background: "#fff", color: ACCENT, border: `1px solid ${ACCENT}` }}
                    >
                      ⏸ Pause
                    </button>
                    <button
                      type="button"
                      onClick={stopBrowser}
                      className="btn"
                      style={{ background: "#fff", color: "#666", border: "1px solid #ccc" }}
                    >
                      ⏹ Stop
                    </button>
                  </>
                ) : null}
                {browserTtsState === "paused" ? (
                  <>
                    <button
                      type="button"
                      onClick={pauseResumeBrowser}
                      className="btn"
                      style={{ background: ACCENT, color: "#fff" }}
                    >
                      ▶ Resume
                    </button>
                    <button
                      type="button"
                      onClick={stopBrowser}
                      className="btn"
                      style={{ background: "#fff", color: "#666", border: "1px solid #ccc" }}
                    >
                      ⏹ Stop
                    </button>
                  </>
                ) : null}
                {browserTtsState === "error" ? (
                  <span style={{ color: PRIMARY }}>
                    Couldn&apos;t start the device voice. Please use the printed sheet below.
                  </span>
                ) : null}
              </div>
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
