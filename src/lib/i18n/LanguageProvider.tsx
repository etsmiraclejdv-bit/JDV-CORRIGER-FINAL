"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { JDV_LOCALES, messages, type JdvLocale, type TranslationKey } from "@/lib/i18n/messages";

const STORAGE_KEY = "jdv-crm-language-v1";
type LanguageContextValue = {
  locale: JdvLocale;
  setLocale: (locale: JdvLocale) => void;
  t: (key: TranslationKey) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  locales: typeof JDV_LOCALES;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<JdvLocale>("fr");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && JDV_LOCALES.some((item) => item.code === saved)) {
        setLocaleState(saved as JdvLocale);
        return;
      }
      const browserLanguage = navigator.language;
      const match = JDV_LOCALES.find((item) => item.code.toLowerCase() === browserLanguage.toLowerCase())
        ?? JDV_LOCALES.find((item) => item.code === browserLanguage.split("-")[0]);
      if (match) setLocaleState(match.code);
    } catch { /* Storage may be disabled; the in-memory preference still works. */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((next: JdvLocale) => {
    setLocaleState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* Private browsing may block storage. */ }
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    setLocale,
    t: (key) => messages[locale][key] ?? messages.fr[key] ?? key,
    formatDate: (value, options) => new Intl.DateTimeFormat(locale, options).format(new Date(value)),
    formatNumber: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    locales: JDV_LOCALES,
  }), [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
