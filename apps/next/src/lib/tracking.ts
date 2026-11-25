import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type CycleItem = {
  id: string;
  period_start: string;
  period_end: string | null;
  flow_level: "light" | "medium" | "heavy";
  pain_level: number;
  notes: string | null;
};

export type CycleSummary = {
  record_count: number;
  current_cycle_day: number | null;
  last_period_start: string | null;
  average_cycle_length: number | null;
  average_period_duration: number | null;
  cycle_length_variation: number | null;
  cycle_lengths: number[];
  prediction: null | {
    earliest: string;
    latest: string;
    uncertainty_days: number;
    based_on_cycles: number;
    label: string;
  };
  prediction_note: string | null;
  disclaimer: string;
};

export type SymptomItem = {
  id: string;
  recorded_date: string;
  category: string;
  severity: number;
  duration_minutes: number | null;
  notes: string | null;
  cycle_log_id: string | null;
};

export type WellnessItem = {
  id: string;
  recorded_date: string;
  mood: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  stress_level: number;
  energy_level: number;
  notes: string | null;
};

export type ReminderItem = {
  id: string;
  title: string;
  reminder_type: string;
  schedule_config: { frequency: "daily" | "weekly"; time: string; weekday?: number | null; timezone: "Asia/Dhaka" };
  enabled: boolean;
  on_todays_list: boolean;
  delivery_note: string;
};

async function token() {
  if (!supabaseConfigured()) throw new Error("Supabase is not configured.");
  const supabase = createClient();
  const session = await supabase.auth.getSession();
  const access = session.data.session?.access_token;
  if (!access) throw new Error("Sign in required.");
  return access;
}

export async function trackingDownload(path: string, body: unknown) {
  const access = await token();
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const response = await fetch(`${base}/api/v1${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("The export could not be created.");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = response.headers.get("content-type")?.includes("pdf") ? "herrise-tracking.pdf" : "herrise-tracking.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export { addDays, dhakaToday, eachDate, monthCells } from "./tracking-dates";
