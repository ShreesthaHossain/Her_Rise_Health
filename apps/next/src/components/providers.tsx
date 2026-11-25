"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { copy, type Locale } from "@/lib/copy";

type Theme = "light" | "dark";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "bn", setLocale: () => undefined });

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({ theme: "light", setTheme: () => undefined });

export function useLocale() {
  return useContext(LocaleContext);
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useCopy() {
  const { locale } = useLocale();
  return copy[locale];
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("bn");
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const storedLocale = localStorage.getItem("herrise-locale");
    if (storedLocale === "en" || storedLocale === "bn") setLocaleState(storedLocale);
    const storedTheme = localStorage.getItem("herrise-theme");
    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeState(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    }
    document.documentElement.lang = storedLocale === "en" ? "en" : "bn";
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem("herrise-locale", next);
    document.documentElement.lang = next === "bn" ? "bn" : "en";
  }

  function setTheme(next: Theme) {
    setThemeState(next);
    localStorage.setItem("herrise-theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
    </LocaleContext.Provider>
  );
}
