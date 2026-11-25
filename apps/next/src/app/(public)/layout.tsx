import { Suspense } from "react";
import { PublicFrame } from "@/components/public-frame";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicFrame>
      <Suspense fallback={<p className="px-8 py-16 text-sm text-muted">Loading…</p>}>{children}</Suspense>
    </PublicFrame>
  );
}
