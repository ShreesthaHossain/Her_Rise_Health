"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { accountFetch } from "@/lib/api/account";
import { dhakaToday, type WellnessItem } from "@/lib/tracking";
import { EmptyNote, LoadingNote, Notice, Panel, SaveError, fieldClass, useTrackingCopy } from "./ui";

const moods = ["very_low", "low", "neutral", "good", "very_good"] as const;

export function moodText(
  t: { veryLow: string; low: string; neutral: string; good: string; veryGood: string },
  mood: string | null,
) {
  const labels: Record<string, string> = {
    very_low: t.veryLow,
    low: t.low,
    neutral: t.neutral,
    good: t.good,
    very_good: t.veryGood,
  };
  return mood ? (labels[mood] ?? mood) : "—";
}

export function MoodSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const t = useTrackingCopy();
  const labels = { very_low: t.veryLow, low: t.low, neutral: t.neutral, good: t.good, very_good: t.veryGood };
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.mood}>
      {moods.map((mood) => (
        <button key={mood} type="button" role="radio" aria-checked={value === mood} className={`h-10 rounded-full px-3 text-sm ${value === mood ? "bg-plum text-white" : "bg-ivory"}`} onClick={() => onChange(mood)}>
          {labels[mood]}
        </button>
      ))}
    </div>
  );
}

export function SleepInput({ hours, quality, onHours, onQuality }: { hours: string; quality: string; onHours: (value: string) => void; onQuality: (value: string) => void }) {
  const t = useTrackingCopy();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.sleepHours}</span><input className={fieldClass} type="number" min={0} max={24} step="0.5" value={hours} onChange={(event) => onHours(event.target.value)} /></label>
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.sleepQuality}</span><input className={fieldClass} type="number" min={1} max={5} value={quality} onChange={(event) => onQuality(event.target.value)} /></label>
    </div>
  );
}

export function StressSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const t = useTrackingCopy();
  return <label className="grid gap-1 text-sm"><span className="text-muted">{t.stress}: {value}</span><input type="range" min={1} max={5} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export function EnergySlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const t = useTrackingCopy();
  return <label className="grid gap-1 text-sm"><span className="text-muted">{t.energy}: {value}</span><input type="range" min={1} max={5} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export function WellnessCalendar({ items }: { items: WellnessItem[] }) {
  const t = useTrackingCopy();
  if (items.length === 0) return <EmptyNote text={t.empty} />;
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl bg-ivory px-3 py-2 text-sm">{item.recorded_date} · {moodText(t, item.mood)} · {t.sleepHours} {item.sleep_hours ?? "—"}</li>
      ))}
    </ul>
  );
}

export function WellnessTrendChart({ items }: { items: WellnessItem[] }) {
  const t = useTrackingCopy();
  const sleep = items.filter((item) => item.sleep_hours != null);
  if (sleep.length === 0) return <EmptyNote text={t.empty} />;
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sleep}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="recorded_date" tick={{ fontSize: 11 }} />
          <YAxis />
          <Tooltip />
          <Line dataKey="sleep_hours" stroke="#4C1D95" strokeWidth={2} dot={false} />
          <Line dataKey="energy_level" stroke="#9F78D2" strokeWidth={2} dot={false} />
          <Line dataKey="stress_level" stroke="#ECA5C9" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyCheckIn({ onSaved }: { onSaved: () => Promise<void> }) {
  const t = useTrackingCopy();
  const [date, setDate] = useState(dhakaToday());
  const [mood, setMood] = useState("neutral");
  const [hours, setHours] = useState("");
  const [quality, setQuality] = useState("");
  const [stress, setStress] = useState(2);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        void accountFetch("/wellness", {
          method: "POST",
          body: JSON.stringify({
            recorded_date: date,
            mood,
            sleep_hours: hours ? Number(hours) : null,
            sleep_quality: quality ? Number(quality) : null,
            stress_level: stress,
            energy_level: energy,
            notes: notes || null,
          }),
        }).then(() => onSaved()).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Error"));
      }}
    >
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.date}</span><input className={fieldClass} type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <MoodSelector value={mood} onChange={setMood} />
      <SleepInput hours={hours} quality={quality} onHours={setHours} onQuality={setQuality} />
      <StressSlider value={stress} onChange={setStress} />
      <EnergySlider value={energy} onChange={setEnergy} />
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.notes}</span><textarea className="min-h-20 rounded-2xl border border-line bg-ivory px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <SaveError message={error} />
      <button className="h-11 rounded-full bg-plum px-5 text-sm text-white" type="submit">{t.save}</button>
    </form>
  );
}

export function WellnessTracker() {
  const t = useTrackingCopy();
  const [items, setItems] = useState<WellnessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const summary = await accountFetch<{ points: WellnessItem[]; disclaimer: string }>("/wellness/summary");
      setItems(summary.points);
      setError("");
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
        <h2 className="text-3xl">{t.wellnessTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.wellnessLede}</p>
      </div>
      <Notice>{t.wellnessLede}</Notice>
      {loading && <LoadingNote text={t.loading} />}
      <SaveError message={error} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.checkIn}><DailyCheckIn onSaved={load} /></Panel>
        <Panel title={t.week}><WellnessCalendar items={[...items].reverse()} /></Panel>
      </div>
      <Panel title={t.sleepTrend}><WellnessTrendChart items={items} /></Panel>
    </div>
  );
}
