"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "urbanix-theme";
const TRANSITIONS_CLASS = "theme-transitions";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Phase B.1: dark is the default for new users.
    // Rule: stored='light' → light, otherwise (stored='dark' OR no stored
    // value) → dark. This MUST match the inline pre-paint script in
    // app/layout.tsx so the html.dark class added by that script lines up
    // with React's first-render theme state, avoiding hydration mismatch.
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Enable smooth transitions only after initial theme is applied to avoid flash
    const timer = window.setTimeout(() => {
      document.documentElement.classList.add(TRANSITIONS_CLASS);
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      setTheme(next: Theme) {
        setThemeState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
      theme,
      toggleTheme() {
        const next: Theme = theme === "dark" ? "light" : "dark";
        setThemeState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
        if (next === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      },
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
