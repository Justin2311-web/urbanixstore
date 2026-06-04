"use client";

import { Search } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import { Input } from "@/components/ui/input";

export function SearchBar({
  defaultValue,
  placeholder = "Search products...",
}: {
  placeholder?: string;
  defaultValue?: string;
}) {
  const { t } = useLanguage();
  const resolvedPlaceholder = t(
    placeholder === "Search Urbanix products..." ? "products.searchPlaceholder" : "nav.search",
    placeholder
  );

  return (
    <form action="/search" className="relative" role="search">
      <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label={t("nav.search", "Search")}
        className="h-12 rounded-2xl pl-11"
        defaultValue={defaultValue}
        name="q"
        placeholder={resolvedPlaceholder}
        type="search"
      />
    </form>
  );
}
