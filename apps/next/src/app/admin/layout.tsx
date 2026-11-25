import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="px-5 py-24 text-sm text-muted">Checking access…</p>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured()) redirect("/login?error=config&next=/admin");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/admin");
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  let role = "";
  if (token) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      const response = await fetch(`${base}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) {
        const profile = (await response.json()) as { role?: string };
        role = profile.role ?? "";
      }
    } catch {
      role = "";
    }
  }
  if (role !== "admin") {
    return (
      <main className="mx-auto max-w-lg px-5 py-24">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-3 text-4xl tracking-tight">Access denied</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This area checks a verified admin role. A signed-in member cannot open it, and the page does not grant that role.
        </p>
      </main>
    );
  }
  return <div className="mx-auto grid max-w-3xl gap-6 px-5 py-12">{children}</div>;
}
