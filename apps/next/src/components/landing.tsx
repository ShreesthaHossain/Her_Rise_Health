"use client";

import Link from "next/link";
import { BookOpen, Brain, CalendarDays, MapPin, MessageCircle, Shield, Sparkles } from "lucide-react";
import { useCopy } from "@/components/providers";

const icons = [MessageCircle, CalendarDays, BookOpen, Sparkles, MapPin, Brain];

export function Landing() {
  const t = useCopy();
  const lines = t.heroTitle.split(/(?<=[।.])\s+/).filter(Boolean);

  return (
    <div className="page-in">
      <section className="mx-auto grid max-w-6xl items-center gap-16 px-5 py-20 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        <div>
          <p className="eyebrow">{t.tagline}</p>
          <h1 className="mt-5 max-w-xl text-[2.65rem] leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem] lg:leading-[0.98]">
            {lines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">{t.heroText}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-12 items-center rounded-full bg-plum px-6 text-sm font-medium text-primary-foreground transition hover:bg-[#3f187c]">
              {t.start}
            </Link>
            <Link href="/features" className="inline-flex h-12 items-center rounded-full border border-line bg-surface px-6 text-sm font-medium text-plum transition hover:border-violet">
              {t.explore}
            </Link>
          </div>
        </div>
        <PhoneMock />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8" id="features">
        <div className="max-w-2xl">
          <p className="eyebrow">01</p>
          <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">{t.featureTitle}</h2>
          <p className="mt-3 text-muted leading-relaxed">{t.featureText}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {t.featuresList.map(([title, text], index) => {
            const Icon = icons[index] ?? Sparkles;
            return (
              <Link
                key={title}
                href="/features"
                className="group flex flex-col rounded-3xl border border-line bg-surface p-7 transition duration-300 hover:border-violet/60 hover:shadow-[0_18px_40px_-32px_rgb(76_29_149/0.55)]"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-ivory text-plum">
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-xs tracking-[0.16em] text-muted">0{index + 1}</span>
                </div>
                <h3 className="mt-6 text-xl tracking-tight">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{text}</p>
                <p className="mt-6 text-sm font-medium text-plum">{t.explore}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <p className="eyebrow">02</p>
        <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">{t.howTitle}</h2>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
          {t.steps.map(([title, text], index) => (
            <li key={title} className="bg-surface p-6">
              <p className="font-heading text-3xl tracking-tight text-violet">0{index + 1}</p>
              <h3 className="mt-6 text-lg">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8 md:px-8">
        <p className="eyebrow">03</p>
        <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">{t.topicsTitle}</h2>
        <div className="mt-8 flex flex-wrap gap-2.5">
          {t.topics.map((topic) => (
            <Link key={topic} href="/health-library" className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-ink transition hover:border-plum hover:text-plum">
              {topic}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <p className="eyebrow">04</p>
        <h2 className="mt-3 text-3xl tracking-tight md:text-4xl">{t.trustTitle}</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {t.trust.map(([title, text]) => (
            <article key={title} className="flex gap-4 rounded-3xl border border-line bg-surface p-6">
              <Shield className="mt-0.5 size-5 shrink-0 text-plum" strokeWidth={1.75} />
              <div>
                <h3 className="text-lg">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="rounded-[2rem] bg-plum px-7 py-14 text-primary-foreground md:px-14">
          <h2 className="max-w-xl text-4xl tracking-tight text-white md:text-5xl">{t.ctaTitle}</h2>
          <p className="mt-4 max-w-lg text-white/80">{t.ctaText}</p>
          <Link href="/register" className="mt-8 inline-flex h-12 items-center rounded-full bg-ivory px-6 text-sm font-medium text-plum">
            {t.getStarted}
          </Link>
        </div>
      </section>
    </div>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <div className="absolute -top-8 right-6 h-24 w-24 rounded-full bg-rose/30" />
      <div className="absolute bottom-12 -left-6 h-16 w-16 rounded-full bg-mint" />
      <div className="relative rounded-[2.4rem] bg-ink p-3 shadow-[0_30px_70px_-40px_rgb(36_27_53/0.65)]">
        <div className="rounded-[1.9rem] bg-ivory p-5 text-ink">
          <div className="mx-auto mb-5 h-1.5 w-14 rounded-full bg-line" />
          <p className="eyebrow">HerRise</p>
          <p className="font-heading mt-3 text-3xl tracking-tight">Today</p>
          <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-muted">Cycle log</p>
            <p className="mt-1 text-sm leading-relaxed">Your dates appear here after you record them.</p>
          </div>
          <div className="mt-3 rounded-2xl bg-mint/80 p-4">
            <p className="text-xs text-plum">Library</p>
            <p className="mt-1 text-sm leading-relaxed">Reviewed articles, with their sources.</p>
          </div>
          <div className="mt-3 rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs text-plum">Care</p>
            <p className="mt-1 text-sm leading-relaxed">Only listings the team has verified.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
