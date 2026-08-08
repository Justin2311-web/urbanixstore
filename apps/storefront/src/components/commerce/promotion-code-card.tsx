"use client";

import { useCallback, useEffect, useState } from "react";
import type { CartLine } from "@ecommerce/shared";
import type { AppliedPromotion } from "@/lib/promotion-service";
import { useCart } from "@/components/cart/cart-provider";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PromotionCodeCard({
  lines,
  customerPhone,
  onPromotionChange,
}: {
  lines: CartLine[];
  customerPhone?: string;
  onPromotionChange: (promotion: AppliedPromotion | null) => void;
}) {
  const { promoCode, setPromoCode } = useCart();
  const { t } = useLanguage();
  const [input, setInput] = useState(promoCode);
  const [promotion, setPromotion] = useState<AppliedPromotion | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const itemsPayload = JSON.stringify(lines.map((line) => ({
    productId: line.product.id,
    quantity: line.quantity,
    selectedVariants: line.selectedVariants ?? null,
  })));

  const apply = useCallback(async (code: string, persist: boolean) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/promotions/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: normalized,
          customerPhone,
          items: JSON.parse(itemsPayload),
        }),
      });
      const data = await response.json() as { promotion?: AppliedPromotion; error?: string };
      if (!response.ok || !data.promotion) throw new Error(data.error ?? t("promo.invalid", "Invalid promo code."));
      setPromotion(data.promotion);
      onPromotionChange(data.promotion);
      if (persist) setPromoCode(normalized);
    } catch (applyError) {
      setPromotion(null);
      onPromotionChange(null);
      setError(applyError instanceof Error ? applyError.message : t("promo.invalid", "Invalid promo code."));
    } finally {
      setLoading(false);
    }
  }, [customerPhone, itemsPayload, onPromotionChange, setPromoCode, t]);

  useEffect(() => {
    if (!promoCode) return;
    const timer = window.setTimeout(() => void apply(promoCode, false), 150);
    return () => window.clearTimeout(timer);
  }, [apply, onPromotionChange, promoCode]);

  function remove() {
    setPromoCode("");
    setInput("");
    setPromotion(null);
    setError("");
    onPromotionChange(null);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-2 text-sm font-bold">{t("promo.title", "Promo Code")}</p>
      <div className="flex gap-2">
        <Input
          aria-label={t("promo.title", "Promo Code")}
          disabled={loading}
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          placeholder={t("promo.placeholder", "Enter promo code")}
          value={input}
        />
        <Button disabled={loading || !input.trim()} onClick={() => void apply(input, true)} type="button" variant="outline">
          {loading ? t("promo.applying", "Applying…") : t("promo.apply", "Apply")}
        </Button>
      </div>
      {promotion ? (
        <div className="mt-3 rounded-xl bg-green-50 p-3 text-xs text-green-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-extrabold">{promotion.promoCode} {t("promo.applied", "Applied")}</p>
              <p className="mt-0.5">{promotion.campaignName}</p>
              <p className="mt-1 font-semibold">
                {promotion.sequenceRules.map((rule) =>
                  `${rule.position}: ${rule.discountValue}${rule.discountType === "percentage" ? "%" : " RM"} OFF`
                ).join(" · ")}
              </p>
            </div>
            <button className="font-bold underline" onClick={remove} type="button">{t("promo.remove", "Remove")}</button>
          </div>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}
