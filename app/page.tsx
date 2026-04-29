"use client";

import { useState } from "react";

export default function Home() {
  const [className, setClassName] = useState("UKG - A");
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
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
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ className, text, imageBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPlanId(data.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <h1 style={{ color: "#C02942" }}>First Step School - Daily Plan</h1>
      <p>Upload tomorrow&apos;s diary photo or paste the topics. Groq does the rest.</p>

      <label style={{ display: "block", marginTop: 16 }}>
        <div>Class</div>
        <input
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          style={{ width: "100%", padding: 10, fontSize: 16 }}
        />
      </label>

      <label style={{ display: "block", marginTop: 16 }}>
        <div>Diary photo (optional)</div>
        <input type="file" accept="image/*" onChange={onFile} />
      </label>

      <label style={{ display: "block", marginTop: 16 }}>
        <div>Or type the topics</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          style={{ width: "100%", padding: 10, fontSize: 16 }}
          placeholder={"EVS - Myself\nEnglish - Aa to Zz\nMath - Table of 5\nComputer - Parts of Computer"}
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

      {error ? <div style={{ color: "#C02942", marginTop: 16 }}>{error}</div> : null}

      {planId ? (
        <div style={{ marginTop: 32 }}>
          <h2>Preview</h2>
          <a href={`/api/render?id=${planId}`} target="_blank" rel="noreferrer">
            <img
              src={`/api/render?id=${planId}`}
              alt="Plan preview"
              style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8 }}
            />
          </a>
          <p>
            Direct PNG: <code>/api/render?id={planId}</code>
          </p>
        </div>
      ) : null}
    </main>
  );
}
