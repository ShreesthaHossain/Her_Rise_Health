"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { accountFetch } from "@/lib/api/account";
import { dhakaToday, type CycleItem, type SymptomItem } from "@/lib/tracking";
import { EmptyNote, LoadingNote, Notice, Panel, SaveError, fieldClass, useTrackingCopy } from "./ui";

const categories = ["menstrual_cramps", "headache", "fatigue", "abdominal_discomfort", "nausea", "mood_changes", "sleep", "other"] as const;

type Trends = {
  total: number;
  average_severity: number | null;
  frequency: { category: string; count: number }[];
  points: { recorded_date: string; category: string; severity: number }[];
  safety: { message: string };
};

export function SymptomCategorySelector({
  value,
  onChange,
  allowAll = false,
}: {
  value: string;
  onChange: (value: string) => void;
  allowAll?: boolean;
}) {
  const t = useTrackingCopy();
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{t.category}</span>
      <select className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {allowAll && <option value="">{t.allCategories}</option>}
        {categories.map((key) => <option key={key} value={key}>{t.categories[key]}</option>)}
      </select>
    </label>
  );
}

export function SeveritySelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const t = useTrackingCopy();
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{t.severity}: {value}</span>
      <input type="range" min={1} max={10} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export function SymptomFrequencyChart({ rows }: { rows: { category: string; count: number }[] }) {
  const t = useTrackingCopy();
  if (rows.length === 0) return <EmptyNote text={t.empty} />;
  const data = rows.map((row) => ({ name: t.categories[row.category as keyof typeof t.categories] ?? row.category, count: row.count }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={50} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#4C1D95" radius={8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SymptomTrendChart({ points }: { points: { recorded_date: string; severity: number }[] }) {
  const t = useTrackingCopy();
  if (points.length === 0) return <EmptyNote text={t.empty} />;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="recorded_date" tick={{ fontSize: 11 }} />
          <YAxis domain={[1, 10]} />
          <Tooltip />
          <Line type="monotone" dataKey="severity" stroke="#9F78D2" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SymptomEntryForm({ cycles, onSaved }: { cycles: CycleItem[]; onSaved: () => Promise<void> }) {
  const t = useTrackingCopy();
  const [date, setDate] = useState(dhakaToday());
  const [category, setCategory] = useState<string>(categories[0]);
  const [severity, setSeverity] = useState(3);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [cycleId, setCycleId] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        void accountFetch("/symptoms", {
          method: "POST",
          body: JSON.stringify({
            recorded_date: date,
            category,
            severity,
            duration_minutes: duration ? Number(duration) : null,
            notes: notes || null,
            cycle_log_id: cycleId || null,
          }),
        }).then(() => onSaved()).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Error"));
      }}
    >
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.date}</span><input className={fieldClass} type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <SymptomCategorySelector value={category} onChange={setCategory} />
      <SeveritySelector value={severity} onChange={setSeverity} />
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.duration}</span><input className={fieldClass} type="number" min={0} value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">{t.linkedPeriod}</span>
        <select className={fieldClass} value={cycleId} onChange={(event) => setCycleId(event.target.value)}>
          <option value="">{t.none}</option>
          {cycles.map((cycle) => <option key={cycle.id} value={cycle.id}>{cycle.period_start}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.notes}</span><textarea className="min-h-20 rounded-2xl border border-line bg-ivory px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <SaveError message={error} />
      <button className="h-11 rounded-full bg-plum px-5 text-sm text-white" type="submit">{t.save}</button>
    </form>
  );
}

export function SymptomHistory({ items, onDelete }: { items: SymptomItem[]; onDelete: (id: string) => void }) {
  const t = useTrackingCopy();
  if (items.length === 0) return <EmptyNote text={t.empty} />;
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-ivory px-3 py-2 text-sm">
          <span>{item.recorded_date} · {t.categories[item.category as keyof typeof t.categories] ?? item.category} · {item.severity}{item.notes ? ` · ${item.notes}` : ""}</span>
          <button type="button" className="text-[#6e2e3c]" onClick={() => onDelete(item.id)}>{t.remove}</button>
        </li>
      ))}
    </ul>
  );
}

export function SymptomJournal() {
  const t = useTrackingCopy();
  const [items, setItems] = useState<SymptomItem[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [cycles, setCycles] = useState<CycleItem[]>([]);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextCategory = category, nextQuery = query) {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ limit: "100" });
    if (nextCategory) params.set("category", nextCategory);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    try {
      const [page, trend, periods] = await Promise.all([
        accountFetch<{ items: SymptomItem[] }>(`/symptoms?${params.toString()}`),
        accountFetch<Trends>("/symptoms/trends"),
        accountFetch<{ items: CycleItem[] }>("/cycles?limit=50"),
      ]);
      setItems(page.items);
      setTrends(trend);
      setCycles(periods.items);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="grid gap-4 pb-8">
      <div>
        <h2 className="text-3xl">{t.symptomTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.symptomLede}</p>
      </div>
      <Notice>{trends?.safety.message ?? t.safety}</Notice>
      {loading && <LoadingNote text={t.loading} />}
      <SaveError message={error} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.addSymptom}><SymptomEntryForm cycles={cycles} onSaved={() => load()} /></Panel>
        <Panel title={t.history}>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <SymptomCategorySelector allowAll value={category} onChange={(value) => { setCategory(value); void load(value, query); }} />
            <label className="grid gap-1 text-sm"><span className="text-muted">{t.search}</span><input className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} onBlur={(event) => void load(category, event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(category, event.currentTarget.value); }} /></label>
          </div>
          <SymptomHistory items={items} onDelete={(id) => { void accountFetch(`/symptoms/${id}`, { method: "DELETE" }).then(() => load()); }} />
        </Panel>
      </div>
      <Panel title={t.frequency}>
        <SymptomFrequencyChart rows={trends?.frequency ?? []} />
        <p className="mt-2 text-xs text-muted">{t.symptomLede} {trends?.average_severity ?? "—"}</p>
      </Panel>
      <Panel title={t.severityTrend}><SymptomTrendChart points={trends?.points ?? []} /></Panel>
    </div>
  );
}
