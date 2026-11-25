"use client";

import { useState } from "react";
import { accountFetch } from "@/lib/api/account";
import { trackingDownload } from "@/lib/tracking";
import { Notice, Panel, SaveError, fieldClass, useTrackingCopy } from "./ui";

type Report = {
  start: string;
  end: string;
  limitations: string;
  cycles: { period_start: string; flow_level: string; pain_level: number }[];
  symptoms: { recorded_date: string; category: string; severity: number }[];
  wellness: { recorded_date: string; mood: string; sleep_hours: number | null }[];
};

export function ReportDateFilter({
  range,
  setRange,
  start,
  setStart,
  end,
  setEnd,
}: {
  range: string;
  setRange: (value: string) => void;
  start: string;
  setStart: (value: string) => void;
  end: string;
  setEnd: (value: string) => void;
}) {
  const t = useTrackingCopy();
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {[["7", t.last7], ["30", t.last30], ["90", t.last90], ["custom", t.custom]].map(([value, label]) => (
          <button key={value} type="button" className={`h-10 rounded-full px-4 text-sm ${range === value ? "bg-plum text-white" : "bg-ivory"}`} onClick={() => setRange(value)}>
            {label}
          </button>
        ))}
      </div>
      {range === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm"><span className="text-muted">{t.from}</span><input className={fieldClass} type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label>
          <label className="grid gap-1 text-sm"><span className="text-muted">{t.to}</span><input className={fieldClass} type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
        </div>
      )}
    </div>
  );
}

export function ReportSummary({ report }: { report: Report | null }) {
  const t = useTrackingCopy();
  if (!report) return null;
  return (
    <div className="grid gap-3 text-sm">
      <p>{report.start} – {report.end}</p>
      <p>{t.records}: {report.cycles.length}</p>
      <p>{t.symptomTitle}: {report.symptoms.length}</p>
      <p>{t.wellnessTitle}: {report.wellness.length}</p>
      <Notice>{report.limitations}</Notice>
    </div>
  );
}

export function ReportCharts({ report }: { report: Report | null }) {
  if (!report) return null;
  return (
    <ul className="grid gap-2 text-sm">
      {report.cycles.map((row) => <li key={`${row.period_start}-${row.flow_level}`} className="rounded-2xl bg-ivory px-3 py-2">{row.period_start} · {row.flow_level} · {row.pain_level}</li>)}
      {report.symptoms.map((row) => <li key={`${row.recorded_date}-${row.category}`} className="rounded-2xl bg-mint/50 px-3 py-2">{row.recorded_date} · {row.category} · {row.severity}</li>)}
      {report.wellness.map((row) => <li key={`${row.recorded_date}-${row.mood}`} className="rounded-2xl bg-rose/20 px-3 py-2">{row.recorded_date} · {row.mood} · {row.sleep_hours ?? "—"}</li>)}
    </ul>
  );
}

export function ReportExportButton({ body }: { body: Record<string, unknown> }) {
  const t = useTrackingCopy();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="h-11 rounded-full bg-plum px-5 text-sm text-white" onClick={() => void trackingDownload("/reports/export", { ...body, format: "csv" }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Error"))}>{t.csv}</button>
      <button type="button" className="h-11 rounded-full bg-mint px-5 text-sm text-plum" onClick={() => void trackingDownload("/reports/export", { ...body, format: "pdf" }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Error"))}>{t.pdf}</button>
      <button type="button" className="h-11 rounded-full px-4 text-sm" onClick={() => window.print()}>{t.print}</button>
      <SaveError message={error} />
    </div>
  );
}

export function ReportsPage() {
  const t = useTrackingCopy();
  const [range, setRange] = useState("30");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [kind, setKind] = useState("combined");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const body = range === "custom" ? { kind, start, end } : { kind, range_days: Number(range) };

  return (
    <div className="grid gap-4 pb-8 print:block">
      <div>
        <h2 className="text-3xl">{t.reportTitle}</h2>
        <p className="mt-2 text-sm text-muted">{t.reportLede}</p>
      </div>
      <Panel title={t.kind}>
        <label className="mb-3 grid gap-1 text-sm">
          <span className="text-muted">{t.kind}</span>
          <select className={fieldClass} value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="combined">{t.combined}</option>
            <option value="cycle">{t.cycleReport}</option>
            <option value="symptom">{t.symptomReport}</option>
            <option value="wellness">{t.wellnessReport}</option>
          </select>
        </label>
        <ReportDateFilter range={range} setRange={setRange} start={start} setStart={setStart} end={end} setEnd={setEnd} />
        <button
          type="button"
          className="mt-4 h-11 rounded-full bg-plum px-5 text-sm text-white"
          onClick={() => {
            const params = new URLSearchParams({ kind });
            if (range === "custom") {
              params.set("start", start);
              params.set("end", end);
            } else params.set("range_days", range);
            void accountFetch<Report>(`/reports/summary?${params.toString()}`).then(setReport).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Error"));
          }}
        >
          {t.viewReports}
        </button>
        <SaveError message={error} />
      </Panel>
      <Panel title={t.reportTitle}>
        <ReportSummary report={report} />
        <div className="mt-4"><ReportCharts report={report} /></div>
      </Panel>
      <ReportExportButton body={body} />
      <p className="text-xs text-muted">{t.printNote}</p>
    </div>
  );
}
