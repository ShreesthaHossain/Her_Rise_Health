import { ResetForm } from "@/components/auth/reset-form";

export default function ResetPasswordPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return <ResetForm configured={configured} />;
}
