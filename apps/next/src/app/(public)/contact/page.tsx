"use client";

import { SimplePage } from "@/components/simple-page";
import { useCopy } from "@/components/providers";

export default function ContactPage() {
  const t = useCopy();
  return (
    <SimplePage title={t.contact}>
      <p>{t.team}</p>
      <p>{t.footerNote}</p>
      <p>A contact form is not connected in this phase, so this page does not send a message.</p>
    </SimplePage>
  );
}
