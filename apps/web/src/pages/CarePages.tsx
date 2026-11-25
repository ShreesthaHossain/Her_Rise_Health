import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NextSteps } from "../page-links";
import { api } from "../api";
import { text } from "../i18n";
import { useSession } from "../session";
import { Button, ErrorText, Field, SelectField } from "../ui";

type Facility = {
  id: string;
  name: string;
  facility_type: string;
  district: string;
  address: string;
  phone: string | null;
  source: string;
  verified_at: string | null;
};

export function FacilitiesPage() {
  const { locale } = useSession();
  const [district, setDistrict] = useState("Dhaka");
  const [kind, setKind] = useState("");
  const [rows, setRows] = useState<Facility[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function search(event?: FormEvent) {
    event?.preventDefault();
    const params = new URLSearchParams();
    if (district.trim()) params.set("district", district.trim());
    if (kind) params.set("facility_type", kind);
    const data = await api<Facility[]>(`/api/v1/facilities?${params.toString()}`);
    setRows(data);
    setLoaded(true);
  }

  useEffect(() => {
    void search();
    // Load the default district once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4">
      <Card className="rounded-2xl bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{text(locale, "facilitiesTitle")}</CardTitle>
          <CardDescription>{text(locale, "unverified")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void search(event)}>
            <Field label={text(locale, "district")} value={district} onChange={(event) => setDistrict(event.target.value)} />
            <SelectField label={text(locale, "type")} value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="">{text(locale, "any")}</option>
              <option value="hospital">{text(locale, "hospital")}</option>
              <option value="clinic">{text(locale, "clinic")}</option>
            </SelectField>
            <Button className="sm:col-span-2 sm:w-fit" type="submit">{text(locale, "search")}</Button>
          </form>
        </CardContent>
      </Card>
      {loaded && rows.length === 0 && <p className="text-muted-foreground">{text(locale, "emptyFacilities")}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <Card key={row.id} className="rounded-2xl bg-card shadow-sm">
            <CardHeader>
              <CardTitle>{row.name}</CardTitle>
              <CardDescription>{row.address}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{row.phone ?? text(locale, "phoneMissing")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <NextSteps
        locale={locale}
        items={[
          { to: "/chat", label: text(locale, "ask") },
          { to: "/articles", label: text(locale, "library") },
          { to: "/", label: text(locale, "home") },
        ]}
      />
    </div>
  );
}

type Reply = { kind: string; message_bn: string; message_en: string };

export function ChatPage() {
  const { locale, user } = useSession();
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState<Reply | null>(null);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api<Reply>("/api/v1/chat", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setReply(data);
    } catch (err) {
      setReply(null);
      setError(err instanceof Error ? err.message : "Error");
    }
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

  const banner =
    reply?.kind === "escalation" ? "border-primary bg-primary/10" : "border-border bg-card";

  return (
    <div className="grid max-w-2xl gap-4">
    <Card className="rounded-2xl bg-card shadow-sm">
      <CardHeader>
        <CardTitle>{text(locale, "chatTitle")}</CardTitle>
        <CardDescription>{text(locale, "chatHint")}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm">{text(locale, "disclaimer")}</p>
        <form className="grid gap-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm text-muted-foreground">{text(locale, "message")}</span>
            <textarea
              className="min-h-28 w-full rounded-xl border border-input bg-card px-3 py-2 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
          </label>
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit">{text(locale, "send")}</Button>
        </form>
        {reply && (
          <p className={`rounded-xl border px-4 py-3 ${banner}`}>
            {locale === "bn" ? reply.message_bn : reply.message_en}
          </p>
        )}
        {error.includes("consent") && (
          <Link className="text-sm text-primary underline" to="/account">{text(locale, "consentTitle")}</Link>
        )}
      </CardContent>
    </Card>
    <NextSteps
      locale={locale}
      items={[
        { to: "/account", label: text(locale, "account") },
        { to: "/facilities", label: text(locale, "care") },
        { to: "/articles", label: text(locale, "library") },
      ]}
    />
    </div>
  );
}
