"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell, TextField } from "@/components/auth/auth-shell";
import { Status } from "@/components/ui";
import { registerSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/client";

type FormValues = z.infer<typeof registerSchema>;

export function RegisterForm({ configured }: { configured: boolean }) {
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "", acceptedTerms: false },
  });

  async function onSubmit(values: FormValues) {
    setFormError("");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: redirectTo,
        data: { display_name: values.displayName, terms_version: "2026-11-22" },
      },
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    // An existing address comes back with no identity and no new email. Send a fresh link.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: values.email,
        options: { emailRedirectTo: redirectTo },
      });
      if (resendError) {
        setFormError(resendError.message);
        return;
      }
    }
    setDone(true);
  }

  return (
    <AuthShell title="Your health. Your pace." lede="Create an account with your name and email. You will not be asked for a diagnosis or a medical history here.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 rounded-3xl border border-line bg-surface p-6 sm:p-8" noValidate aria-busy={form.formState.isSubmitting}>
        <div>
          <p className="eyebrow">Create account</p>
          <h2 className="mt-2 text-3xl tracking-tight">Start with HerRise</h2>
        </div>
        {!configured && (
          <Status tone="error" title="Supabase is not configured">
            Registration stays closed until the Supabase URL and publishable key are set.
          </Status>
        )}
        {done && (
          <Status tone="success" title="Check your email">
            We sent a verification link. Open that newest message in this same browser. A link opened from another browser or the old email cannot finish sign-in.
          </Status>
        )}
        {formError && <Status tone="error" title="Registration failed">{formError}</Status>}
        <TextField id="display-name" label="Display name" autoComplete="name" error={form.formState.errors.displayName?.message} registration={form.register("displayName")} />
        <TextField id="email" label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} registration={form.register("email")} />
        <TextField id="password" label="Password" type="password" autoComplete="new-password" error={form.formState.errors.password?.message} registration={form.register("password")} />
        <p className="text-xs leading-relaxed text-muted">Use at least 8 characters, with a letter and a number.</p>
        <TextField id="confirm-password" label="Confirm password" type="password" autoComplete="new-password" error={form.formState.errors.confirmPassword?.message} registration={form.register("confirmPassword")} />
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" className="mt-1 size-4" {...form.register("acceptedTerms")} />
          <span>
            I agree to the <Link href="/terms" className="text-plum">terms</Link> and <Link href="/privacy" className="text-plum">privacy notice</Link>. I am 18 or older.
          </span>
        </label>
        {form.formState.errors.acceptedTerms && <p className="text-sm text-[#6e2e3c]">{form.formState.errors.acceptedTerms.message}</p>}
        <button type="submit" disabled={!configured || form.formState.isSubmitting || done} className="inline-flex h-12 items-center justify-center rounded-full bg-plum text-sm font-medium text-primary-foreground disabled:opacity-60">
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </button>
        <p className="text-sm text-muted">
          Already registered? <Link href="/login" className="text-plum">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
