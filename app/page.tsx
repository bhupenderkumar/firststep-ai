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
    "idle" | "warming" | "ready" | "cached" | "rate_limited" | "failed"
  >("idle");
  const [audioStatusDetail, setAudioStatusDetail] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");

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
    // FileReader is mobile-safe — handles large camera photos without blowing
    // the call stack the way `btoa(reduce)` does on big inputs.
    const dataUrl: string = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(fr.error || new Error("read failed"));
      fr.onload = () => resolve(String(fr.result));
      fr.readAsDataURL(file);
    });
    // Strip "data:<mime>;base64," prefix → keep only base64 bytes.
    const b64 = dataUrl.split(",")[1] || "";
    setImageBase64(b64);
  }

  async function warmAudio(p: string) {
    setAudioStatus("warming");
    setAudioStatusDetail("");
    try {
      // Warm CDN + Supabase cache for the default voice. Subsequent landing-page
      // loads will hit the cached WAV and play instantly.
      const r = await fetch(`/api/voice?p=${p}&voice=hannah`);
      const ct = r.headers.get("content-type") || "";
      if (r.ok && ct.includes("audio")) {
        const wasCached = r.headers.get("x-cache") === "HIT";
        setAudioStatus(wasCached ? "cached" : "ready");
      } else if (r.status === 429) {
        // Daily TTS quota — parents will get the device-voice fallback. This
        // is NOT a fatal error: the page still works perfectly.
        setAudioStatus("rate_limited");
      } else {
        const text = await r.text().catch(() => "");
        setAudioStatus("failed");
        setAudioStatusDetail(text.slice(0, 200));
      }
    } catch (e) {
      setAudioStatus("failed");
      setAudioStatusDetail(e instanceof Error ? e.message : "network error");
    }
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setPlanId(null);
    setPlanPayload(null);
    setShortCode(null);
    setAudioStatus("idle");
    setAudioStatusDetail("");
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
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-dot">★</div>
          <span>First Step</span>
        </div>
        <div className="spacer" />
        {adminKey ? (
          <>
            <span className="chip muted hide-on-mobile">Staff</span>
            <button className="icon-btn" onClick={clearAdminKey} aria-label="Sign out">
              <span aria-hidden>↩</span>
              <span className="hide-on-mobile">Sign out</span>
            </button>
          </>
        ) : null}
      </header>

      {adminKey ? (
        <TabStrip active={activeTab} onChange={setActiveTab} />
      ) : null}

      <main className="page">
        {!adminKey ? (
          <LoginCard
            draft={adminKeyDraft}
            setDraft={setAdminKeyDraft}
            onSubmit={saveAdminKey}
          />
        ) : activeTab === "generate" ? (
          <>
            <div className="card hero">
              <h1>Plan tomorrow in one tap</h1>
              <p>
                Snap the diary or paste topics — we&apos;ll build the parent &
                teacher sheets, plus an English+Hindi audio narration.
              </p>
              <div className="row">
                <span className="chip">📚 {className}</span>
                <span className="chip muted">Auto-dated for tomorrow (IST)</span>
              </div>
            </div>

            <div className="split">
              <div>
                <div className="card">
                  <div className="card-title">Class</div>
                  <select
                    className="select"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  >
                    {CLASS_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="card">
                  <div className="card-title">Diary photo (optional)</div>
                  <FilePicker
                    hasFile={!!imageBase64}
                    onChange={onFile}
                    onClear={() => setImageBase64(null)}
                  />
                </div>

                <div className="card">
                  <div className="card-title">Or type the topics</div>
                  <textarea
                    className="textarea"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={6}
                    placeholder={
                      "EVS - Myself\nEnglish - Aa to Zz\nMath - Table of 5\nComputer - Parts of Computer"
                    }
                  />
                  <div className="field-help">
                    Tip: one subject per line works best.
                  </div>
                </div>

                <button
                  onClick={generate}
                  disabled={loading || (!text && !imageBase64)}
                  className="btn btn-primary btn-block hide-on-mobile"
                  style={{ marginTop: 4 }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" /> Generating…
                    </>
                  ) : (
                    <>✨ Generate Plan</>
                  )}
                </button>

                {error ? (
                  <div className="pill-status" style={{ background: "var(--err-50)", color: "var(--err)" }}>
                    <span className="glyph">⚠️</span>
                    <span>{error}</span>
                  </div>
                ) : null}
              </div>

              <div>
                {planId && planPayload ? (
                  <div className="card pop">
                    <div className="card-title">Share link ready ✨</div>
                    <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 13 }}>
                      One link → friendly landing page with audio, bilingual
                      summary, A4 sheets, and print-to-PDF. Forward on WhatsApp.
                    </p>
                    <AudioStatusPill status={audioStatus} detail={audioStatusDetail} />
                    <ShareCard payload={planPayload} shortCode={shortCode} />
                  </div>
                ) : (
                  <div className="card" style={{ background: "var(--surface-2)" }}>
                    <div className="card-title">What you&apos;ll get</div>
                    <ul style={{ paddingLeft: 18, margin: 0, color: "#444", fontSize: 14, lineHeight: 1.7 }}>
                      <li>👨‍👩‍👧 Parent landing page (audio + summary)</li>
                      <li>🧑‍🏫 Teacher A4 sheet with worked examples</li>
                      <li>🔗 Two short links to share on WhatsApp</li>
                      <li>📜 Auto-saved to History</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky CTA on mobile */}
            <div className={`sticky-cta ${(!planId || !planPayload) ? "show" : ""}`}>
              <button
                onClick={generate}
                disabled={loading || (!text && !imageBase64)}
                className="btn btn-primary btn-block"
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Generating…
                  </>
                ) : (
                  <>✨ Generate Plan</>
                )}
              </button>
            </div>
          </>
        ) : (
          <HistoryTable adminKey={adminKey} />
        )}
      </main>

      {adminKey ? (
        <nav className="bottom-nav">
          <button
            className={`item ${activeTab === "generate" ? "on" : ""}`}
            onClick={() => setActiveTab("generate")}
          >
            <span className="glyph">✨</span>
            <span>Generate</span>
          </button>
          <button
            className={`item ${activeTab === "history" ? "on" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span className="glyph">📜</span>
            <span>History</span>
          </button>
        </nav>
      ) : null}
    </div>
  );
}

// ─────────────── Login Card ───────────────
function LoginCard({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="card hero" style={{ marginTop: 20 }}>
      <h1>Staff login</h1>
      <p>
        Only school staff can generate daily plans. Parents do <strong>not</strong>{" "}
        need a password — they just open the share link.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <input
          className="input"
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="Admin password"
          style={{ flex: 1, minWidth: 220 }}
        />
        <button
          onClick={onSubmit}
          disabled={!draft.trim()}
          className="btn btn-primary"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

// ─────────────── File Picker ───────────────
function FilePicker({
  hasFile,
  onChange,
  onClear,
}: {
  hasFile: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <label className={`dropzone ${hasFile ? "has-file" : ""}`} style={{ display: "block", cursor: "pointer" }}>
      <div className="file-glyph">{hasFile ? "✅" : "📷"}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>
        {hasFile ? "Photo attached" : "Tap to take or pick a photo"}
      </div>
      <div className="file-msg">
        {hasFile
          ? "Tap again to replace."
          : "Snap the diary page from your phone — we OCR it."}
      </div>
      <input type="file" accept="image/*" onChange={onChange} />
      {hasFile ? (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="btn btn-ghost"
            style={{ height: 36, padding: "0 12px", fontSize: 13 }}
          >
            Remove photo
          </button>
        </div>
      ) : null}
    </label>
  );
}

// ─────────────── Tab Strip (desktop) ───────────────
function TabStrip({
  active,
  onChange,
}: {
  active: "generate" | "history";
  onChange: (t: "generate" | "history") => void;
}) {
  return (
    <div className="tab-strip" role="tablist">
      <button
        role="tab"
        aria-selected={active === "generate"}
        className={`tab ${active === "generate" ? "on" : ""}`}
        onClick={() => onChange("generate")}
      >
        ✨ Generate
      </button>
      <button
        role="tab"
        aria-selected={active === "history"}
        className={`tab ${active === "history" ? "on" : ""}`}
        onClick={() => onChange("history")}
      >
        📜 History
      </button>
    </div>
  );
}

function AudioStatusPill({
  status,
  detail,
}: {
  status: "idle" | "warming" | "ready" | "cached" | "rate_limited" | "failed";
  detail?: string;
}) {
  if (status === "idle") return null;
  const map = {
    warming: { bg: "var(--warn-50)", color: "var(--warn)", glyph: "🎧", text: "Pre-generating audio for parents… (20–30s on first time, instant if cached)" },
    ready: { bg: "var(--ok-50)", color: "var(--ok)", glyph: "✓", text: "Audio ready – parents will hear instant playback when they open the link." },
    cached: { bg: "var(--ok-50)", color: "var(--ok)", glyph: "✓", text: "Audio served from cache – instant playback for parents." },
    rate_limited: {
      bg: "var(--accent-50)",
      color: "var(--accent)",
      glyph: "ℹ️",
      text: "Studio voice is rate-limited today. Parents will see a 'Read aloud on this device' button — free, works on every device.",
    },
    failed: {
      bg: "var(--err-50)",
      color: "var(--err)",
      glyph: "⚠️",
      text: "Audio pre-generation hit an issue. Parents can still read the sheets and use the device-voice fallback button.",
    },
  } as const;
  const s = map[status];
  return (
    <div className="pill-status" style={{ background: s.bg, color: s.color }}>
      <span className="glyph">{s.glyph}</span>
      <div>
        <div>{s.text}</div>
        {detail && status === "failed" ? (
          <div style={{ fontSize: 11, fontWeight: 400, marginTop: 4, opacity: 0.9 }}>
            Detail: {detail}
          </div>
        ) : null}
      </div>
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

// ─────────────── History Table ───────────────
// Full audit trail. Real <table> on desktop, swipeable card list on mobile —
// both share the same data + filters + actions.

type HistoryRow = {
  id: string;
  class_name: string;
  date_iso: string;
  created_at: string;
  input_preview: string | null;
};

function HistoryTable({ adminKey }: { adminKey: string }) {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [copied, setCopied] = useState<string>("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/history?limit=100", {
        headers: { "x-admin-key": adminKey },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setRows(j.rows || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const filtered = (rows || []).filter((r) => {
    if (classFilter && r.class_name !== classFilter) return false;
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.class_name.toLowerCase().includes(q) ||
      r.date_iso.includes(q) ||
      (r.input_preview || "").toLowerCase().includes(q)
    );
  });

  const uniqueClasses = Array.from(
    new Set((rows || []).map((r) => r.class_name))
  ).sort();

  function copy(label: string, value: string) {
    navigator.clipboard?.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  return (
    <div>
      <div className="card compact" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="🔍 Search class, date, code, or text…"
            style={{ flex: 1, minWidth: 200, height: 42, padding: "0 14px" }}
          />
          <select
            className="select"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ width: "auto", minWidth: 130, height: 42, padding: "0 38px 0 14px" }}
          >
            <option value="">All classes</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            disabled={loading}
            className="btn"
            style={{ height: 42 }}
          >
            {loading ? "…" : "↻"}
          </button>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          {filtered.length} of {rows?.length ?? 0} {filtered.length === 1 ? "plan" : "plans"}
        </div>
      </div>

      {err ? (
        <div className="pill-status" style={{ background: "var(--err-50)", color: "var(--err)" }}>
          <span className="glyph">⚠️</span>
          <span>{err}</span>
        </div>
      ) : null}

      {/* Desktop: real table */}
      <div className="table-wrap hide-on-mobile">
        <table className="tbl">
          <thead>
            <tr>
              <th>When (IST)</th>
              <th>Class</th>
              <th>For date</th>
              <th>Code</th>
              <th style={{ minWidth: 220 }}>Diary preview</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !rows ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "var(--muted)" }}>
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 20, color: "var(--muted)" }}>
                  {rows && rows.length > 0 ? "No matches for this filter." : "No plans generated yet."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const parentUrl = `${origin}/s/${r.id}`;
                const teacherUrl = `${origin}/t/${r.id}`;
                const when = new Date(r.created_at).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                });
                return (
                  <tr key={r.id}>
                    <td>{when}</td>
                    <td><strong>{r.class_name}</strong></td>
                    <td>{r.date_iso}</td>
                    <td><code className="code-pill">{r.id}</code></td>
                    <td>
                      <span
                        title={r.input_preview || ""}
                        style={{
                          display: "inline-block",
                          maxWidth: 280,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          verticalAlign: "middle",
                          color: "#555",
                        }}
                      >
                        {r.input_preview || "—"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <a href={parentUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700, marginRight: 10, textDecoration: "none" }}>Parent</a>
                      <a href={teacherUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700, marginRight: 10, textDecoration: "none" }}>Teacher</a>
                      <button
                        onClick={() => copy(r.id, parentUrl)}
                        className="btn"
                        style={{ height: 30, padding: "0 10px", fontSize: 12 }}
                      >
                        {copied === r.id ? "✓" : "Copy"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="hist-list show-on-mobile">
        {loading && !rows ? (
          <>
            <div className="hist-card"><div className="skel" style={{ width: "60%" }} /><div className="skel" style={{ width: "30%", marginTop: 8 }} /></div>
            <div className="hist-card"><div className="skel" style={{ width: "70%" }} /><div className="skel" style={{ width: "40%", marginTop: 8 }} /></div>
          </>
        ) : filtered.length === 0 ? (
          <div className="hist-card" style={{ textAlign: "center", color: "var(--muted)" }}>
            {rows && rows.length > 0 ? "No matches for this filter." : "No plans yet — generate one ✨"}
          </div>
        ) : (
          filtered.map((r) => {
            const parentUrl = `${origin}/s/${r.id}`;
            const teacherUrl = `${origin}/t/${r.id}`;
            const when = new Date(r.created_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              dateStyle: "medium",
              timeStyle: "short",
            });
            return (
              <div className="hist-card" key={r.id}>
                <div className="hist-meta">
                  <div>
                    <strong>{r.class_name}</strong>
                    <span style={{ color: "var(--muted)", marginLeft: 6 }}>· {r.date_iso}</span>
                  </div>
                  <code className="code-pill">{r.id}</code>
                </div>
                <div className="when">{when}</div>
                {r.input_preview ? (
                  <div className="preview" title={r.input_preview}>{r.input_preview}</div>
                ) : null}
                <div className="actions">
                  <a href={parentUrl} target="_blank" rel="noreferrer">👨‍👩‍👧 Parent</a>
                  <a href={teacherUrl} target="_blank" rel="noreferrer">🧑‍🏫 Teacher</a>
                  <button
                    onClick={() => copy(r.id, parentUrl)}
                    className="btn"
                    style={{ height: 32, padding: "0 12px", fontSize: 12, marginLeft: "auto" }}
                  >
                    {copied === r.id ? "✓ copied" : "Copy parent"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
