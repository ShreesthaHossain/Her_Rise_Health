"use client";

import { useEffect, useMemo, useState } from "react";
import { accountFetch } from "@/lib/api/account";
import { dhakaToday, eachDate, monthCells, trackingDownload, type CycleItem, type CycleSummary } from "@/lib/tracking";
import { EmptyNote, ExampleFrame, LoadingNote, Notice, Panel, SaveError, fieldClass, useTrackingCopy } from "./ui";

type Page = { items: CycleItem[]; total: number };

export function CyclePredictionNotice({ summary }: { summary: CycleSummary | null }) {
  const t = useTrackingCopy();
  if (!summary) return null;
  if (!summary.prediction) return <Notice>{summary.prediction_note ?? t.notEnough}</Notice>;
  return (
    <Notice>
      {summary.prediction.earliest} – {summary.prediction.latest}. {summary.prediction.label} ±{summary.prediction.uncertainty_days} {t.days}.
    </Notice>
  );
}

export function CycleStatsCard({ summary }: { summary: CycleSummary | null }) {
  const t = useTrackingCopy();
  const rows = [
    [t.cycleDay, summary?.current_cycle_day ?? "—"],
    [t.averageCycle, summary?.average_cycle_length ?? "—"],
    [t.averagePeriod, summary?.average_period_duration ?? "—"],
    [t.variation, summary?.cycle_length_variation ?? "—"],
    [t.records, summary?.record_count ?? 0],
  ];
  return (
    <Panel title={t.periodTitle}>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-xl">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted">{t.statsNote}</p>
    </Panel>
  );
}

