"use client";

import Link from "next/link";
import { useCopy } from "@/components/providers";

const cards = [
  ["/dashboard/period-tracker", "Cycle tracker", "No period has been recorded in this shell."],
  ["/dashboard/symptoms", "Symptoms logged", "No symptom journal is connected yet."],
  ["/dashboard/reminders", "Reminders", "No reminder is scheduled."],
  ["/dashboard/health-library", "Saved articles", "Bookmarks arrive with the library accounts."],
];

export default function DashboardPage() {
  const t = useCopy();
  return (
    <div className="grid gap-4 pb-8">
      <p className="text-sm text-muted">{t.later}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(([href, title, text]) => (
          <Link key={href} href={href} className="rounded-3xl bg-surface p-5 ring-1 ring-line">
            <h2 className="text-lg">{title}</h2>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["/dashboard/ai-assistant", "Ask"],
          ["/dashboard/symptoms", "Log symptoms"],
          ["/dashboard/period-tracker", "Track period"],
          ["/dashboard/doctors", "Find care"],
          ["/health-library", "Read"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-full bg-mint px-4 py-2 text-sm text-plum">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
