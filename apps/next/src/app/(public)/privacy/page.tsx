"use client";

import { SimplePage } from "@/components/simple-page";
import { useCopy } from "@/components/providers";

export default function PrivacyPage() {
  const t = useCopy();
  return (
    <SimplePage title={t.privacy}>
      <p>Health logs belong to the signed-in account. Research survey answers stay in a separate store and are not mixed into the diary.</p>
      <p>The product does not sell personal health data and does not use private logs for advertising.</p>
      <p>Account export and deletion are part of the existing API. This Phase 1 site does not store a new copy of that data.</p>
    </SimplePage>
  );
}