export function FlowSelector({ value, onChange }: { value: string; onChange: (value: "light" | "medium" | "heavy") => void }) {
  const t = useTrackingCopy();
  const options = [["light", t.light], ["medium", t.medium], ["heavy", t.heavy]] as const;
  return (
    <div className="flex gap-2" role="radiogroup" aria-label={t.flow}>
      {options.map(([key, label]) => (
        <button key={key} type="button" role="radio" aria-checked={value === key} className={`h-10 rounded-full px-4 text-sm ${value === key ? "bg-plum text-white" : "bg-ivory"}`} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function PainLevelSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const t = useTrackingCopy();
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted">{t.pain}: {value}</span>
      <input type="range" min={0} max={10} value={value} aria-valuemin={0} aria-valuemax={10} aria-valuenow={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export function PeriodEntryDialog({
  initial,
  defaultStart,
  onSave,
  onCancel,
}: {
  initial?: CycleItem | null;
  defaultStart?: string;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
}) {
  const t = useTrackingCopy();
  const [start, setStart] = useState(initial?.period_start ?? defaultStart ?? dhakaToday());
  const [end, setEnd] = useState(initial?.period_end ?? "");
  const [flow, setFlow] = useState<"light" | "medium" | "heavy">(initial?.flow_level ?? "medium");
  const [pain, setPain] = useState(initial?.pain_level ?? 0);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  useEffect(() => {
    setStart(initial?.period_start ?? defaultStart ?? dhakaToday());
    setEnd(initial?.period_end ?? "");
    setFlow(initial?.flow_level ?? "medium");
    setPain(initial?.pain_level ?? 0);
    setNotes(initial?.notes ?? "");
  }, [initial, defaultStart]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const body = { period_start: start, period_end: end || null, flow_level: flow, pain_level: pain, notes: notes || null };
        void onSave(body).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Error"));
      }}
    >
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.start}</span><input className={fieldClass} type="date" required value={start} onChange={(event) => setStart(event.target.value)} /></label>
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.end}</span><input className={fieldClass} type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
      <FlowSelector value={flow} onChange={setFlow} />
      <PainLevelSlider value={pain} onChange={setPain} />
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.notes}</span><textarea className="min-h-20 rounded-2xl border border-line bg-ivory px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <SaveError message={error} />
      <div className="flex gap-2">
        <button className="h-11 rounded-full bg-plum px-5 text-sm text-white" type="submit">{initial ? t.edit : t.save}</button>
        {onCancel && <button className="h-11 rounded-full px-4 text-sm" type="button" onClick={onCancel}>{t.cancel}</button>}
      </div>
    </form>
  );
}

export function CycleCalendar({
  items,
  summary,
  onSelect,
}: {
  items: CycleItem[];
  summary: CycleSummary | null;
  onSelect: (day: string) => void;
}) {
  const t = useTrackingCopy();
  const today = dhakaToday();
  const [cursor, setCursor] = useState(() => today.slice(0, 7));
  const [year, month] = cursor.split("-").map(Number);
  const recorded = useMemo(() => {
    const days = new Set<string>();
    items.forEach((item) => eachDate(item.period_start, item.period_end ?? item.period_start).forEach((day) => days.add(day)));
    return days;
  }, [items]);
  const estimated = useMemo(() => {
    const days = new Set<string>();
    if (!summary?.prediction) return days;
    eachDate(summary.prediction.earliest, summary.prediction.latest).forEach((day) => {
      if (!recorded.has(day)) days.add(day);
    });
    return days;
  }, [recorded, summary]);
  const cells = monthCells(year, month - 1);
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" className="rounded-full px-3 py-1 text-sm" onClick={() => setCursor(shiftMonth(cursor, -1))} aria-label="Previous month">‹</button>
        <p className="text-sm">{cursor}</p>
        <button type="button" className="rounded-full px-3 py-1 text-sm" onClick={() => setCursor(shiftMonth(cursor, 1))} aria-label="Next month">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
        {t.weekLetters.map((letter) => <span key={letter}>{letter}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isRecorded = recorded.has(cell.key);
          const isEstimated = estimated.has(cell.key);
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelect(cell.key)}
              className={`h-10 rounded-xl text-sm ${cell.inMonth ? "" : "opacity-40"} ${isRecorded ? "bg-plum text-white" : isEstimated ? "bg-rose/50" : "bg-ivory"} ${cell.key === today ? "ring-2 ring-violet" : ""}`}
              aria-pressed={isRecorded}
              aria-label={cell.key}
            >
              {cell.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-2"><i className="size-3 rounded-full bg-plum" />{t.recorded}</span>
        <span className="inline-flex items-center gap-2"><i className="size-3 rounded-full bg-rose/70" />{t.estimated}</span>
      </div>
    </div>
  );
}

export function CycleHistoryList({ items, onEdit, onDelete }: { items: CycleItem[]; onEdit: (item: CycleItem) => void; onDelete: (item: CycleItem) => void }) {
  const t = useTrackingCopy();
  const [month, setMonth] = useState("");
  const visible = items.filter((item) => !month || item.period_start.startsWith(month));
  if (items.length === 0) return <EmptyNote text={t.empty} />;
  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.month}</span><input className={fieldClass} type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label>
      <ul className="grid gap-2">
        {visible.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ivory px-3 py-2 text-sm">
            <span>{item.period_start}{item.period_end ? ` – ${item.period_end}` : ""} · {t[item.flow_level]} · {t.pain} {item.pain_level}</span>
            <span className="flex gap-2">
              <button type="button" className="text-plum" onClick={() => onEdit(item)}>{t.edit}</button>
              <button type="button" className="text-[#6e2e3c]" onClick={() => onDelete(item)}>{t.remove}</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PeriodTracker() {
  const t = useTrackingCopy();
  const [items, setItems] = useState<CycleItem[]>([]);
  const [summary, setSummary] = useState<CycleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<CycleItem | null>(null);
  const [selected, setSelected] = useState(dhakaToday());

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [page, stats] = await Promise.all([
        accountFetch<Page>("/cycles?limit=100"),
        accountFetch<CycleSummary>("/cycles/summary"),
      ]);
      setItems(page.items);
      setSummary(stats);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(body: Record<string, unknown>) {
    if (editing) await accountFetch(`/cycles/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
    else await accountFetch("/cycles", { method: "POST", body: JSON.stringify({ ...body, period_start: body.period_start || selected }) });
    setEditing(null);
    await load();
  }

  return (
    <div className="grid gap-4 pb-8">
      <div>
        <h2 className="text-3xl">{t.periodTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.periodLede}</p>
      </div>
      {loading && <LoadingNote text={t.loading} />}
      <SaveError message={error} />
      <CyclePredictionNotice summary={summary} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.month}>
          <CycleCalendar items={items} summary={summary} onSelect={setSelected} />
          <p className="mt-3 text-xs text-muted">{t.selected}: {selected}</p>
          {items.length === 0 && <ExampleFrame text={t.example} />}
        </Panel>
        <Panel title={editing ? t.edit : t.logPeriod}>
          <PeriodEntryDialog
            key={editing?.id ?? selected}
            initial={editing}
            defaultStart={selected}
            onSave={save}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </Panel>
      </div>
      <CycleStatsCard summary={summary} />
      <Panel title={t.history}>
        <CycleHistoryList
          items={items}
          onEdit={setEditing}
          onDelete={(item) => {
            void accountFetch(`/cycles/${item.id}`, { method: "DELETE" }).then(load);
          }}
        />
        <button type="button" className="mt-4 h-10 rounded-full bg-mint px-4 text-sm text-plum" onClick={() => void trackingDownload("/reports/export", { kind: "cycle", range_days: 90, format: "csv" })}>
          {t.csv}
        </button>
      </Panel>
    </div>
  );
}

function shiftMonth(cursor: string, delta: number) {
  const [year, month] = cursor.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
