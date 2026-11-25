import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return <RegisterForm configured={configured} />;
}
