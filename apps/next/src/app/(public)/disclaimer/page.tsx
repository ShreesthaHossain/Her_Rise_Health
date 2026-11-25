"use client";

import { SimplePage } from "@/components/simple-page";
import { useCopy } from "@/components/providers";

export default function DisclaimerPage() {
  const t = useCopy();
  return (
    <SimplePage title={t.disclaimer}>
      <p>HerRise does not diagnose diseases, prescribe medication, or replace a clinician.</p>
      <p>Cycle windows, when they are added, will be labeled as estimates. They are not contraception and they do not confirm pregnancy.</p>
      <p>If bleeding is very heavy, you faint, or you may harm yourself, contact nearby emergency care. Do not wait for a chat reply.</p>
    </SimplePage>
  );
}
