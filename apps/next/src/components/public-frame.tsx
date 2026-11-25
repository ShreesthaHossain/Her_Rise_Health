"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useCopy, useLocale, useTheme } from "@/components/providers";

const links = [
  ["/", "home"],
  ["/features", "features"],
  ["/health-library", "library"],
  ["/doctors", "care"],
  ["/about", "about"],
] as const;

export function PublicFrame({ children }: { children: React.ReactNode }) {
  const t = useCopy();
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-plum focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground">
        Skip to content
      </a>
      <header className={`sticky top-0 z-30 border-b bg-ivory/95 ${scrolled ? "border-line" : "border-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:px-8">
          <Link href="/" className="font-heading text-lg tracking-tight text-plum">
            {t.brand}
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted lg:flex">
            {links.map(([href, key]) => (
              <Link key={href} href={href} className="transition hover:text-plum">
                {t[key]}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <button type="button" className="h-10 rounded-full px-3 text-sm text-plum" onClick={() => setLocale(locale === "bn" ? "en" : "bn")}>
              {t.language}
            </button>
            <button
              type="button"
              aria-label={t.theme}
              className="grid size-10 place-items-center rounded-full text-plum"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <Link href="/login" className="hidden h-10 items-center px-3 text-sm text-plum sm:inline-flex">
              {t.signIn}
            </Link>
            <Link href="/register" className="inline-flex h-10 items-center rounded-full bg-plum px-4 text-sm text-primary-foreground">
              {t.getStarted}
            </Link>
            <button type="button" className="grid size-10 place-items-center lg:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Menu">
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="grid gap-1 border-t border-line px-4 py-3 lg:hidden">
            {links.map(([href, key]) => (
              <Link key={href} href={href} className="rounded-2xl px-3 py-3 text-sm" onClick={() => setOpen(false)}>
                {t[key]}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main id="content" className="flex-1">{children}</main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4 md:px-8">
          <div>
            <p className="font-heading text-lg text-plum">{t.brand}</p>
            <p className="mt-2 text-sm text-muted">{t.tagline}</p>
            <p className="mt-4 text-sm text-muted">{t.footerNote}</p>
          </div>
          <div>
            <p className="text-sm font-medium">{t.resources}</p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <Link href="/health-library">{t.library}</Link>
              <Link href="/features">{t.features}</Link>
              <Link href="/about">{t.about}</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">{t.privacy}</p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <Link href="/privacy">{t.privacy}</Link>
              <Link href="/terms">{t.terms}</Link>
              <Link href="/disclaimer">{t.disclaimer}</Link>
              <Link href="/contact">{t.contact}</Link>
            </div>
          </div>
          <p className="text-sm text-muted">{t.team}</p>
        </div>
      </footer>
    </div>
  );
}
