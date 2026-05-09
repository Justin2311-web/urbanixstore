"use client";

import type { LocalizedTextValue } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";

export function LocalizedValue({
  fallback,
  value,
}: {
  fallback?: string;
  value?: LocalizedTextValue;
}) {
  const { language } = useLanguage();

  return <>{value?.[language] || value?.en || fallback || ""}</>;
}
