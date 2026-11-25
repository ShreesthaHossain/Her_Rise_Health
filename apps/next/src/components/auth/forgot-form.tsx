"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell, TextField } from "@/components/auth/auth-shell";
import { Status } from "@/components/ui";
import { forgotSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/client";

type FormValues = z.infer<typeof forgotSchema>;

export function ForgotForm({ configured }: { configured: boolean }) {
  const [formError, setFormError] = useState("");
  const [done, setDone] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  async function onSubmit(values: FormValues) {
    setFormError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    setDone(true);
  }

  return (
    <AuthShell title="Reset access." lede="We email a single-use link. It does not reveal whether an address is registered beyond what the provider returns.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 rounded-3xl border border-line bg-surface p-6 sm:p-8" noValidate>
        <div>
          <p className="eyebrow">Password</p>
          <h2 className="mt-2 text-3xl tracking-tight">Forgot password</h2>
        </div>
        {!configured && <Status tone="error" title="Supabase is not configured">Password reset needs the Supabase project keys.</Status>}
        {done && <Status tone="success" title="Check your email">If the address can receive mail from this project, a reset link is on its way.</Status>}
        {formError && <Status tone="error" title="The link was not sent">{formError}</Status>}
        <TextField id="email" label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} registration={form.register("email")} />
        <button type="submit" disabled={!configured || form.formState.isSubmitting || done} className="inline-flex h-12 items-center justify-center rounded-full bg-plum text-sm font-medium text-primary-foreground disabled:opacity-60">
          {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
        </button>
        <Link href="/login" className="text-sm text-plum">Return to sign in</Link>
      </form>
    </AuthShell>
  );
}
