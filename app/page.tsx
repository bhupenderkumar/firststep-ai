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

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const b64 = btoa(
      new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), "")
    );
    setImageBase64(b64);
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setPlanId(null);
    setPlanPayload(null);
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
          <h2>Two A4 sheets ready</h2>
          <p style={{ fontSize: 14, color: "#555" }}>
            These links are permanent (the plan is encoded inside the URL) -
            share them on WhatsApp or save the PNGs.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            <PreviewCard
              title="For Parents (English + हिंदी)"
              href={`/api/render?p=${planPayload}&view=parent`}
              accent="#C02942"
            />
            <PreviewCard
              title="For Teachers (with worked example)"
              href={`/api/render?p=${planPayload}&view=teacher`}
              accent="#185A9D"
            />
          </div>
        </div>
      ) : null}
    </main>
  );
}

function PreviewCard({
  title,
  href,
  accent,
}: {
  title: string;
  href: string;
  accent: string;
}) {
  const [copied, setCopied] = useState(false);
  const fullUrl =
    typeof window !== "undefined" ? new URL(href, window.location.origin).toString() : href;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select the text
      window.prompt("Copy this link:", fullUrl);
    }
  }

  const waText = `Tomorrow's plan from First Step School:\n${fullUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div
      style={{
        border: `2px solid ${accent}`,
        borderRadius: 12,
        padding: 12,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 800, color: accent, marginBottom: 8 }}>
        {title}
      </div>
      <a href={href} target="_blank" rel="noreferrer">
        <img
          src={href}
          alt={title}
          style={{ width: "100%", border: "1px solid #ddd", borderRadius: 6 }}
        />
      </a>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        <button
          onClick={copyLink}
          style={{
            padding: "8px 14px",
            background: accent,
            color: "#fff",
            border: 0,
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {copied ? "Copied!" : "Copy share link"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "8px 14px",
            background: "#25D366",
            color: "#fff",
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Share on WhatsApp
        </a>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: "8px 14px",
            background: "#eee",
            color: "#333",
            borderRadius: 8,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Open PNG
        </a>
      </div>
    </div>
  );
}
