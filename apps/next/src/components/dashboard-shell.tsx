"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, House, MapPin, MessageCircle, Moon, Sun, UserRound } from "lucide-react";
import { useCopy, useLocale, useTheme } from "@/components/providers";
import { accountFetch, type AccountProfile } from "@/lib/api/account";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const items = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/dashboard/period-tracker", label: "Cycle", icon: CalendarDays },
  { href: "/dashboard/symptoms", label: "Symptoms", icon: CalendarDays },
  { href: "/dashboard/ai-assistant", label: "Ask", icon: MessageCircle },
  { href: "/dashboard/health-library", label: "Library", icon: BookOpen },
  { href: "/dashboard/doctors", label: "Care", icon: MapPin },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

const mobile = items.slice(0, 5);

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const t = useCopy();
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const hour = new Date().getHours();
  const hello = hour < 5 || hour >= 17 ? t.goodEvening : hour < 12 ? t.goodMorning : t.goodAfternoon;

  useEffect(() => {
    let active = true;
    accountFetch<AccountProfile>("/users/me")
      .then((profile) => {
        if (active) setName(profile.display_name);
      })
      .catch(() => {
        if (active) setName("");
      });
    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    if (!supabaseConfigured()) return;
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-line bg-surface px-4 py-6 md:flex md:flex-col">
        <Link href="/" className="font-heading text-lg text-plum">
          {t.brand}
        </Link>
        <nav className="mt-8 grid gap-1">
          {items.map((item) => {
            const active = path === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm ${active ? "bg-mint text-plum" : "text-ink hover:bg-ivory"}`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto grid gap-2 text-sm">
          <Link href="/dashboard/settings" className="rounded-2xl px-3 py-2 hover:bg-ivory">
            Settings
          </Link>
          <Link href="/dashboard/privacy" className="rounded-2xl px-3 py-2 hover:bg-ivory">
            {t.privacy}
          </Link>
          <button type="button" className="rounded-2xl px-3 py-2 text-left hover:bg-ivory" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="pb-24 md:pb-0">
        <header className="flex items-center justify-between gap-3 px-4 py-5 md:px-8">
          <div>
            <p className="text-sm text-muted">{hello}</p>
            <h1 className="text-3xl">{name || t.welcome}</h1>
            <p className="text-sm text-muted">{t.dashboardHello}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full px-3 py-2 text-sm text-plum" onClick={() => setLocale(locale === "bn" ? "en" : "bn")}>
              {t.language}
            </button>
            <button type="button" aria-label={t.theme} className="grid size-10 place-items-center rounded-full" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button type="button" className="h-10 rounded-full px-3 text-sm text-plum md:hidden" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </header>
        <div className="px-4 md:px-8">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface md:hidden">
        {mobile.map((item) => {
          const Icon = item.icon;
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href} className={`grid place-items-center py-3 text-[11px] ${active ? "text-plum" : "text-muted"}`}>
              <Icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
