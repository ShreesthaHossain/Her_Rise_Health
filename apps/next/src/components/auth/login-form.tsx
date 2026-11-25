"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { AuthShell, TextField } from "@/components/auth/auth-shell";
import { Status } from "@/components/ui";
import { loginSchema } from "@/lib/auth/schemas";
import { safeNext } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

type FormValues = z.infer<typeof loginSchema>;

const linkErrors: Record<string, string> = {
  config: "Add the Supabase URL and publishable key before signing in. This screen does not use a practice account.",
  link: "That email link is invalid or already used. Register again, then open the newest email in this same browser.",
  verifier: "The link opened in a browser that does not have the sign-up cookie. Open the newest email in the same browser where you created the account.",
};

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [show, setShow] = useState(false);
  const linkError = params.get("error");
  const [formError, setFormError] = useState(linkError && linkErrors[linkError] && linkError !== "config" ? linkErrors[linkError] : "");
  const form = useForm<FormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: FormValues) {
    setFormError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      setFormError(error.message === "Invalid login credentials" ? "Email or password is incorrect." : error.message);
      return;
    }
    router.push(safeNext(params.get("next")));
    router.refresh();
  }

  return (
    <AuthShell title="Welcome back." lede="A private place for health education and your own notes. HerRise does not diagnose.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 rounded-3xl border border-line bg-surface p-6 sm:p-8" noValidate aria-busy={form.formState.isSubmitting}>
        <div>
          <p className="eyebrow">Sign in</p>
          <h2 className="mt-2 text-3xl tracking-tight">Welcome back</h2>
        </div>
        {!configured && <Status tone="error" title="Supabase is not configured">{linkErrors.config}</Status>}
        {formError && <Status tone="error" title="Sign in failed">{formError}</Status>}
        <TextField id="email" label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} registration={form.register("email")} />
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm text-muted">Password</label>
            <Link href="/forgot-password" className="text-sm text-plum">Forgot password</Link>
          </div>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} aria-describedby={form.formState.errors.password ? "password-error" : undefined} className="h-12 w-full rounded-2xl border border-line bg-ivory px-3 pr-12 text-sm outline-none" {...form.register("password")} />
            <button type="button" className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center text-muted" aria-pressed={show} aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password && <p id="password-error" className="text-sm text-[#6e2e3c]">{form.formState.errors.password.message}</p>}
        </div>
        <button type="submit" disabled={!configured || form.formState.isSubmitting} className="inline-flex h-12 items-center justify-center rounded-full bg-plum text-sm font-medium text-primary-foreground disabled:opacity-60">
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-muted">
          New here? <Link href="/register" className="text-plum">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
