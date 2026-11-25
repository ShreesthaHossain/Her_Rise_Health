"use client";

import { SimplePage } from "@/components/simple-page";
import { useCopy } from "@/components/providers";

export default function DoctorsPage() {
  const t = useCopy();
  return (
    <SimplePage title={t.care}>
      <p>{t.emptyCare}</p>
      <p>Filters for district, service type, and a preference for a woman clinician will search a verified directory in a later phase.</p>
    </SimplePage>
  );
}
