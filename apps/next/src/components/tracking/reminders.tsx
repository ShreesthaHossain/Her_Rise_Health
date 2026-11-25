"use client";

import { useEffect, useState } from "react";
import { accountFetch } from "@/lib/api/account";
import type { ReminderItem } from "@/lib/tracking";
import { EmptyNote, LoadingNote, Notice, Panel, SaveError, fieldClass, useTrackingCopy } from "./ui";

export function ReminderSchedule({
  frequency,
  setFrequency,
  time,
  setTime,
  weekday,
  setWeekday,
}: {
  frequency: "daily" | "weekly";
  setFrequency: (value: "daily" | "weekly") => void;
  time: string;
  setTime: (value: string) => void;
  weekday: number;
  setWeekday: (value: number) => void;
}) {
  const t = useTrackingCopy();
  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        <button type="button" className={`h-10 rounded-full px-4 text-sm ${frequency === "daily" ? "bg-plum text-white" : "bg-ivory"}`} onClick={() => setFrequency("daily")}>{t.daily}</button>
        <button type="button" className={`h-10 rounded-full px-4 text-sm ${frequency === "weekly" ? "bg-plum text-white" : "bg-ivory"}`} onClick={() => setFrequency("weekly")}>{t.weekly}</button>
      </div>
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.time}</span><input className={fieldClass} type="time" required value={time} onChange={(event) => setTime(event.target.value)} /></label>
      {frequency === "weekly" && (
        <label className="grid gap-1 text-sm">
          <span className="text-muted">{t.weekday}</span>
          <select className={fieldClass} value={weekday} onChange={(event) => setWeekday(Number(event.target.value))}>
            {t.weekdays.map((label, index) => <option key={label} value={index}>{label}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}

export function ReminderForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const t = useTrackingCopy();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("wellness");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [time, setTime] = useState("20:00");
  const [weekday, setWeekday] = useState(0);
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        void accountFetch("/reminders", {
          method: "POST",
          body: JSON.stringify({
            title,
            reminder_type: type,
            schedule_config: { frequency, time, weekday: frequency === "weekly" ? weekday : null, timezone: "Asia/Dhaka" },
          }),
        }).then(() => onSaved()).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Error"));
      }}
    >
      <label className="grid gap-1 text-sm"><span className="text-muted">{t.title}</span><input className={fieldClass} required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">{t.type}</span>
        <select className={fieldClass} value={type} onChange={(event) => setType(event.target.value)}>
          <option value="period">{t.navCycle}</option>
          <option value="symptom">{t.navSymptoms}</option>
          <option value="wellness">{t.navWellness}</option>
          <option value="custom">{t.categories.other}</option>
        </select>
      </label>
      <ReminderSchedule frequency={frequency} setFrequency={setFrequency} time={time} setTime={setTime} weekday={weekday} setWeekday={setWeekday} />
      <SaveError message={error} />
      <button className="h-11 rounded-full bg-plum px-5 text-sm text-white" type="submit">{t.save}</button>
    </form>
  );
}

export function ReminderList({ items, onChange }: { items: ReminderItem[]; onChange: () => Promise<void> }) {
  const t = useTrackingCopy();
  if (items.length === 0) return <EmptyNote text={t.empty} />;
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl bg-ivory px-3 py-3 text-sm">
          <p className="font-medium">{item.title}</p>
          <p className="text-muted">{item.schedule_config.time} · {item.schedule_config.frequency === "daily" ? t.daily : t.weekdays[item.schedule_config.weekday ?? 0]}</p>
          <p>{item.enabled ? (item.on_todays_list ? t.todayList : t.notToday) : t.paused}</p>
          <p className="text-xs text-muted">{item.delivery_note}</p>
          <div className="mt-2 flex gap-3">
            <button type="button" className="text-plum" onClick={() => void accountFetch(`/reminders/${item.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !item.enabled }) }).then(onChange)}>{item.enabled ? t.pause : t.resume}</button>
            <button type="button" className="text-[#6e2e3c]" onClick={() => void accountFetch(`/reminders/${item.id}`, { method: "DELETE" }).then(onChange)}>{t.remove}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RemindersPage() {
  const t = useTrackingCopy();
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const page = await accountFetch<{ items: ReminderItem[] }>("/reminders");
      setItems(page.items);
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
        <h2 className="text-3xl">{t.reminderTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.reminderLede}</p>
      </div>
      <Notice>{t.reminderLede}</Notice>
      {loading && <LoadingNote text={t.loading} />}
      <SaveError message={error} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.save}><ReminderForm onSaved={load} /></Panel>
        <Panel title={t.reminderTitle}><ReminderList items={items} onChange={load} /></Panel>
      </div>
    </div>
  );
}
