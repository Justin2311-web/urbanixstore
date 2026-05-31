"use client";

import { Truck } from "lucide-react";
import { formatCurrency, type StoreSettings } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";

/**
 * Display-only shipping fee breakdown. Pulls all four numbers
 * (West/East flat fee + West/East free-shipping threshold) from
 * StoreSettings so admin changes flow through without code edits.
 *
 * Does NOT influence cart/checkout totals — those still come from
 * calculateOrderTotals / calculateShippingFee using the same settings
 * object. This card is purely informational.
 */
export function ShippingFeeBreakdown({ settings }: { settings: StoreSettings }) {
  const { t } = useLanguage();

  // Resolve with the same fallback chain freeShippingCopy uses, so this
  // never disagrees with the existing shippingText card.
  const westFee = numberOr(
    settings.westMalaysiaShippingFee ?? settings.shippingFee,
    7,
  );
  const eastFee = numberOr(settings.eastMalaysiaShippingFee, 15);
  const westThreshold = numberOr(
    settings.westMalaysiaFreeShippingMinimumAmount ??
      settings.freeShippingMinimumAmount ??
      settings.freeShippingMinAmount,
    80,
  );
  const eastThreshold = numberOr(settings.eastMalaysiaFreeShippingMinimumAmount, 150);

  const freeAboveTemplate = t("shippingFee.freeAbove", "Free above RM XX");

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 text-sm dark:bg-[rgba(11,21,40,0.62)]"
      data-component="shipping-fee-breakdown"
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
        <Truck className="size-3.5 text-primary" />
        {t("shippingFee.title", "Shipping Fees")}
      </div>
      <ul className="flex flex-col gap-2.5">
        <Row
          label={t("shippingFee.westLabel", "West Malaysia")}
          fee={westFee}
          freeAbove={freeAboveTemplate.replace("RM XX", formatCurrency(westThreshold))}
        />
        <Row
          label={t("shippingFee.eastLabel", "East Malaysia (Sabah, Sarawak, Labuan)")}
          fee={eastFee}
          freeAbove={freeAboveTemplate.replace("RM XX", formatCurrency(eastThreshold))}
        />
      </ul>
    </div>
  );
}

function Row({
  label,
  fee,
  freeAbove,
}: {
  label: string;
  fee: number;
  freeAbove: string;
}) {
  return (
    <li className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <span className="font-bold text-foreground">{label}</span>
      <span className="font-semibold text-muted-foreground">
        <span className="text-foreground">{formatCurrency(fee)}</span>
        <span className="mx-1.5 opacity-50">·</span>
        <span>{freeAbove}</span>
      </span>
    </li>
  );
}

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}
