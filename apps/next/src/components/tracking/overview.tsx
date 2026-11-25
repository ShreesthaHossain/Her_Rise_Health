"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { accountFetch, type AccountProfile } from "@/lib/api/account";
import type { CycleSummary, SymptomItem, WellnessItem } from "@/lib/tracking";
import { EmptyNote, ExampleFrame, LoadingNote, Panel, SaveError, useTrackingCopy } from "./ui";
import { moodText } from "./wellness";

type Trends = { frequency: { category: string; count: number }[]; points: { recorded_date: string; severity: number }[] };

export function QuickActions() {
  const t = useTrackingCopy();
  const links = [
    ["/dashboard/period-tracker", t.logPeriod],
    ["/dashboard/symptoms", t.addSymptom],
    ["/dashboard/mental-wellness", t.checkIn],
    ["/dashboard/health-reports", t.viewReports],
    ["/dashboard/reminders", t.manageReminders],
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(([href, label]) => (
        <Link key={href} href={href} className="rounded-full bg-plum px-4 py-2 text-sm text-white">{label}</Link>
      ))}
    </div>
  );
}

export function CycleSummaryCard({ summary }: { summary: CycleSummary | null }) {
  const t = useTrackingCopy();
  return (
    <Panel title={t.navCycle}>
      {summary && summary.record_count > 0 ? (
        <div className="grid gap-1 text-sm">
          <p>{t.start}: {summary.last_period_start ?? "—"}</p>
          <p>{t.averageCycle}: {summary.average_cycle_length ?? t.notEnough}</p>
          <p>{summary.prediction ? `${summary.prediction.earliest} – ${summary.prediction.latest}` : t.notEnough}</p>
          <Link href="/dashboard/period-tracker" className="mt-2 text-plum">{t.logPeriod}</Link>
        </div>
      ) : (
        <>
          <EmptyNote text={t.empty} />
          <ExampleFrame text={t.example} />
        </>
      )}
    </Panel>
  );
}

export function SymptomSummaryCard({ trends }: { trends: Trends | null }) {
  const t = useTrackingCopy();
  const top = trends?.frequency[0];
  return (
    <Panel title={t.navSymptoms}>
      {trends && trends.points.length > 0 ? (
        <div className="text-sm">
          <p>{t.records}: {trends.points.length}</p>
          <p>{top ? `${t.categories[top.category as keyof typeof t.categories] ?? top.category}: ${top.count}` : t.empty}</p>
          <Link href="/dashboard/symptoms" className="mt-2 inline-block text-plum">{t.addSymptom}</Link>
        </div>
      ) : <EmptyNote text={t.empty} />}
    </Panel>
  );
}

export function WellnessOverview({ items }: { items: WellnessItem[] }) {
  const t = useTrackingCopy();
  const last = items[items.length - 1];
  return (
    <Panel title={t.navWellness}>
      {last ? (
        <div className="text-sm">
          <p>{last.recorded_date} · {moodText(t, last.mood)}</p>
          <p>{t.sleepHours}: {last.sleep_hours ?? "—"}</p>
          <p>{t.energy}: {last.energy_level} · {t.stress}: {last.stress_level}</p>
        </div>
      ) : <EmptyNote text={t.empty} />}
    </Panel>
  );
}

export function HealthTrendCards({ lengths, symptoms, wellness }: { lengths: number[]; symptoms: { recorded_date: string; severity: number }[]; wellness: WellnessItem[] }) {
  const t = useTrackingCopy();
  const cycleData = lengths.map((length, index) => ({ name: String(index + 1), length }));
  const sleep = wellness.filter((item) => item.sleep_hours != null);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title={t.averageCycle}>
        {cycleData.length === 0 ? <EmptyNote text={t.empty} /> : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line dataKey="length" stroke="#4C1D95" dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
      <Panel title={t.severityTrend}>
        {symptoms.length === 0 ? <EmptyNote text={t.empty} /> : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={symptoms}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="recorded_date" hide /><YAxis domain={[1, 10]} /><Tooltip /><Line dataKey="severity" stroke="#9F78D2" dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
      <Panel title={t.sleepTrend}>
        {sleep.length === 0 ? <EmptyNote text={t.empty} /> : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleep}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="recorded_date" hide /><YAxis /><Tooltip /><Line dataKey="sleep_hours" stroke="#4C1D95" dot={false} /><Line dataKey="energy_level" stroke="#ECA5C9" dot={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
    </div>
  );
}

export function DashboardHome() {
  const t = useTrackingCopy();
  const [name, setName] = useState("");
  const [summary, setSummary] = useState<CycleSummary | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [wellness, setWellness] = useState<WellnessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      accountFetch<AccountProfile>("/users/me"),
      accountFetch<CycleSummary>("/cycles/summary"),
      accountFetch<Trends>("/symptoms/trends"),
      accountFetch<{ points: WellnessItem[] }>("/wellness/summary"),
    ]).then(([profile, cycle, symptom, checkins]) => {
      if (!active) return;
      setName(profile.display_name);
      setSummary(cycle);
      setTrends(symptom);
      setWellness(checkins.points);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Error");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-4 pb-8">
      <div>
        <p className="text-sm text-muted">{name}</p>
        <h2 className="text-3xl">{t.glance}</h2>
      </div>
      {loading && <LoadingNote text={t.loading} />}
      <SaveError message={error} />
      <QuickActions />
      <div className="grid gap-4 lg:grid-cols-3">
        <CycleSummaryCard summary={summary} />
        <SymptomSummaryCard trends={trends} />
        <WellnessOverview items={wellness} />
      </div>
      <HealthTrendCards lengths={summary?.cycle_lengths ?? []} symptoms={trends?.points ?? []} wellness={wellness} />
    </div>
  );
}
