"use client";

import Link from "next/link";
import { use } from "react";
import { useCopy } from "@/components/providers";

const modules: Record<string, string> = {
  "period-tracker": "Menstrual cycle tracker",
  symptoms: "Symptom journal",
  "ai-assistant": "AI health assistant",
  "health-library": "Library",
  doctors: "Healthcare finder",
  "mental-wellness": "Mental wellness",
  "health-reports": "Personal reports",
  reminders: "Reminders",
  profile: "Profile",
  settings: "Settings",
  privacy: "Privacy",
};

export default function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = use(params);
  const title = modules[module];
  const t = useCopy();
  if (!title) return <p className="text-muted">This page is not part of the shell.</p>;
  return (
    <section className="max-w-2xl pb-10">
      <h2 className="text-3xl">{title}</h2>
      <p className="mt-3 text-muted">{t.later}</p>
      <p className="mt-3 text-sm text-muted">
        The working log, library, care list, and guided ask tool still run in the Vite app at http://localhost:5173 until they move here.
      </p>
      <Link href="/dashboard" className="mt-6 inline-flex rounded-full bg-plum px-4 py-2 text-sm text-primary-foreground">
        {t.home}
      </Link>
    </section>
  );
}
