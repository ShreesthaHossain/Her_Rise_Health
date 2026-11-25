"use client";

import { useLocale } from "@/components/providers";
import { trackingCopy } from "@/lib/tracking-copy";

export function useTrackingCopy() {
  const { locale } = useLocale();
  return trackingCopy[locale];
}

export const fieldClass = "h-11 w-full rounded-2xl border border-line bg-ivory px-3 text-sm outline-none";

export function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-surface p-5 shadow-sm ring-1 ring-line">
      <h2 className="text-lg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl bg-ivory px-4 py-3 text-sm leading-relaxed text-ink">{children}</p>;
}

export function LoadingNote({ text }: { text: string }) {
  return <p className="text-sm text-muted">{text}</p>;
}

export function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-4 py-6 text-sm text-muted">
      <p>{text}</p>
    </div>
  );
}

export function ExampleFrame({ text }: { text: string }) {
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-rose/70 bg-ivory/70 px-4 py-5" aria-hidden="true">
      <p className="text-xs text-plum">{text}</p>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }, (_, index) => (
          <span key={index} className="h-6 rounded-md bg-rose/30" />
        ))}
      </div>
    </div>
  );
}

export function SaveError({ message }: { message: string }) {
  if (!message) return null;
  return <p className="text-sm text-[#6e2e3c]" role="alert">{message}</p>;
}
