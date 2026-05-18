"use client";

import type { ReactNode } from "react";
import { useLanguage } from "@/components/i18n/language-provider";

export function LocalizedList({
  fallback,
  value,
  renderItem,
}: {
  fallback: string[];
  value?: { en: string[]; zh: string[]; ms: string[] };
  renderItem?: (item: string, index: number) => ReactNode;
}) {
  const { language } = useLanguage();
  const list = value ? (value[language]?.length ? value[language] : value.en ?? fallback) : fallback;
  if (renderItem) {
    return <>{list.map((item, i) => renderItem(item, i))}</>;
  }
  return <>{list.map((item, i) => <li key={i}>{item}</li>)}</>;
}
