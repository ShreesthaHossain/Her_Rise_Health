"use client";

import { useEffect, useState } from "react";
import { Status } from "@/components/ui";
import { useTheme } from "@/components/providers";
import { accountFetch } from "@/lib/api/account";

const interests = [
  ["menstrual_health", "Menstrual health"],
  ["general_wellness", "General wellness"],
  ["nutrition", "Nutrition"],
  ["mental_wellness", "Mental wellness"],
  ["reproductive_education", "Reproductive health education"],
] as const;

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const [theme, setThemeValue] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    accountFetch<{ theme: "light" | "dark"; notifications_enabled: boolean; health_interests: string[] }>("/preferences")
      .then((data) => {
        setThemeValue(data.theme);
        setNotifications(data.notifications_enabled);
        setSelected(data.health_interests);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Settings could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved("");
    setError("");
    try {
      await accountFetch("/preferences", {
        method: "PATCH",
        body: JSON.stringify({ theme, notifications_enabled: notifications, health_interests: selected }),
      });
      setTheme(theme);
      setSaved("Preferences saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Preferences were not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-in grid max-w-2xl gap-4 pb-10">
      <div>
        <p className="eyebrow">Account</p>
        <h2 className="mt-2 text-3xl tracking-tight">Settings</h2>
      </div>
      {loading && <div className="h-40 animate-pulse rounded-3xl bg-line/70" />}
      {error && <Status tone="error" title="Settings unavailable">{error}</Status>}
      {saved && <Status tone="success" title={saved}>Theme and interests stay on your account.</Status>}
      {!loading && (
        <div className="grid gap-4 rounded-3xl border border-line bg-surface p-6">
          <label className="grid gap-1.5 text-sm">
            Theme
            <select className="h-12 rounded-2xl border border-line bg-ivory px-3" value={theme} onChange={(event) => setThemeValue(event.target.value as "light" | "dark")}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className="flex items-start gap-3 text-sm leading-relaxed">
            <input type="checkbox" className="mt-1" checked={notifications} onChange={(event) => setNotifications(event.target.checked)} />
            Store a preference for product notices. No mail is sent until a mailer is connected.
          </label>
          <fieldset className="grid gap-2">
            <legend className="text-sm">Optional interests</legend>
            {interests.map(([id, label]) => (
              <label key={id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(id)}
                  onChange={() => setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <button type="button" disabled={saving} onClick={() => void save()} className="inline-flex h-11 w-fit items-center rounded-full bg-plum px-5 text-sm text-primary-foreground disabled:opacity-60">
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      )}
    </section>
  );
}
