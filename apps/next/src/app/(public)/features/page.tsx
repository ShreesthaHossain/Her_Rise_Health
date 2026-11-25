"use client";

import { SimplePage } from "@/components/simple-page";
import { useCopy } from "@/components/providers";

export default function FeaturesPage() {
  const t = useCopy();
  return (
    <SimplePage title={t.features}>
      {t.featuresList.map(([title, text]) => (
        <section key={title}>
          <h2 className="text-xl text-ink">{title}</h2>
          <p>{text}</p>
        </section>
      ))}
    </SimplePage>
  );
}
