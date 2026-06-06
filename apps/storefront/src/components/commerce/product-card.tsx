"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { UrbanixProduct } from "@ecommerce/shared";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { LocalizedProductVisual } from "@/components/commerce/localized-product-visual";
import { PriceDisplay } from "@/components/commerce/price-display";
import { PromotionBadge } from "@/components/commerce/promotion-badge";
import { StockBadge } from "@/components/commerce/stock-badge";
import { useLanguage } from "@/components/i18n/language-provider";
import { LocalizedValue } from "@/components/i18n/localized-value";

type ProductCardProps = {
  product: UrbanixProduct;
  compact?: boolean;
};

export function ProductCard({ compact = false, product }: ProductCardProps) {
  const hasOptions = (product.variantGroups?.length ?? 0) > 0;
  const { t } = useLanguage();
  // Only show rating/sold widget when there is actual social proof.
  // Prevents nonsense like "4.7(0)" when a default rating exists but nothing has sold yet.
  const hasReviewData = product.sold > 0 && product.rating > 0;

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/75 bg-card/92 p-2 shadow-[0_14px_38px_rgba(17,37,68,0.09)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/28 hover:shadow-[0_24px_60px_rgba(17,37,68,0.16)] dark:border-border dark:shadow-[var(--shadow-md)] dark:hover:border-primary/40 dark:hover:shadow-[var(--shadow-neon-blue)]">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-primary/40 to-transparent dark:via-[#8bdcff]/50" />
      <Link className="relative block" href={`/products/${product.slug}`}>
        <LocalizedProductVisual alt={product.name} product={product} tone={product.imageTone} />
        <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 sm:bottom-3 sm:right-3">
          <PromotionBadge
            className="group-hover:scale-105 group-hover:shadow-[0_16px_34px_rgba(239,68,68,0.45)]"
            percent={product.promotionPercent}
            size="lg"
          />
        </div>
      </Link>
      <div className={`flex flex-col gap-2 px-1 ${compact ? "py-2" : "py-3"}`}>
        {product.stockStatus !== "in_stock" ? (
          <div>
            <StockBadge status={product.stockStatus} />
          </div>
        ) : null}
        {hasOptions && !compact ? (
          <div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-primary dark:bg-[rgba(59,158,255,0.12)] dark:text-[#8bdcff]">
              <LocalizedValue
                fallback="Options Available"
                value={{
                  en: "Options Available",
                  ms: "Pilihan tersedia",
                  zh: "可选款式",
                }}
              />
            </span>
          </div>
        ) : null}
        <Link
          className={`line-clamp-2 text-foreground hover:text-primary ${compact ? "text-xs font-bold leading-snug" : "min-h-10 text-sm font-bold leading-snug"}`}
          href={`/products/${product.slug}`}
        >
          <LocalizedValue fallback={product.name} value={product.localizedName} />
        </Link>
        <PriceDisplay originalPrice={product.originalPrice} price={product.price} />
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-muted/55 px-2 py-1.5 dark:bg-[rgba(15,30,56,0.82)]">
          {hasReviewData ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="size-3 fill-warning text-warning" />
              <span className="font-semibold text-primary dark:text-[#ffd166]">{product.rating}</span>
              {!compact ? <span>({product.sold})</span> : null}
            </div>
          ) : (
            <span className="text-xs italic text-muted-foreground">
              {t("reviews.noReviewsYet", "No reviews yet")}
            </span>
          )}
          <AddToCartButton
            disabled={product.stockStatus === "out_of_stock"}
            productId={product.id}
            productName={product.name}
          />
        </div>
      </div>
    </article>
  );
}
