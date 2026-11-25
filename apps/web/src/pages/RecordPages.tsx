import { useEffect, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NextSteps } from "../page-links";
import { api, ApiError } from "../api";
import { text } from "../i18n";
import { useSession } from "../session";
import { Button, ErrorText, Field, SelectField } from "../ui";

type Cycle = { id: string; start_date: string; end_date: string | null; flow: string; note: string | null };

export function TrackerPage() {
  const { locale, user } = useSession();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [flow, setFlow] = useState("medium");
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("2");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const rows = await api<Cycle[]>("/api/v1/cycles");
    setCycles(rows);
  }

  useEffect(() => {
    if (!user) return;
    void load().catch((err: unknown) => setError(err instanceof Error ? err.message : "Error"));
  }, [user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/v1/cycles", {
        method: "POST",
        body: JSON.stringify({
          start_date: start,
          end_date: end || null,
          flow,
          note: note || null,
          symptom_code: symptom || null,
          severity: symptom ? Number(severity) : null,
        }),
      });
      setNote("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function remove(id: string) {
    await api(`/api/v1/cycles/${id}`, { method: "DELETE" });
    await load();
  }

  if (!user) {
    return (
      <div className="grid gap-4">
        <NextSteps
          locale={locale}
          items={[
            { to: "/login", label: text(locale, "signIn") },
            { to: "/register", label: text(locale, "register") },
            { to: "/", label: text(locale, "home") },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{text(locale, "trackerTitle")}</CardTitle>
          <CardDescription>{text(locale, "disclaimer")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Field label={text(locale, "start")} type="date" value={start} onChange={(event) => setStart(event.target.value)} required />
            <Field label={text(locale, "end")} type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
            <SelectField label={text(locale, "flow")} value={flow} onChange={(event) => setFlow(event.target.value)}>
              <option value="light">{text(locale, "light")}</option>
              <option value="medium">{text(locale, "medium")}</option>
              <option value="heavy">{text(locale, "heavy")}</option>
            </SelectField>
            <SelectField label={text(locale, "symptom")} value={symptom} onChange={(event) => setSymptom(event.target.value)}>
              <option value="">{text(locale, "none")}</option>
              <option value="pain">{text(locale, "pain")}</option>
              <option value="flow">{text(locale, "flow")}</option>
              <option value="mood">{text(locale, "mood")}</option>
            </SelectField>
            {symptom && (
              <Field label={text(locale, "severity")} type="number" min={1} max={3} value={severity} onChange={(event) => setSeverity(event.target.value)} />
            )}
            <Field label={text(locale, "note")} value={note} onChange={(event) => setNote(event.target.value)} />
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit">{text(locale, "save")}</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="rounded-2xl bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{text(locale, "tracker")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          {cycles.length === 0 && <p className="text-muted-foreground">{text(locale, "emptyLogs")}</p>}
          {cycles.map((cycle) => (
            <div key={cycle.id} className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
              <span>
                {cycle.start_date} · {cycle.flow}
              </span>
              <button className="text-sm text-primary underline" onClick={() => void remove(cycle.id)} type="button">
                {text(locale, "remove")}
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="lg:col-span-2">
      <NextSteps
        locale={locale}
        items={[
          { to: "/account", label: text(locale, "account") },
          { to: "/chat", label: text(locale, "ask") },
          { to: "/", label: text(locale, "home") },
        ]}
      />
      </div>
    </div>
  );
}

export function AccountPage() {
  const { locale, user, logout } = useSession();
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  async function accept(purpose: "health_log" | "ai_assist") {
    setMessage("");
    try {
      await api("/api/v1/auth/consents", {
        method: "POST",
        body: JSON.stringify({ purpose, policy_version: "2026-11" }),
      });
      setMessage(purpose);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Error");
    }
  }

  async function download() {
    const data = await api<unknown>("/api/v1/auth/me/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "herrise-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function removeAccount() {
    if (confirm !== "DELETE") return;
    await api("/api/v1/auth/me", { method: "DELETE" });
    await logout();
  }

  if (!user) {
    return (
      <NextSteps
        locale={locale}
        items={[
          { to: "/login", label: text(locale, "signIn") },
          { to: "/register", label: text(locale, "register") },
          { to: "/", label: text(locale, "home") },
        ]}
      />
    );
  }

  return (
    <div className="grid max-w-xl gap-4">
    <Card className="rounded-2xl bg-card shadow-sm">
      <CardHeader>
        <CardTitle>{text(locale, "consentTitle")}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Button type="button" onClick={() => void accept("health_log")}>{text(locale, "consentLogs")}</Button>
        <Button type="button" onClick={() => void accept("ai_assist")}>{text(locale, "consentAsk")}</Button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <Button tone="quiet" type="button" onClick={() => void download()}>{text(locale, "download")}</Button>
        <Field label={text(locale, "deleteWord")} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        <Button tone="quiet" type="button" onClick={() => void removeAccount()}>{text(locale, "delete")}</Button>
      </CardContent>
    </Card>
    <NextSteps
      locale={locale}
      items={[
        { to: "/tracker", label: text(locale, "tracker") },
        { to: "/chat", label: text(locale, "ask") },
        { to: "/", label: text(locale, "home") },
      ]}
    />
    </div>
  );
}
