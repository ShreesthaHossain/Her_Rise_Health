"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Status } from "@/components/ui";
import { useLocale } from "@/components/providers";
import { accountFetch, type AccountProfile } from "@/lib/api/account";
import { profileSchema } from "@/lib/auth/schemas";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

type FormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { setLocale } = useLocale();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [nextEmail, setNextEmail] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: "", preferredLanguage: "bn", timezone: "Asia/Dhaka" },
  });

  useEffect(() => {
    const { reset } = form;
    accountFetch<AccountProfile>("/users/me")
      .then((data) => {
        setProfile(data);
        reset({
          displayName: data.display_name,
          preferredLanguage: data.preferred_language,
          timezone: data.timezone === "UTC" ? "UTC" : "Asia/Dhaka",
        });
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Profile could not be loaded."));
  }, [form]);

  async function onSubmit(values: FormValues) {
    setSaved("");
    setError("");
    try {
      const data = await accountFetch<AccountProfile>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: values.displayName,
          preferred_language: values.preferredLanguage,
          timezone: values.timezone,
        }),
      });
      setProfile(data);
      setLocale(values.preferredLanguage);
      setSaved("Profile saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Profile was not saved.");
    }
  }

  async function changeEmail() {
    setEmailMessage("");
    if (!supabaseConfigured()) {
      setEmailMessage("Supabase is not configured.");
      return;
    }
    const { error: updateError } = await createClient().auth.updateUser({ email: nextEmail });
    setEmailMessage(updateError ? updateError.message : "Check the new inbox to confirm the address. The profile API does not edit the login email directly.");
  }

  return (
    <section className="page-in grid max-w-2xl gap-4 pb-10">
      <div>
        <p className="eyebrow">Account</p>
        <h2 className="mt-2 text-3xl tracking-tight">Profile</h2>
      </div>
      {error && <Status tone="error" title="Profile unavailable">{error}</Status>}
      {saved && <Status tone="success" title={saved}>The dashboard greeting uses this display name.</Status>}
      {!profile && !error && <div className="h-40 animate-pulse rounded-3xl bg-line/70" />}
      {profile && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 rounded-3xl border border-line bg-surface p-6">
          <label className="grid gap-1.5 text-sm">
            Display name
            <input className="h-12 rounded-2xl border border-line bg-ivory px-3" {...form.register("displayName")} />
          </label>
          {form.formState.errors.displayName && <p className="text-sm text-[#6e2e3c]">{form.formState.errors.displayName.message}</p>}
          <p className="text-sm text-muted">Email: {profile.email ?? "Not available on this session"}</p>
          <label className="grid gap-1.5 text-sm">
            Preferred language
            <select className="h-12 rounded-2xl border border-line bg-ivory px-3" {...form.register("preferredLanguage")}>
              <option value="bn">বাংলা</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm">
            Timezone
            <select className="h-12 rounded-2xl border border-line bg-ivory px-3" {...form.register("timezone")}>
              <option value="Asia/Dhaka">Asia/Dhaka</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
          <button type="submit" disabled={form.formState.isSubmitting} className="inline-flex h-11 w-fit items-center rounded-full bg-plum px-5 text-sm text-primary-foreground disabled:opacity-60">
            {form.formState.isSubmitting ? "Saving…" : "Save profile"}
          </button>
        </form>
      )}
      <form
        className="grid gap-3 rounded-3xl border border-line bg-surface p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void changeEmail();
        }}
      >
        <h3 className="text-lg">Email change</h3>
        <p className="text-sm text-muted">This uses Supabase verification. The new address replaces the old one only after you confirm it.</p>
        <input type="email" required value={nextEmail} onChange={(event) => setNextEmail(event.target.value)} className="h-12 rounded-2xl border border-line bg-ivory px-3 text-sm" aria-label="New email" />
        <button type="submit" className="inline-flex h-11 w-fit items-center rounded-full border border-line px-5 text-sm text-plum">
          Send confirmation
        </button>
        {emailMessage && <p className="text-sm text-muted">{emailMessage}</p>}
      </form>
    </section>
  );
}
