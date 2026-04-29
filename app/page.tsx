"use client";

import { useEffect, useState } from "react";
import { CLASS_OPTIONS } from "@/lib/constants";

const ADMIN_KEY_STORAGE = "firststep_admin_key_v1";

export default function Home() {
  const [adminKey, setAdminKey] = useState<string>("");
  const [adminKeyDraft, setAdminKeyDraft] = useState<string>("");
  const [className, setClassName] = useState<string>(CLASS_OPTIONS[1]); // KG
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planPayload, setPlanPayload] = useState<string | null>(null);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<
    "idle" | "warming" | "ready" | "failed"
  >("idle");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ADMIN_KEY_STORAGE)
        : null;
    if (saved) setAdminKey(saved);
  }, []);

  function saveAdminKey() {
    const k = adminKeyDraft.trim();
    if (!k) return;
    window.localStorage.setItem(ADMIN_KEY_STORAGE, k);
    setAdminKey(k);
    setAdminKeyDraft("");
  }

  function clearAdminKey() {
    window.localStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey("");
  }

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
    setShortCode(null);
    setAudioStatus("idle");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ className, text, imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          clearAdminKey();
        }
        throw new Error(data.error || "Failed");
      }
      setPlanId(data.id);
      setPlanPayload(data.p);
      setShortCode(data.shortCode || null);
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
      {!adminKey ? (
        <div
          style={{
            border: "2px solid #C02942",
            borderRadius: 14,
            padding: 24,
            background: "#FFF4E6",
            marginTop: 24,
          }}
        >
          <h2 style={{ marginTop: 0, color: "#C02942" }}>Staff login</h2>
          <p style={{ color: "#444" }}>
            Only school staff can generate daily plans. Enter the admin
            password shared with you. (Parents do <strong>not</strong> need a
            password — they just open the share link.)
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="password"
              value={adminKeyDraft}
              onChange={(e) => setAdminKeyDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveAdminKey();
              }}
              placeholder="Admin password"
              style={{
                flex: 1,
                minWidth: 220,
                padding: 12,
                fontSize: 16,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={saveAdminKey}
              disabled={!adminKeyDraft.trim()}
              style={{
                padding: "12px 24px",
                background: "#C02942",
                color: "#fff",
                border: 0,
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Unlock
            </button>
          </div>
        </div>
      ) : (
        <>
      <p>
        Upload tomorrow&apos;s diary photo or paste the topics. Groq generates
        two A4 PDFs / PNGs - one for parents, one for teachers (with worked
        example for substitute teachers).
      </p>
      <div style={{ fontSize: 12, color: "#666", marginTop: -8 }}>
        ✓ Logged in as staff.{" "}
        <button
          onClick={clearAdminKey}
          style={{
            background: "none",
            border: 0,
            color: "#185A9D",
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
            fontSize: 12,
          }}
        >
          Sign out
        </button>
      </div>

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
          <ShareCard payload={planPayload} shortCode={shortCode} />
        </div>
      ) : null}
        </>
      )}
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

function ShareCard({
  payload,
  shortCode,
}: {
  payload: string;
  shortCode: string | null;
}) {
  const [copiedKey, setCopiedKey] = useState<"" | "parent" | "teacher">("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const parentPath = shortCode ? `/s/${shortCode}` : `/p/${payload}`;
  const teacherPath = shortCode
    ? `/t/${shortCode}`
    : `/api/pdf?p=${payload}&view=teacher`;
  const parentUrl = origin ? `${origin}${parentPath}` : parentPath;
  const teacherUrl = origin ? `${origin}${teacherPath}` : teacherPath;

  async function copy(url: string, which: "parent" | "teacher") {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(which);
      setTimeout(() => setCopiedKey(""), 1500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  const parentWaText = `🌟 Tomorrow's plan from First Step School (with audio narration in English + Hindi):\n${parentUrl}`;
  const teacherWaText = `📄 Tomorrow's teacher A4 sheet — First Step School (substitute-teacher ready):\n${teacherUrl}`;
  const parentWa = `https://wa.me/?text=${encodeURIComponent(parentWaText)}`;
  const teacherWa = `https://wa.me/?text=${encodeURIComponent(teacherWaText)}`;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <ShareBlock
        title="👨‍👩‍👧 Share with PARENTS"
        subtitle="Audio narration + simple bilingual summary. No teacher content."
        url={parentUrl}
        path={parentPath}
        waHref={parentWa}
        accent="#C02942"
        onCopy={() => copy(parentUrl, "parent")}
        copied={copiedKey === "parent"}
        openLabel="▶ Preview parent page"
      />
      <ShareBlock
        title="🧑‍🏫 Share with TEACHERS"
        subtitle="Full teacher A4 PDF with worked example for substitute teachers."
        url={teacherUrl}
        path={teacherPath}
        waHref={teacherWa}
        accent="#185A9D"
        onCopy={() => copy(teacherUrl, "teacher")}
        copied={copiedKey === "teacher"}
        openLabel="📄 Open teacher PDF"
      />
    </div>
  );
}

function ShareBlock({
  title,
  subtitle,
  url,
  path,
  waHref,
  accent,
  onCopy,
  copied,
  openLabel,
}: {
  title: string;
  subtitle: string;
  url: string;
  path: string;
  waHref: string;
  accent: string;
  onCopy: () => void;
  copied: boolean;
  openLabel: string;
}) {
  return (
    <div
      style={{
        border: `2px solid ${accent}`,
        borderRadius: 16,
        padding: 16,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 18, color: accent }}>{title}</div>
      <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{subtitle}</div>
      <div
        style={{
          fontFamily: "monospace",
          background: "#F4F6FB",
          padding: 12,
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 700,
          wordBreak: "break-all",
          color: "#333",
          marginTop: 10,
          textAlign: "center",
        }}
      >
        {url}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
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
        <button
          onClick={onCopy}
          style={{
            padding: "10px 16px",
            background: accent,
            color: "#fff",
            border: 0,
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {copied ? "✓ Copied!" : "🔗 Copy link"}
        </button>
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "10px 16px",
            background: "#fff",
            color: accent,
            border: `2px solid ${accent}`,
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {openLabel}
        </a>
      </div>
    </div>
  );
}
