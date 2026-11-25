import type { ReactNode } from "react";

export function Mark({ className = "size-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path
        d="M24 34c0-8 6-10 6-16a6 6 0 1 0-12 0c0 6 6 8 6 16Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M24 22c2 2 5 2 7 0" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_0_rgb(36_27_53/0.04)] ${className}`}>{children}</section>;
}

const tones = {
  empty: "border-line bg-ivory text-ink",
  info: "border-line bg-surface text-ink",
  loading: "border-line bg-surface text-ink",
  success: "border-[#cfe4dc] bg-mint text-[#1d4f44]",
  error: "border-[#ead4d8] bg-[#f8eef1] text-[#6e2e3c]",
};

export function Status({
  tone,
  title,
  children,
}: {
  tone: keyof typeof tones;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-4 ${tones[tone]}`}>
      <p className="text-sm font-medium">{title}</p>
      {children && <div className="mt-1 text-sm leading-relaxed opacity-90">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line/80 ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 px-4 py-16 md:px-8" aria-hidden>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-24" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
