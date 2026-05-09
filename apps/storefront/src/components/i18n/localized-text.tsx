"use client";

import { useLanguage } from "@/components/i18n/language-provider";

export function LocalizedText({
  fallback,
  k,
}: {
  k: string;
  fallback?: string;
}) {
  const { t } = useLanguage();

  return <>{t(k, fallback)}</>;
}
