"use client";

import { Trash2 } from "lucide-react";
import type { CartLine } from "@ecommerce/shared";
import { formatCurrency } from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { getCartItemDisplayPricing } from "@/lib/cart-utils";
import { Button } from "@/components/ui/button";
import { LocalizedProductVisual } from "@/components/commerce/localized-product-visual";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { useLanguage } from "@/components/i18n/language-provider";
import { PriceDisplay } from "@/components/commerce/price-display";
import { PromotionBadge } from "@/components/commerce/promotion-badge";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { StockBadge } from "@/components/commerce/stock-badge";

export function CartItemCard({ line }: { line: CartLine }) {
  const { decrementItem, removeItem, addItem } = useCart();
  const { language } = useLanguage();
  const { product, quantity, selectedVariants } = line;
  const cartKey = line.cartKey ?? product.id;

  // Resolve variant-level price for display
  const { price: displayPrice, originalPrice: displayOriginalPrice } =
    getCartItemDisplayPricing(product, selectedVariants);

  // Determine stock status from selected variant (new format) or product-level (old)
  const selectedVariantEntry =
    product.variants && selectedVariants?.variant
      ? product.variants.find((v) => v.name === selectedVariants.variant)
      : product.variants?.[0];
  const stockStatus = selectedVariantEntry
    ? selectedVariantEntry.stockQuantity <= 0
      ? ("out_of_stock" as const)
      : selectedVariantEntry.stockQuantity <= 5
        ? ("low_stock" as const)
        : ("in_stock" as const)
    : product.stockStatus;
  const hasStockWarning = stockStatus !== "in_stock";

  // Show variant name (new format) or key=value pairs (legacy format)
  const variantLabel =
    selectedVariants?.variant
      ? selectedVariantEntry?.localizedName?.[language] || selectedVariantEntry?.localizedName?.en || selectedVariants.variant
      : selectedVariants && Object.keys(selectedVariants).length > 0
        ? Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(" · ")
        : null;

  return (
    <article className="grid grid-cols-[96px_1fr] gap-4 rounded-2xl border border-border/80 bg-card p-3 shadow-sm">
      <div className="relative">
        <LocalizedProductVisual
          className="rounded-xl"
          product={product}
          tone={product.imageTone}
        />
        <div className="absolute left-2 top-2">
          <PromotionBadge
            percent={
              displayOriginalPrice && displayOriginalPrice > displayPrice
                ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
                : undefined
            }
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold">
              <LocalizedValue fallback={product.name} value={product.localizedName} />
            </h3>
            {variantLabel ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{variantLabel}</p>
            ) : null}
            <PriceDisplay originalPrice={displayOriginalPrice} price={displayPrice} />
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Line total: {formatCurrency(line.lineTotal)}
            </p>
          </div>
          <Button
            aria-label={`Remove ${product.name}`}
            onClick={() => removeItem(cartKey)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <Trash2 />
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <QuantitySelector
            onDecrease={() => decrementItem(cartKey)}
            onIncrease={() => addItem(product.id, 1, selectedVariants)}
            value={quantity}
          />
          {hasStockWarning ? <StockBadge status={stockStatus} /> : null}
        </div>
      </div>
    </article>
  );
}
