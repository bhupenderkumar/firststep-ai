import * as React from "react";
import type { Plan } from "@/lib/schema";

const PRIMARY = "#C02942";
const ACCENT = "#185A9D";
const GOLD = "#F2B705";
const GREEN = "#2E8B57";
const DARK = "#28283C";
const LIGHT = "#FAF5EB";
const TEACHER_BG = "#E8F4FD";

const D = { display: "flex" } as const;
const COL = { display: "flex", flexDirection: "column" as const };

export default function TeacherPoster({ plan }: { plan: Plan }) {
  const v = plan.video_activity;
  const dateStr = formatDate(plan.date_iso);
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
          background: ACCENT,
          color: LIGHT,
          padding: "20px 40px",
          ...D,
          alignItems: "center",
          gap: 24,
          borderBottom: `8px solid ${GOLD}`,
        }}
      >
        <Logo />
        <div style={{ ...COL, flex: 1 }}>
          <div style={{ ...D, fontSize: 40, fontWeight: 800 }}>
            FIRST STEP SCHOOL
          </div>
          <div style={{ ...D, fontSize: 20, color: GOLD, marginTop: 2 }}>
            Teacher Brief - For substitute / new teachers also
          </div>
          <div style={{ ...D, fontSize: 18, marginTop: 2 }}>
            {`${plan.class_name} - ${plan.weekday}, ${dateStr}`}
          </div>
        </div>
        <div
          style={{
            background: LIGHT,
            color: DARK,
            border: `3px solid ${GOLD}`,
            borderRadius: 12,
            padding: "8px 14px",
            ...COL,
            minWidth: 200,
          }}
        >
          <div style={{ ...D, fontSize: 14, color: ACCENT, fontWeight: 700 }}>
            ACTIVITY
          </div>
          <div style={{ ...D, fontSize: 18, fontWeight: 800 }}>
            Video Capsule
          </div>
          <div style={{ ...D, fontSize: 16, color: PRIMARY }}>
            {`${v.duration_sec}s, curriculum-linked`}
          </div>
        </div>
      </div>

      {/* INSTRUCTIONS BOX */}
      <div
        style={{
          margin: "16px 30px 0",
          background: "#FFEBC8",
          border: `3px solid ${GOLD}`,
          borderRadius: 12,
          padding: "12px 18px",
          ...COL,
        }}
      >
        <div style={{ ...D, fontSize: 18, fontWeight: 800, color: PRIMARY }}>
          IF YOU ARE A SUBSTITUTE OR NEW TEACHER, READ THIS FIRST
        </div>
        <div style={{ ...D, fontSize: 14, marginTop: 4 }}>
          1. Greet the class - take attendance - write the date on the board.
        </div>
        <div style={{ ...D, fontSize: 14, marginTop: 2 }}>
          2. Cover each subject row from the Parents notice in order. 10-12
          minutes per subject is enough.
        </div>
        <div style={{ ...D, fontSize: 14, marginTop: 2 }}>
          3. After lunch, do the Video Activity below. A worked example is
          shown on this page - copy that structure.
        </div>
        <div style={{ ...D, fontSize: 14, marginTop: 2 }}>
          4. Write the same homework in every child&apos;s diary and sign it.
          Do not skip the homework column.
        </div>
        <div style={{ ...D, fontSize: 14, marginTop: 2 }}>
          5. End the day with a 1-line reflection from each child: &quot;Today
          I learned ____.&quot;
        </div>
      </div>

      {/* COVERAGE TABLE */}
      <div
        style={{
          margin: "14px 30px 0",
          background: TEACHER_BG,
          border: `3px solid ${ACCENT}`,
          borderRadius: 12,
          padding: "12px 16px",
          ...COL,
        }}
      >
        <div
          style={{
            ...D,
            fontSize: 18,
            fontWeight: 800,
            color: ACCENT,
            marginBottom: 6,
          }}
        >
          TODAY&apos;S COVERAGE (mirror the Parent notice)
        </div>
        {plan.parents.map((p, i) => (
          <div key={i} style={{ ...D, marginTop: 4, fontSize: 14 }}>
            <div
              style={{
                ...D,
                minWidth: 110,
                fontWeight: 700,
                color: PRIMARY,
              }}
            >
              {p.subject}
            </div>
            <div style={{ ...D, flex: 1 }}>{p.topic}</div>
          </div>
        ))}
        <div
          style={{
            ...D,
            fontSize: 14,
            marginTop: 6,
            fontWeight: 700,
            color: GREEN,
          }}
        >
          {`Homework: ${plan.homework}`}
        </div>
      </div>

      {/* VIDEO ACTIVITY */}
      <div
        style={{
          margin: "14px 30px 0",
          background: "#FFFFFF",
          border: `3px solid ${PRIMARY}`,
          borderRadius: 12,
          padding: "12px 18px",
          ...COL,
        }}
      >
        <div style={{ ...D, fontSize: 18, fontWeight: 800, color: PRIMARY }}>
          {`VIDEO ACTIVITY: ${v.title}`}
        </div>
        <div style={{ ...D, fontSize: 14, color: ACCENT, marginTop: 2 }}>
          {`Curriculum links: ${v.curriculum_links.join(" + ")}`}
        </div>
        <div style={{ ...D, marginTop: 8, gap: 14 }}>
          <div style={{ ...COL, flex: 1 }}>
            <div style={{ ...D, fontSize: 14, fontWeight: 800, color: ACCENT }}>
              PLAN (today, before school ends)
            </div>
            {v.plan_steps.slice(0, 6).map((s, i) => (
              <div key={i} style={{ ...D, fontSize: 12, marginTop: 3 }}>
                {`${i + 1}. ${s}`}
              </div>
            ))}
          </div>
          <div style={{ ...COL, flex: 1 }}>
            <div style={{ ...D, fontSize: 14, fontWeight: 800, color: ACCENT }}>
              SHOOT (during activity period)
            </div>
            {v.shoot_steps.slice(0, 8).map((s, i) => (
              <div key={i} style={{ ...D, fontSize: 12, marginTop: 3 }}>
                {`${i + 1}. ${s}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WORKED EXAMPLE */}
      <div
        style={{
          margin: "14px 30px 0",
          background: "#F2F8F2",
          border: `3px solid ${GREEN}`,
          borderRadius: 12,
          padding: "12px 18px",
          ...COL,
        }}
      >
        <div style={{ ...D, fontSize: 18, fontWeight: 800, color: GREEN }}>
          WORKED EXAMPLE - copy this structure
        </div>
        <div style={{ ...D, fontSize: 14, marginTop: 6, fontWeight: 700 }}>
          Sample 3-minute video: &quot;My Body &amp; My Plant Friends&quot; (UKG)
        </div>
        <div style={{ ...D, fontSize: 13, marginTop: 4 }}>
          {`0:00-0:15 - WIDE SHOT: 12 children wave at the camera and chant "Namaste, we are ${plan.class_name}, First Step School!"`}
        </div>
        <div style={{ ...D, fontSize: 13, marginTop: 3 }}>
          0:15-1:00 - 4 children, one by one, point to a body part and say its
          name. Example script: &quot;These are my eyes. I see with my
          eyes.&quot;
        </div>
        <div style={{ ...D, fontSize: 13, marginTop: 3 }}>
          1:00-1:45 - 4 children hold a leaf or potted plant. Each says one
          line: &quot;This is a Tulsi plant. We use it for tea.&quot;
        </div>
        <div style={{ ...D, fontSize: 13, marginTop: 3 }}>
          1:45-2:30 - Whole class chants Table of 3 with claps, then Table of 5.
        </div>
        <div style={{ ...D, fontSize: 13, marginTop: 3 }}>
          2:30-3:00 - All children wave and say: &quot;Thank you Mumma-Papa!&quot;
        </div>
        <div
          style={{
            ...D,
            fontSize: 13,
            marginTop: 6,
            color: PRIMARY,
            fontWeight: 700,
          }}
        >
          {`Caption to send: "${plan.class_name} Daily Learning - ${dateStr} - First Step School, Saurabh Vihar."`}
        </div>
      </div>

      {/* SAFETY DOs / DON'Ts */}
      <div style={{ margin: "14px 30px 0", ...D, gap: 14 }}>
        <div
          style={{
            flex: 1,
            background: "#F2F8F2",
            border: `2px solid ${GREEN}`,
            borderRadius: 10,
            padding: "10px 14px",
            ...COL,
          }}
        >
          <div style={{ ...D, fontSize: 14, fontWeight: 800, color: GREEN }}>
            DO
          </div>
          {v.safety_dos.map((s, i) => (
            <div key={i} style={{ ...D, fontSize: 12, marginTop: 3 }}>
              {`- ${s}`}
            </div>
          ))}
        </div>
        <div
          style={{
            flex: 1,
            background: "#FCE8EC",
            border: `2px solid ${PRIMARY}`,
            borderRadius: 10,
            padding: "10px 14px",
            ...COL,
          }}
        >
          <div style={{ ...D, fontSize: 14, fontWeight: 800, color: PRIMARY }}>
            DO NOT
          </div>
          {v.safety_donts.map((s, i) => (
            <div key={i} style={{ ...D, fontSize: 12, marginTop: 3 }}>
              {`- ${s}`}
            </div>
          ))}
        </div>
      </div>

      {/* SIGN-OFF STRIP */}
      <div
        style={{
          margin: "14px 30px 0",
          border: `2px dashed ${DARK}`,
          borderRadius: 10,
          padding: "10px 16px",
          ...D,
          fontSize: 13,
          gap: 24,
        }}
      >
        <div style={D}>Substitute / Class Teacher Name: ____________________</div>
        <div style={D}>Signature: ______________</div>
        <div style={D}>Time: ______</div>
      </div>

      <div style={{ flex: 1, ...D }} />

      {/* FOOTER */}
      <div
        style={{
          background: ACCENT,
          color: LIGHT,
          padding: "10px 30px",
          ...D,
          justifyContent: "space-between",
          borderTop: `8px solid ${GOLD}`,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        <div style={D}>
          First Step School - Saurabh Vihar - Teacher Brief (A4)
        </div>
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
        width: 90,
        height: 90,
        borderRadius: 45,
        background: LIGHT,
        border: `3px solid ${GOLD}`,
        ...D,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ ...D, fontSize: 36, fontWeight: 900, color: PRIMARY }}>
        1
      </div>
      <div
        style={{
          position: "absolute",
          bottom: -8,
          background: GOLD,
          color: PRIMARY,
          padding: "1px 6px",
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 800,
          ...D,
        }}
      >
        FIRST STEP
      </div>
    </div>
  );
}
