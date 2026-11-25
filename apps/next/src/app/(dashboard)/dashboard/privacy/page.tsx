"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Status } from "@/components/ui";
import { accountFetch } from "@/lib/api/account";
import { POLICY_VERSION } from "@/lib/auth/schemas";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

type Consent = { id: string; consent_type: string; policy_version: string; consent_status: string; recorded_at: string };
type Deletion = { request_status: string | null; identity_deleted: boolean };

export default function PrivacyPage() {
  const [consents, setConsents] = useState<Consent[]>([]);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [history, status] = await Promise.all([
      accountFetch<Consent[]>("/consents"),
      accountFetch<Deletion>("/account/deletion-status"),
    ]);
    setConsents(history);
    setDeletion(status);
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      accountFetch<Consent[]>("/consents"),
      accountFetch<Deletion>("/account/deletion-status"),
    ])
      .then(([history, status]) => {
        if (!active) return;
        setConsents(history);
        setDeletion(status);
      })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Privacy details could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const optional = [...consents].reverse().find((item) => item.consent_type === "optional_processing");

  async function setOptional(grant: boolean) {
    setNotice("");
    setError("");
    try {
      await accountFetch("/consents", {
        method: "POST",
        body: JSON.stringify({
          consent_type: "optional_processing",
          policy_version: POLICY_VERSION,
          consent_status: grant ? "granted" : "withdrawn",
        }),
      });
      await load();
      setNotice(grant ? "Optional processing consent recorded." : "Optional processing consent withdrawn. Earlier records stay in the history.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Consent was not updated.");
    }
  }

  async function downloadExport() {
    setError("");
    try {
      const data = await accountFetch<Record<string, unknown>>("/users/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "herrise-account.json";
      link.click();
      URL.revokeObjectURL(url);
      setNotice("Exported profile, preferences, consents, and the deletion request. Cycle logs are not in this file.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Export failed.");
    }
  }

  async function requestDeletion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    if (!supabaseConfigured()) {
      setError("Supabase is not configured.");
      return;
    }
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Re-enter the current password before requesting deletion.");
      return;
    }
    try {
      const result = await accountFetch<Deletion>("/account/deletion-request", {
        method: "POST",
        body: JSON.stringify({ confirmation_email: email }),
      });
      setDeletion(result);
      setPassword("");
      setNotice("Deletion was requested. The account stays open until an authorized operator finishes it.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The deletion request was not saved.");
    }
  }

  return (
    <section className="page-in grid max-w-2xl gap-4 pb-12">
      <div>
        <p className="eyebrow">Privacy</p>
        <h2 className="mt-2 text-3xl tracking-tight">Your data</h2>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/privacy" className="text-plum">Privacy policy</Link>
        <Link href="/terms" className="text-plum">Terms</Link>
        <Link href="/disclaimer" className="text-plum">Medical disclaimer</Link>
      </div>
      {loading && <div className="h-32 animate-pulse rounded-3xl bg-line/70" />}
      {error && <Status tone="error" title="Privacy action failed">{error}</Status>}
      {notice && <Status tone="success" title="Saved">{notice}</Status>}
      {!loading && (
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-lg">Consent history</h3>
          <p className="mt-2 text-sm text-muted">Policy version {POLICY_VERSION}. Required terms are separate from optional processing.</p>
          <ul className="mt-4 grid gap-2 text-sm">
            {consents.length === 0 && <li className="text-muted">No consent has been recorded yet.</li>}
            {consents.map((item) => (
              <li key={item.id} className="rounded-2xl bg-ivory px-3 py-2">
                {item.consent_type} · {item.consent_status} · {item.policy_version}
              </li>
            ))}
          </ul>
          <button type="button" className="mt-4 inline-flex h-11 items-center rounded-full border border-line px-4 text-sm text-plum" onClick={() => void setOptional(optional?.consent_status !== "granted")}>
            {optional?.consent_status === "granted" ? "Withdraw optional processing" : "Allow optional processing"}
          </button>
        </div>
      )}
      <div className="rounded-3xl border border-line bg-surface p-6">
        <h3 className="text-lg">Export</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">This download includes the profile, preferences, consent history, and deletion request. It does not include cycle logs or symptom notes.</p>
        <button type="button" className="mt-4 inline-flex h-11 items-center rounded-full bg-plum px-4 text-sm text-primary-foreground" onClick={() => void downloadExport()}>
          Download account JSON
        </button>
      </div>
      <form onSubmit={(event) => void requestDeletion(event)} className="grid gap-3 rounded-3xl border border-[#ead4d8] bg-surface p-6">
        <h3 className="text-lg">Request account deletion</h3>
        <p className="text-sm leading-relaxed text-muted">
          Status: {deletion?.request_status ?? "none"}. A request does not delete the account. An operator with the server-side service role has to complete it.
        </p>
        <label className="grid gap-1 text-sm">
          Account email
          <input name="email" type="email" required autoComplete="email" className="h-12 rounded-2xl border border-line bg-ivory px-3" />
        </label>
        <label className="grid gap-1 text-sm">
          Current password
          <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-2xl border border-line bg-ivory px-3" />
        </label>
        <button type="submit" className="inline-flex h-11 w-fit items-center rounded-full bg-[#6e2e3c] px-4 text-sm text-white">
          Submit deletion request
        </button>
      </form>
    </section>
  );
}
