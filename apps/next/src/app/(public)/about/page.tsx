"use client";

import { SimplePage } from "@/components/simple-page";
import { useCopy } from "@/components/providers";

export default function AboutPage() {
  const t = useCopy();
  return (
    <SimplePage title={t.about}>
      <p>{t.heroText}</p>
      <p>{t.footerNote}</p>
      <p>{t.team}</p>
      <p>{t.ctaText}</p>
    </SimplePage>
  );
}
