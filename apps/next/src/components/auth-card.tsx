"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCopy, useLocale } from "@/components/providers";
import { Eyebrow, Mark, Status } from "@/components/ui";

export function AuthCard({ mode }: { mode: "login" | "register" | "reset" }) {
  const t = useCopy();
  const { locale } = useLocale();
  const bn = locale === "bn";
  const [notice, setNotice] = useState("");
  const title = mode === "login" ? t.signIn : mode === "register" ? t.getStarted : bn ? "পাসওয়ার্ড রিসেট" : "Reset password";

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(t.shellNote);
  }

  return (
    <div className="page-in mx-auto grid w-full max-w-5xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
      <div className="hidden md:block">
        <Mark className="size-14 text-plum" />
        <Eyebrow>{t.brand}</Eyebrow>
        <h1 className="mt-4 max-w-sm text-5xl tracking-tight">{t.heroTitle}</h1>
        <p className="mt-4 max-w-sm text-muted leading-relaxed">{t.shellNote}</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(36_27_53/0.04)] sm:p-8">
        <h2 className="text-3xl tracking-tight">{title}</h2>
        <p className="text-sm leading-relaxed text-muted">{t.shellNote}</p>
        {mode === "register" && <Field label={bn ? "নাম" : "Name"} type="text" />}
        <Field label={bn ? "ইমেইল" : "Email"} type="email" />
        {mode !== "reset" && <Field label={bn ? "পাসওয়ার্ড" : "Password"} type="password" />}
        <button type="submit" className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-plum px-4 text-sm font-medium text-primary-foreground">
          {title}
        </button>
        {notice && (
          <Status tone="error" title={bn ? "সংরক্ষণ হয়নি" : "Nothing was saved"}>
            {notice}
          </Status>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/" className="text-plum">{t.home}</Link>
          {mode !== "login" && <Link href="/login" className="text-plum">{t.signIn}</Link>}
          {mode !== "register" && <Link href="/register" className="text-plum">{t.getStarted}</Link>}
          {mode !== "reset" && (
            <Link href="/forgot-password" className="text-plum">
              {bn ? "পাসওয়ার্ড রিসেট" : "Reset password"}
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, type }: { label: string; type: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <input required type={type} autoComplete={type === "password" ? "current-password" : "email"} className="h-12 rounded-2xl border border-line bg-ivory px-3 outline-none" />
    </label>
  );
}
