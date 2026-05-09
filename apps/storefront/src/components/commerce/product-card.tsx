import Link from "next/link";
import { Star } from "lucide-react";
import type { StoreSettings, UrbanixProduct } from "@ecommerce/shared";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductVisual } from "@/components/commerce/product-visual";
import { PriceDisplay } from "@/components/commerce/price-display";
import { ProductWhatsAppButton } from "@/components/commerce/product-whatsapp-button";
import { PromotionBadge } from "@/components/commerce/promotion-badge";
import { StockBadge } from "@/components/commerce/stock-badge";
import { LocalizedValue } from "@/components/i18n/localized-value";

type ProductCardProps = {
  product: UrbanixProduct;
  settings: Pick<StoreSettings, "storeName" | "whatsappNumber">;
};

export function ProductCard({ product, settings }: ProductCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-2 shadow-[0_12px_32px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
      <div className="absolute left-3 top-3 z-10">
        <PromotionBadge percent={product.promotionPercent} />
      </div>
      <Link href={`/products/${product.slug}`}>
        <ProductVisual alt={product.name} imageUrl={product.image || product.mainImageUrl || product.galleryImages?.[0]} tone={product.imageTone} />
      </Link>
      <div className="flex flex-col gap-2 px-1 py-3">
        {product.stockStatus !== "in_stock" ? (
          <div>
            <StockBadge status={product.stockStatus} />
          </div>
        ) : null}
        <Link
          className="line-clamp-2 min-h-10 text-sm font-bold leading-snug text-foreground hover:text-primary"
          href={`/products/${product.slug}`}
        >
          <LocalizedValue fallback={product.name} value={product.localizedName} />
        </Link>
        <PriceDisplay originalPrice={product.originalPrice} price={product.price} />
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-warning text-warning" />
            <span className="font-semibold text-accent">{product.rating}</span>
            <span>({product.sold})</span>
          </div>
          <AddToCartButton
            disabled={product.stockStatus === "out_of_stock"}
            productId={product.id}
            productName={product.name}
          />
        </div>
        <ProductWhatsAppButton
          className="min-h-9 w-full px-2 text-[0.72rem]"
          product={product}
          settings={settings}
        />
      </div>
    </article>
  );
}
