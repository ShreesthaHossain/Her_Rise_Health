"use client";

import { SimplePage } from "@/components/simple-page";
import { useCopy } from "@/components/providers";

export default function TermsPage() {
  const t = useCopy();
  return (
    <SimplePage title={t.terms}>
      <p>HerRise Health is an academic capstone for adults aged 18 and over.</p>
      <p>Use of the education tools does not create a clinician-patient relationship.</p>
      <p>Essential education and safety guidance are intended to stay free.</p>
    </SimplePage>
  );
}
