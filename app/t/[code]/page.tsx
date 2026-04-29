import { redirect } from "next/navigation";
import { resolveShortLink } from "@/lib/supabase";

export const runtime = "nodejs";

export default async function TeacherShortLink({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const payload = await resolveShortLink(code);
  if (!payload) {
    return (
      <main style={{ maxWidth: 640, margin: "60px auto", padding: 24, fontFamily: "system-ui" }}>
        <h1 style={{ color: "#C02942" }}>Link not found</h1>
        <p>This share link has expired or is invalid. Please ask the school for a new one.</p>
      </main>
    );
  }
  // Send teachers straight to the teacher A4 PDF for easy WhatsApp forwarding.
  redirect(`/api/pdf?p=${encodeURIComponent(payload)}&view=teacher`);
}
