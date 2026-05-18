"use client";

import type { ReactNode } from "react";
import type { LanguageCode } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";

export function useLocalizedArray(value?: Partial<Record<LanguageCode, string[]>>, fallback: string[] = []) {
  const { language } = useLanguage();
  const selected = value?.[language] ?? [];
  const english = value?.en ?? [];

  return selected.length > 0 ? selected : english.length > 0 ? english : fallback;
}

export function LocalizedArray({
  children,
  fallback = [],
  value,
}: {
  value?: Partial<Record<LanguageCode, string[]>>;
  fallback?: string[];
  children: (items: string[]) => ReactNode;
}) {
  const items = useLocalizedArray(value, fallback);
  return <>{children(items)}</>;
}
