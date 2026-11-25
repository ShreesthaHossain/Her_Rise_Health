"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Status } from "@/components/ui";
import { accountFetch } from "@/lib/api/account";
import { POLICY_VERSION } from "@/lib/auth/schemas";
import { useLocale } from "@/components/providers";

const steps = ["Welcome", "Language", "Age", "Interests", "Notices", "Finish"];
const interests = [
  ["menstrual_health", "Menstrual health"],
  ["general_wellness", "General wellness"],
  ["nutrition", "Nutrition"],
  ["mental_wellness", "Mental wellness"],
  ["reproductive_education", "Reproductive health education"],
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { setLocale } = useLocale();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const [adult, setAdult] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      await accountFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ preferred_language: language, onboarding_completed: true }),
      });
      await accountFetch("/preferences", {
        method: "PATCH",
        body: JSON.stringify({ health_interests: selected }),
      });
      await accountFetch("/consents", {
        method: "POST",
        body: JSON.stringify({ consent_type: "age_eligibility", policy_version: POLICY_VERSION, consent_status: "granted" }),
      });
      await accountFetch("/consents", {
        method: "POST",
        body: JSON.stringify({ consent_type: "terms", policy_version: POLICY_VERSION, consent_status: "granted" }),
      });
      await accountFetch("/consents", {
        method: "POST",
        body: JSON.stringify({ consent_type: "medical_disclaimer", policy_version: POLICY_VERSION, consent_status: "granted" }),
      });
      setLocale(language);
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Onboarding was not saved.");
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (step === 2 && !adult) {
      setError("HerRise is for adults 18 and over.");
      return;
    }
    setError("");
    if (step === steps.length - 1) {
      void finish();
      return;
    }
    setStep((value) => value + 1);
  }

  return (
    <main className="page-in mx-auto max-w-lg px-5 py-16">
      <p className="eyebrow">
        {step + 1} / {steps.length}
      </p>
      <div className="mt-3 h-1 rounded-full bg-line">
        <div className="h-1 rounded-full bg-plum" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
      <h1 className="mt-6 text-4xl tracking-tight">{steps[step]}</h1>
      {step === 0 && <p className="mt-4 text-sm leading-relaxed text-muted">Welcome to HerRise Health. This setup chooses a language and records that you have read the notices. It is not a clinical screening.</p>}
      {step === 1 && (
        <div className="mt-6 grid gap-2">
          {(["bn", "en"] as const).map((value) => (
            <button key={value} type="button" className={`h-12 rounded-2xl border px-4 text-left text-sm ${language === value ? "border-plum bg-mint" : "border-line bg-surface"}`} onClick={() => setLanguage(value)}>
              {value === "bn" ? "বাংলা" : "English"}
            </button>
          ))}
        </div>
      )}
      {step === 2 && (
        <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" className="mt-1 size-4" checked={adult} onChange={(event) => setAdult(event.target.checked)} />
          I confirm that I am 18 or older.
        </label>
      )}
      {step === 3 && (
        <div className="mt-6 grid gap-2">
          <p className="text-sm text-muted">These interests are optional. Skip any you do not want to share.</p>
          {interests.map(([id, label]) => (
            <label key={id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
              <input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} />
              {label}
            </label>
          ))}
        </div>
      )}
      {step === 4 && (
        <div className="mt-6 grid gap-3 text-sm leading-relaxed text-muted">
          <p>HerRise explains health topics and keeps a private log. It does not diagnose, prescribe, or replace a clinician.</p>
          <p>Optional processing consent is separate and can be declined later in Privacy. It is not included in the required terms.</p>
        </div>
      )}
      {step === 5 && <p className="mt-6 text-sm leading-relaxed text-muted">Finishing writes your language, optional interests, and the required acknowledgements. Nothing is stored if this request fails.</p>}
      {error && (
        <div className="mt-4">
          <Status tone="error" title="Cannot continue">{error}</Status>
        </div>
      )}
      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button type="button" className="inline-flex h-11 items-center rounded-full px-4 text-sm text-plum" onClick={() => setStep((value) => value - 1)}>
            Back
          </button>
        )}
        <button type="button" className="inline-flex h-11 items-center rounded-full bg-plum px-5 text-sm text-primary-foreground disabled:opacity-60" disabled={saving} onClick={next}>
          {saving ? "Saving…" : step === steps.length - 1 ? "Finish" : "Continue"}
        </button>
      </div>
    </main>
  );
}
