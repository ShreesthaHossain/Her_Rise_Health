import { ForgotForm } from "@/components/auth/forgot-form";

export default function ForgotPasswordPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return <ForgotForm configured={configured} />;
}
