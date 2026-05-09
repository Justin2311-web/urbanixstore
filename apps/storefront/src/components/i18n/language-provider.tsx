"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type LanguageCode, translations } from "@/lib/i18n";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const storageKey = "urbanix-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const stored = window.localStorage.getItem(storageKey);
    return stored === "en" || stored === "zh" || stored === "ms" ? stored : "en";
  });

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage(nextLanguage) {
      setLanguageState(nextLanguage);
      window.localStorage.setItem(storageKey, nextLanguage);
      document.documentElement.lang = nextLanguage === "zh" ? "zh-CN" : nextLanguage;
    },
    t(key, fallback) {
      return translations[language][key] ?? fallback ?? translations.en[key] ?? key;
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
