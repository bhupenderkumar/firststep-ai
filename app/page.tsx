"use client";

import { useState } from "react";
import { CLASS_OPTIONS } from "@/lib/constants";

export default function Home() {
  const [className, setClassName] = useState<string>(CLASS_OPTIONS[1]); // KG
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planPayload, setPlanPayload] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<
    "idle" | "warming" | "ready" | "failed"
  >("idle");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const b64 = btoa(
      new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), "")
    );
    setImageBase64(b64);
  }

  async function warmAudio(p: string) {
    setAudioStatus("warming");
    try {
      // Warm CDN cache for the default voice. Subsequent landing-page loads
      // will hit Vercel's edge cache and play instantly.
      const r = await fetch(`/api/voice?p=${p}&voice=hannah`);
      if (r.ok && (r.headers.get("content-type") || "").includes("audio")) {
        setAudioStatus("ready");
      } else {
        setAudioStatus("failed");
      }
    } catch {
      setAudioStatus("failed");
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setPlanId(null);
    setPlanPayload(null);
    setAudioStatus("idle");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ className, text, imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPlanId(data.id);
      setPlanPayload(data.p);
      // Fire-and-forget audio pre-generation so parents get instant playback.
      warmAudio(data.p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: 24 }}>
      <h1 style={{ color: "#C02942" }}>First Step School - Daily Plan</h1>
      <p>
        Upload tomorrow&apos;s diary photo or paste the topics. Groq generates
        two A4 PDFs / PNGs - one for parents, one for teachers (with worked
        example for substitute teachers).
      </p>

      <label style={{ display: "block", marginTop: 16 }}>
        <div style={{ fontWeight: 700 }}>Class</div>
        <select
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          style={{ width: "100%", padding: 10, fontSize: 16 }}
        >
          {CLASS_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: "block", marginTop: 16 }}>
        <div style={{ fontWeight: 700 }}>Diary photo (optional)</div>
        <input type="file" accept="image/*" onChange={onFile} />
      </label>

      <label style={{ display: "block", marginTop: 16 }}>
        <div style={{ fontWeight: 700 }}>Or type the topics</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: 10, fontSize: 16 }}
          placeholder={
            "EVS - Myself\nEnglish - Aa to Zz\nMath - Table of 5\nComputer - Parts of Computer"
          }
        />
      </label>

      <button
        onClick={generate}
        disabled={loading || (!text && !imageBase64)}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          background: "#C02942",
          color: "#FAF5EB",
          border: 0,
          borderRadius: 10,
          fontSize: 18,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      {error ? (
        <div style={{ color: "#C02942", marginTop: 16 }}>{error}</div>
      ) : null}

      {planId && planPayload ? (
        <div style={{ marginTop: 32 }}>
          <h2>Your share link is ready ✨</h2>
          <p style={{ fontSize: 14, color: "#555" }}>
            One link → opens a friendly landing page with audio narration,
            English+Hindi summary, both A4 sheets, and a print-to-PDF button.
            Forward it on WhatsApp.
          </p>
          <AudioStatusPill status={audioStatus} />
          <ShareCard payload={planPayload} />
        </div>
      ) : null}
    </main>
  );
}

function AudioStatusPill({
  status,
}: {
  status: "idle" | "warming" | "ready" | "failed";
}) {
  if (status === "idle") return null;
  const map = {
    warming: { bg: "#FFF4D6", color: "#7A5B00", text: "🎧 Pre-generating audio for parents… (20–30s)" },
    ready: { bg: "#DDF5DD", color: "#246B36", text: "✓ Audio ready – parents will hear instant playback when they open the link." },
    failed: {
      bg: "#FFE9EC",
      color: "#A11A30",
      text: "⚠️ Audio pre-generation failed (TTS terms?). Parents can still read the sheets; audio will retry on open.",
    },
  } as const;
  const s = map[status];
  return (
    <div
      style={{
        background: s.bg,
        color: s.color,
        padding: "10px 14px",
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {s.text}
    </div>
  );
}

function ShareCard({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false);
  const landingPath = `/p/${payload}`;
  const fullUrl =
    typeof window !== "undefined"
      ? new URL(landingPath, window.location.origin).toString()
      : landingPath;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", fullUrl);
    }
  }

  const waText = `Tomorrow's plan from First Step School (with audio narration):\n${fullUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div
      style={{
        border: "2px solid #185A9D",
        borderRadius: 16,
        padding: 16,
        background: "#fff",
      }}
    >
      <div
        style={{
          fontFamily: "monospace",
          background: "#F4F6FB",
          padding: 12,
          borderRadius: 8,
          fontSize: 13,
          wordBreak: "break-all",
          color: "#333",
        }}
      >
        {fullUrl}
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        <a
          href={landingPath}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "10px 16px",
            background: "#185A9D",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ▶ Open landing page
        </a>
        <button
          onClick={copyLink}
          style={{
            padding: "10px 16px",
            background: "#C02942",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {copied ? "✓ Copied!" : "🔗 Copy share link"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "10px 16px",
            background: "#25D366",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          💬 Share on WhatsApp
        </a>
      </div>
      <p style={{ fontSize: 13, color: "#666", marginTop: 12 }}>
        Tip: the landing page works for parents (audio + simple summary) and for
        teachers (full A4 sheets + worked example). Just one link does it all.
      </p>
    </div>
  );
}
