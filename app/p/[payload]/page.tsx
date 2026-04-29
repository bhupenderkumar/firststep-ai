import { decodePlan } from "@/lib/codec";
import { PlanSchema, type Plan } from "@/lib/schema";
import LandingClient from "./LandingClient";
import type { Metadata } from "next";

export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = 86400;

function safeDecode(p: string): Plan | null {
  try {
    return PlanSchema.parse(decodePlan(p));
  } catch {
    return null;
  }
}

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ payload: string }>;
}): Promise<Metadata> {
  const { payload } = await params;
  const plan = safeDecode(payload);
  if (!plan) return { title: "First Step School - Daily Plan" };
  const title = `${plan.class_name} - ${formatDate(plan.date_iso)}`;
  return {
    title: `${title} - First Step School`,
    description: `Tomorrow's plan for ${plan.class_name}. Subjects: ${plan.parents
      .map((p) => p.subject)
      .join(", ")}. Listen, read, and share.`,
    openGraph: {
      title: `${title} - First Step School`,
      description: `Tomorrow's plan for ${plan.class_name}.`,
      images: [`/api/render?p=${payload}&view=parent`],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ payload: string }>;
}) {
  const { payload } = await params;
  const plan = safeDecode(payload);

  if (!plan) {
    return (
      <main style={{ maxWidth: 720, margin: "60px auto", padding: 24 }}>
        <h1 style={{ color: "#C02942" }}>Invalid or expired link</h1>
        <p>
          This share link could not be decoded. Please ask your teacher for a
          fresh link, or generate a new one from the home page.
        </p>
        <a href="/">Go to home</a>
      </main>
    );
  }

  return <LandingClient plan={plan} payload={payload} />;
}
