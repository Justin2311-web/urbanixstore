"use client";

import { languageOptions } from "@/lib/i18n";
import { useLanguage } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={cn("flex items-center rounded-full border border-border bg-white/95 p-0.5 shadow-sm ring-1 ring-primary/5", compact ? "scale-90" : "")}>
      {languageOptions.map((option) => (
        <button
          aria-pressed={language === option.code}
          className={cn(
            "min-w-9 rounded-full px-2 py-1 text-xs font-extrabold transition",
            language === option.code ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-primary"
          )}
          key={option.code}
          onClick={() => setLanguage(option.code)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
