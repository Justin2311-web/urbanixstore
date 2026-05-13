"use client";

import { Trash2 } from "lucide-react";
import type { CartLine } from "@ecommerce/shared";
import { formatCurrency } from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";
import { ProductVisual } from "@/components/commerce/product-visual";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { PriceDisplay } from "@/components/commerce/price-display";
import { PromotionBadge } from "@/components/commerce/promotion-badge";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { StockBadge } from "@/components/commerce/stock-badge";

export function CartItemCard({ line }: { line: CartLine }) {
  const { decrementItem, removeItem, addItem } = useCart();
  const { product, quantity, selectedVariants } = line;
  const cartKey = line.cartKey ?? product.id;
  const hasStockWarning = product.stockStatus !== "in_stock";

  return (
    <article className="grid grid-cols-[96px_1fr] gap-4 rounded-2xl border border-border/80 bg-card p-3 shadow-sm">
      <div className="relative">
        <ProductVisual
          className="rounded-xl"
          imageUrl={product.image || product.mainImageUrl || product.galleryImages?.[0]}
          tone={product.imageTone}
        />
        <div className="absolute left-2 top-2">
          <PromotionBadge percent={product.promotionPercent} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold">
              <LocalizedValue fallback={product.name} value={product.localizedName} />
            </h3>
            {selectedVariants && Object.keys(selectedVariants).length > 0 ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {Object.entries(selectedVariants).map(([k, v]) => `${k}: ${v}`).join(" · ")}
              </p>
            ) : null}
            <PriceDisplay originalPrice={product.originalPrice} price={product.price} />
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
          {hasStockWarning ? <StockBadge status={product.stockStatus} /> : null}
        </div>
      </div>
    </article>
  );
}
