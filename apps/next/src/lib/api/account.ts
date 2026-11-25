"use client";

import { createClient, supabaseConfigured } from "@/lib/supabase/client";

export type AccountProfile = {
  id: string;
  email: string | null;
  display_name: string;
  preferred_language: "bn" | "en";
  timezone: string;
  onboarding_completed: boolean;
  role: "member" | "admin";
};

async function readError(response: Response) {
  try {
    const body = await response.json();
    const detail = body.detail;
    if (detail && typeof detail === "object" && typeof detail.message === "string") return detail.message;
    if (typeof detail === "string") return detail;
  } catch {
    return "The request could not be completed.";
  }
  return "The request could not be completed.";
}

export async function accountFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!supabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in required.");
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  if (!token) throw new Error("Sign in required.");
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const response = await fetch(`${base}/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await readError(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
