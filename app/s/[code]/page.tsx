import { redirect } from "next/navigation";
import { resolveShortLink } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const payload = await resolveShortLink(code);

  if (!payload) {
    return (
      <main style={{ maxWidth: 720, margin: "60px auto", padding: 24 }}>
        <h1 style={{ color: "#C02942" }}>Link not found</h1>
        <p>
          This short link does not exist or may have expired. Please ask your
          teacher for a fresh link.
        </p>
        <a href="/">Go to home</a>
      </main>
    );
  }

  redirect(`/p/${payload}`);
}
