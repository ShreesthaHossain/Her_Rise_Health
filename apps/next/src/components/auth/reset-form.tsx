"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell, TextField } from "@/components/auth/auth-shell";
import { Status } from "@/components/ui";
import { resetSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/client";

type FormValues = z.infer<typeof resetSchema>;

export function ResetForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [formError, setFormError] = useState("");
  const form = useForm<FormValues>({ resolver: zodResolver(resetSchema), defaultValues: { password: "", confirmPassword: "" } });

  async function onSubmit(values: FormValues) {
    setFormError("");
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setFormError("Open the reset link from your email first. This page cannot set a password without that session.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setFormError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthShell title="Choose a new password." lede="Use the link from your email. An expired link has to be requested again.">
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 rounded-3xl border border-line bg-surface p-6 sm:p-8" noValidate>
        <div>
          <p className="eyebrow">Password</p>
          <h2 className="mt-2 text-3xl tracking-tight">Set a new password</h2>
        </div>
        {!configured && <Status tone="error" title="Supabase is not configured">Password changes need the Supabase project keys.</Status>}
        {formError && <Status tone="error" title="Password was not changed">{formError}</Status>}
        <TextField id="password" label="New password" type="password" autoComplete="new-password" error={form.formState.errors.password?.message} registration={form.register("password")} />
        <p className="text-xs leading-relaxed text-muted">Use at least 8 characters, with a letter and a number.</p>
        <TextField id="confirm-password" label="Confirm password" type="password" autoComplete="new-password" error={form.formState.errors.confirmPassword?.message} registration={form.register("confirmPassword")} />
        <button type="submit" disabled={!configured || form.formState.isSubmitting} className="inline-flex h-12 items-center justify-center rounded-full bg-plum text-sm font-medium text-primary-foreground disabled:opacity-60">
          {form.formState.isSubmitting ? "Saving…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
