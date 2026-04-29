import * as React from "react";
import type { Plan } from "@/lib/schema";

const PRIMARY = "#C02942";
const ACCENT = "#185A9D";
const GOLD = "#F2B705";
const GREEN = "#2E8B57";
const BG = "#FFFAF0";
const PARENT_BG = "#FFF4E6";
const TEACHER_BG = "#E8F4FD";
const LIGHT = "#FAF5EB";
const DARK = "#28283C";

export default function PlanPoster({ plan }: { plan: Plan }) {
  return (
    <div
      style={{
        width: 1600,
        height: 2520,
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, Arial, sans-serif",
        color: DARK,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: PRIMARY,
          color: LIGHT,
          padding: "32px 60px",
          display: "flex",
          alignItems: "center",
          gap: 32,
          borderBottom: `12px solid ${GOLD}`,
        }}
      >
        <Logo />
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: 1 }}>
            FIRST STEP SCHOOL
          </div>
          <div style={{ fontSize: 30, color: GOLD, marginTop: 4 }}>
            Saurabh Vihar &nbsp;|&nbsp; Where Little Steps Become Big Dreams
          </div>
          <div style={{ fontSize: 26, marginTop: 6 }}>
            Daily Lesson Plan &nbsp;-&nbsp; Class: {plan.class_name}
          </div>
        </div>
        <div
          style={{
            background: LIGHT,
            color: DARK,
            border: `4px solid ${GOLD}`,
            borderRadius: 20,
            padding: "12px 24px",
            display: "flex",
            flexDirection: "column",
            minWidth: 280,
          }}
        >
          <div style={{ fontSize: 20, color: PRIMARY, fontWeight: 700 }}>
            TOMORROW
          </div>
          <div style={{ fontSize: 36, fontWeight: 800 }}>{plan.weekday}</div>
          <div style={{ fontSize: 26, color: ACCENT }}>
            {formatDate(plan.date_iso)}
          </div>
        </div>
      </div>

      {/* META STRIP */}
      <div
        style={{
          padding: "24px 60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 26, fontWeight: 700 }}>
          Reviewed &amp; Approved by School In-charge
        </div>
        <div
          style={{
            background: ACCENT,
            color: LIGHT,
            padding: "10px 24px",
            borderRadius: 14,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          CLASS: {plan.class_name}
        </div>
      </div>

      {/* FESTIVAL STRIP */}
      {plan.festival_today ? (
        <div
          style={{
            margin: "0 60px",
            background: "#FFEBC8",
            border: `4px solid ${GOLD}`,
            borderRadius: 18,
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: PRIMARY }}>
            FESTIVAL NOTICE - {plan.festival_today.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 24, marginTop: 6 }}>
            {plan.festival_today.closed
              ? "School will remain CLOSED on this day."
              : "School will function as usual."}
          </div>
          <div style={{ fontSize: 20, color: ACCENT, marginTop: 4 }}>
            {plan.festival_today.note}
          </div>
        </div>
      ) : null}

      {/* PARENTS SECTION */}
      <Section
        title="FOR PARENTS - TOMORROW'S COVERAGE"
        bg={PARENT_BG}
        tabBg={PRIMARY}
      >
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          Dear Parents, here is what your child will learn tomorrow:
        </div>
        {plan.parents.map((p, i) => (
          <div key={i} style={{ display: "flex", marginBottom: 18 }}>
            <div
              style={{
                background: PRIMARY,
                color: LIGHT,
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 22,
                fontWeight: 700,
                minWidth: 160,
                textAlign: "center",
              }}
            >
              {p.subject}
            </div>
            <div style={{ marginLeft: 20, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{p.topic}</div>
              <div style={{ fontSize: 20, color: ACCENT, marginTop: 2 }}>
                Home tip: {p.home_tip}
              </div>
            </div>
          </div>
        ))}
        <div
          style={{
            background: GOLD,
            padding: "14px 20px",
            borderRadius: 12,
            fontSize: 24,
            fontWeight: 700,
            marginTop: 12,
          }}
        >
          HOMEWORK: {plan.homework}
        </div>
      </Section>

      {/* TEACHERS SECTION */}
      <Section
        title="FOR TEACHERS - VIDEO ACTIVITY BRIEF"
        bg={TEACHER_BG}
        tabBg={ACCENT}
      >
        <div
          style={{
            background: LIGHT,
            border: `3px solid ${GOLD}`,
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: PRIMARY }}>
            TOMORROW&apos;S VIDEO ACTIVITY (curriculum-linked)
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>
            {plan.video_activity.title} - {plan.video_activity.duration_sec}s
          </div>
          <div style={{ fontSize: 20, color: ACCENT, marginTop: 4 }}>
            Links: {plan.video_activity.curriculum_links.join(" + ")}
          </div>
        </div>

        <Bullets
          heading="How to PLAN the video (today, before school ends):"
          color={ACCENT}
          items={plan.video_activity.plan_steps}
        />
        <Bullets
          heading="How to MAKE the video (during the activity period):"
          color={ACCENT}
          items={plan.video_activity.shoot_steps}
        />

        <div
          style={{
            background: LIGHT,
            border: `3px solid ${GREEN}`,
            borderRadius: 12,
            padding: "12px 20px",
            display: "flex",
            flexDirection: "column",
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, color: GREEN }}>
            SAFETY &amp; QUALITY CHECKLIST
          </div>
          <div style={{ fontSize: 20, marginTop: 6 }}>
            DO: {plan.video_activity.safety_dos.join(" - ")}
          </div>
          <div style={{ fontSize: 20, color: PRIMARY, marginTop: 4 }}>
            DON&apos;T: {plan.video_activity.safety_donts.join(" - ")}
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <div style={{ flex: 1 }} />
      <div
        style={{
          background: PRIMARY,
          color: LIGHT,
          padding: "20px 60px",
          display: "flex",
          justifyContent: "space-between",
          borderTop: `10px solid ${GOLD}`,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        <div>Reviewed by: School In-charge - First Step School, Saurabh Vihar</div>
        <div style={{ color: GOLD }}>For {plan.class_name}</div>
      </div>
    </div>
  );
}

function Section({
  title,
  bg,
  tabBg,
  children,
}: {
  title: string;
  bg: string;
  tabBg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        margin: "30px 50px 0",
        background: bg,
        border: `4px solid ${tabBg}`,
        borderRadius: 24,
        padding: "30px 32px 24px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -22,
          left: 30,
          background: tabBg,
          color: LIGHT,
          padding: "8px 22px",
          borderRadius: 14,
          fontSize: 24,
          fontWeight: 800,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Bullets({
  heading,
  color,
  items,
}: {
  heading: string;
  color: string;
  items: string[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: 14 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 6 }}>
        {heading}
      </div>
      {items.map((s, i) => (
        <div key={i} style={{ fontSize: 20, marginLeft: 18, marginTop: 4 }}>
          {i + 1}. {s}
        </div>
      ))}
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
        width: 140,
        height: 140,
        borderRadius: 70,
        background: LIGHT,
        border: `5px solid ${GOLD}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 900, color: PRIMARY }}>1</div>
      <div
        style={{
          position: "absolute",
          bottom: -10,
          background: GOLD,
          color: PRIMARY,
          padding: "2px 10px",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 800,
        }}
      >
        FIRST STEP
      </div>
    </div>
  );
}
