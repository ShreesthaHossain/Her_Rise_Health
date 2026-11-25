"use client";

import { useCopy } from "@/components/providers";
import { Eyebrow } from "@/components/ui";

export function SimplePage({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useCopy();
  return (
    <article className="page-in mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <Eyebrow>{t.brand}</Eyebrow>
      <h1 className="mt-3 text-4xl tracking-tight md:text-5xl">{title}</h1>
      <div className="mt-8 grid gap-4 text-base leading-relaxed text-muted">{children}</div>
    </article>
  );
}
