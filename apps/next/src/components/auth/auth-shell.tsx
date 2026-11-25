import Link from "next/link";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Mark } from "@/components/ui";

export function AuthShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <main className="page-in mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-2 md:px-8 md:py-16">
      <div className="mx-auto w-full max-w-md md:mx-0 md:max-w-none">{children}</div>
      <aside className="hidden rounded-[2rem] bg-plum px-8 py-10 text-primary-foreground md:block md:px-10 md:py-14">
        <Mark className="size-12 text-white" />
        <p className="mt-8 text-sm tracking-[0.16em] text-white/70 uppercase">HerRise Health</p>
        <h1 className="mt-3 max-w-sm text-4xl tracking-tight text-white md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80">{lede}</p>
        <Link href="/" className="mt-8 inline-flex text-sm text-white underline-offset-4 hover:underline">
          Back to the public site
        </Link>
      </aside>
    </main>
  );
}

export function TextField({
  id,
  label,
  type = "text",
  error,
  registration,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  error?: string;
  registration: UseFormRegisterReturn;
  autoComplete?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 rounded-2xl border border-line bg-ivory px-3 text-sm outline-none"
        {...registration}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-[#6e2e3c]">
          {error}
        </p>
      )}
    </div>
  );
}
