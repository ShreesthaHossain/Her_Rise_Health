import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Loading sign in…</p>}>
      <LoginForm configured={configured} />
    </Suspense>
  );
}
