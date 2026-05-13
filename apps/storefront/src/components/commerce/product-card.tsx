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
  const hasOptions = (product.variantGroups?.length ?? 0) > 0;

  return (
    <article className="urbanix-lifestyle-card group">
      <div className="absolute left-4 top-4 z-10">
        <PromotionBadge percent={product.promotionPercent} />
      </div>
      <Link className="block overflow-hidden rounded-[1.8rem]" href={`/products/${product.slug}`}>
        <div className="transition-transform duration-700 ease-out group-hover:scale-110">
          <ProductVisual alt={product.name} imageUrl={product.image || product.mainImageUrl || product.galleryImages?.[0]} tone={product.imageTone} />
        </div>
      </Link>
      <div className="flex flex-col gap-3 px-1 py-4">
        {product.stockStatus !== "in_stock" ? (
          <div>
            <StockBadge status={product.stockStatus} />
          </div>
        ) : null}
        <Link
          className="line-clamp-2 min-h-[3rem] text-sm font-extrabold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary"
          href={`/products/${product.slug}`}
        >
          <LocalizedValue fallback={product.name} value={product.localizedName} />
        </Link>
        <div className="flex items-center justify-between">
          <PriceDisplay originalPrice={product.originalPrice} price={product.price} />
          <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-[10px] font-bold text-muted-foreground">
            <Star className="size-3 fill-muted-foreground/30 text-muted-foreground/30" />
            <span>{product.rating}</span>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <AddToCartButton
            className="h-11 grow rounded-full font-bold uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
            disabled={product.stockStatus === "out_of_stock"}
            productId={product.id}
            productName={product.name}
          >
            Add to Cart
          </AddToCartButton>
        </div>
        <ProductWhatsAppButton
          className="h-10 w-full rounded-full border border-border bg-transparent text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-secondary/50 hover:text-foreground"
          product={product}
          settings={settings}
        />
      </div>
    </article>
  );
}

