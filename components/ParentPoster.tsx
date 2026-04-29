import * as React from "react";
import type { Plan } from "@/lib/schema";

const PRIMARY = "#C02942";
const ACCENT = "#185A9D";
const GOLD = "#F2B705";
const DARK = "#28283C";
const LIGHT = "#FAF5EB";
const PARENT_BG = "#FFF4E6";

// Every <div> that has any children must declare a display value (Satori rule).
const D = { display: "flex" } as const;
const COL = { display: "flex", flexDirection: "column" as const };

export default function ParentPoster({ plan }: { plan: Plan }) {
  return (
    <div
      style={{
        width: 1240,
        height: 1754,
        background: "#FFFAF0",
        ...COL,
        fontFamily: "Noto, Inter, Arial, sans-serif",
        color: DARK,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: PRIMARY,
          color: LIGHT,
          padding: "24px 40px",
          ...D,
          alignItems: "center",
          gap: 24,
          borderBottom: `8px solid ${GOLD}`,
        }}
      >
        <Logo />
        <div style={{ ...COL, flex: 1 }}>
          <div style={{ ...D, fontSize: 44, fontWeight: 800 }}>
            FIRST STEP SCHOOL
          </div>
          <div style={{ ...D, fontSize: 22, color: GOLD, marginTop: 2 }}>
            Saurabh Vihar - Where Little Steps Become Big Dreams
          </div>
          <div style={{ ...D, fontSize: 20, marginTop: 4 }}>
            {`Parent Notice - ${plan.class_name}`}
          </div>
        </div>
        <div
          style={{
            background: LIGHT,
            color: DARK,
            border: `3px solid ${GOLD}`,
            borderRadius: 14,
            padding: "10px 18px",
            ...COL,
            minWidth: 220,
          }}
        >
          <div style={{ ...D, fontSize: 16, color: PRIMARY, fontWeight: 700 }}>
            TOMORROW
          </div>
          <div style={{ ...D, fontSize: 26, fontWeight: 800 }}>
            {plan.weekday}
          </div>
          <div style={{ ...D, fontSize: 18, color: ACCENT }}>
            {formatDate(plan.date_iso)}
          </div>
        </div>
      </div>

      {/* TITLE */}
      <div style={{ padding: "20px 40px 0", ...COL }}>
        <div style={{ ...D, fontSize: 28, fontWeight: 800, color: PRIMARY }}>
          Dear Parents,
        </div>
        <div style={{ ...D, fontSize: 22, marginTop: 6 }}>
          Here is what your child will learn tomorrow. Please support 5-10
          minutes of revision at home.
        </div>
      </div>

      {/* FESTIVAL */}
      {plan.festival_today ? (
        <div
          style={{
            margin: "16px 40px 0",
            background: "#FFEBC8",
            border: `3px solid ${GOLD}`,
            borderRadius: 14,
            padding: "12px 18px",
            ...COL,
          }}
        >
          <div style={{ ...D, fontSize: 22, fontWeight: 800, color: PRIMARY }}>
            {`FESTIVAL NOTICE - ${plan.festival_today.name}`}
          </div>
          <div style={{ ...D, fontSize: 18, marginTop: 4 }}>
            {plan.festival_today.closed
              ? "School will remain CLOSED."
              : "School will function as usual."}
          </div>
          <div style={{ ...D, fontSize: 16, color: ACCENT, marginTop: 2 }}>
            {plan.festival_today.note}
          </div>
          {plan.festival_today.note_hi ? (
            <div style={{ ...D, fontSize: 15, color: DARK, marginTop: 1 }}>
              {plan.festival_today.note_hi}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* SUBJECTS */}
      <div
        style={{
          margin: "20px 40px 0",
          background: PARENT_BG,
          border: `3px solid ${PRIMARY}`,
          borderRadius: 18,
          padding: "20px 22px",
          ...COL,
        }}
      >
        <div
          style={{
            ...D,
            fontSize: 22,
            fontWeight: 800,
            color: PRIMARY,
            marginBottom: 12,
          }}
        >
          TOMORROW&apos;S COVERAGE
        </div>
        {plan.parents.map((p, i) => (
          <div
            key={i}
            style={{
              ...D,
              marginBottom: 12,
              borderBottom:
                i === plan.parents.length - 1 ? "none" : "1px dashed #ccc",
              paddingBottom: 10,
            }}
          >
            <div
              style={{
                ...D,
                background: PRIMARY,
                color: LIGHT,
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 18,
                fontWeight: 700,
                minWidth: 130,
                height: 32,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {p.subject}
            </div>
            <div style={{ marginLeft: 16, ...COL, flex: 1 }}>
              <div style={{ ...D, fontSize: 20, fontWeight: 700 }}>
                {p.topic}
              </div>
              {p.topic_hi ? (
                <div style={{ ...D, fontSize: 17, fontWeight: 600, color: DARK, marginTop: 1 }}>
                  {p.topic_hi}
                </div>
              ) : null}
              <div style={{ ...D, fontSize: 16, color: ACCENT, marginTop: 4 }}>
                {`Home tip: ${p.home_tip}`}
              </div>
              {p.home_tip_hi ? (
                <div style={{ ...D, fontSize: 15, color: DARK, marginTop: 1 }}>
                  {`घर पर सुझाव: ${p.home_tip_hi}`}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* HOMEWORK */}
      <div
        style={{
          margin: "16px 40px 0",
          background: GOLD,
          color: DARK,
          padding: "14px 20px",
          borderRadius: 12,
          ...COL,
        }}
      >
        <div style={{ ...D, fontSize: 20, fontWeight: 700 }}>
          {`HOMEWORK: ${plan.homework}`}
        </div>
        {plan.homework_hi ? (
          <div style={{ ...D, fontSize: 17, fontWeight: 600, marginTop: 2 }}>
            {`गृहकार्य: ${plan.homework_hi}`}
          </div>
        ) : null}
      </div>

      {/* HOW PARENTS HELP */}
      <div
        style={{
          margin: "16px 40px 0",
          background: "#E8F4FD",
          border: `3px solid ${ACCENT}`,
          borderRadius: 14,
          padding: "16px 20px",
          ...COL,
        }}
      >
        <div style={{ ...D, fontSize: 20, fontWeight: 800, color: ACCENT }}>
          HOW PARENTS CAN HELP TONIGHT
        </div>
        <div style={{ ...D, fontSize: 16, marginTop: 6 }}>
          1. Sit with your child for 10 minutes after dinner and revise the
          topics above.
        </div>
        <div style={{ ...D, fontSize: 16, marginTop: 4 }}>
          2. Sign the school diary and pack the bag with the correct books.
        </div>
        <div style={{ ...D, fontSize: 16, marginTop: 4 }}>
          3. Encourage early sleep (by 9:30 PM) and a healthy breakfast.
        </div>
        <div style={{ ...D, fontSize: 16, marginTop: 4 }}>
          4. Reply to the class WhatsApp group with a thumbs-up so we know you
          have read this.
        </div>
      </div>

      <div style={{ flex: 1, ...D }} />

      {/* FOOTER */}
      <div
        style={{
          background: PRIMARY,
          color: LIGHT,
          padding: "14px 40px",
          ...D,
          justifyContent: "space-between",
          borderTop: `8px solid ${GOLD}`,
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        <div style={D}>First Step School - Saurabh Vihar - Parent Notice</div>
        <div style={{ ...D, color: GOLD }}>{`Class: ${plan.class_name}`}</div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function Logo() {
  return (
    <div
      style={{
        width: 110,
        height: 110,
        borderRadius: 55,
        background: LIGHT,
        border: `4px solid ${GOLD}`,
        ...D,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ ...D, fontSize: 46, fontWeight: 900, color: PRIMARY }}>
        1
      </div>
      <div
        style={{
          position: "absolute",
          bottom: -8,
          background: GOLD,
          color: PRIMARY,
          padding: "1px 8px",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 800,
          ...D,
        }}
      >
        FIRST STEP
      </div>
    </div>
  );
}
