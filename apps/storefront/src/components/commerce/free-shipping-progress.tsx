"use client";

import { Truck } from "lucide-react";
import { calculateShippingFee, formatCurrency, type StoreSettings } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";

export function FreeShippingProgress({
  settings,
  subtotal,
  state,
}: {
  settings: StoreSettings;
  subtotal: number;
  // Cart page passes undefined (no state collected yet); checkout passes the
  // currently-selected state so the progress bar reflects East-vs-West threshold.
  state?: string | null;
}) {
  const { t } = useLanguage();

  // Use the same calculator the order API and OrderSummaryCard use, so the
  // bar never disagrees with the actual shipping fee shown elsewhere.
  const shipping = calculateShippingFee({ settings, state, subtotal });

  // No region resolved yet — happens on the cart page (no state) and on
  // checkout before the customer has picked a state. Show a prompt so the
  // customer knows what to do; do not invent a default threshold.
  if (shipping.pending || !shipping.freeShippingThreshold) {
    return (
      <Shell tone="muted">
        <Truck className="size-4 shrink-0" />
        <span>{t("freeShipping.selectState", "Select your state to check free shipping")}</span>
      </Shell>
    );
  }

  if (shipping.isFreeShippingApplied) {
    return (
      <Shell tone="success">
        <Truck className="size-4 shrink-0" />
        <span>{t("freeShipping.unlocked", "You unlocked free shipping")}</span>
      </Shell>
    );
  }

  const remaining = Math.max(0, shipping.freeShippingThreshold - subtotal);
  const remainingLabel = formatCurrency(remaining);
  const message = t(
    "freeShipping.add",
    "Add RM XX more to unlock free shipping",
  ).replace("RM XX", remainingLabel);
  const progress = Math.min(
    100,
    Math.max(0, Math.round((subtotal / shipping.freeShippingThreshold) * 100)),
  );

  return (
    <Shell tone="progress">
      <div className="flex items-center gap-2">
        <Truck className="size-4 shrink-0 text-primary" />
        <span className="text-sm font-bold text-foreground">{message}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Shell>
  );
}

function Shell({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "muted" | "success" | "progress";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "muted"
        ? "border-border bg-secondary/30 text-muted-foreground"
        : "border-primary/20 bg-primary/5 text-foreground";

  return (
    <div
      className={`rounded-2xl border p-3 text-sm font-semibold ${toneClass}`}
      data-component="free-shipping-progress"
    >
      {tone === "progress" ? children : (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}
