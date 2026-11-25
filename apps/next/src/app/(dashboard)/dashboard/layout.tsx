import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Loading the dashboard…</p>}>
      <DashboardGate>{children}</DashboardGate>
    </Suspense>
  );
}

async function DashboardGate({ children }: { children: React.ReactNode }) {
  if (!supabaseConfigured()) redirect("/login?error=config&next=/dashboard");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/dashboard");
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (token) {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    try {
      const response = await fetch(`${base}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.ok) {
        const profile = (await response.json()) as { onboarding_completed?: boolean };
        if (profile.onboarding_completed === false) redirect("/onboarding");
      }
    } catch {
      // The API being down must not bounce the browser between login and the dashboard.
    }
  }
  return <DashboardShell>{children}</DashboardShell>;
}
