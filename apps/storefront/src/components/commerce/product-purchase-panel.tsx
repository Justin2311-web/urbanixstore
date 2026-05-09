"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import type { StoreSettings, UrbanixProduct } from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { ProductWhatsAppButton } from "@/components/commerce/product-whatsapp-button";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export function ProductPurchasePanel({
  product,
  settings,
}: {
  product: UrbanixProduct;
  settings: Pick<StoreSettings, "platformLinks" | "storeName" | "whatsappNumber">;
}) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();
  const isOutOfStock = product.stockStatus === "out_of_stock";
  const shopeeUrl = product.shopeeUrl || settings.platformLinks?.shopee || "";
  const lazadaUrl = product.lazadaUrl || settings.platformLinks?.lazada || "";

  const ctaText = useMemo(
    () => (isOutOfStock ? "Out of Stock" : "Add to Cart"),
    [isOutOfStock]
  );

  function handleAddToCart() {
    if (!isOutOfStock) {
      addItem(product.id, quantity);
    }
  }

  function handleBuyNow() {
    if (!isOutOfStock) {
      addItem(product.id, quantity);
      router.push("/checkout");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <QuantitySelector
          disabled={isOutOfStock}
          onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
          onIncrease={() => setQuantity((current) => current + 1)}
          value={quantity}
        />
        <Button
          className="w-full"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          size="lg"
          type="button"
          variant="secondary"
        >
          <ShoppingCart />
          {ctaText}
        </Button>
      </div>
      <Button
        className="w-full"
        disabled={isOutOfStock}
        onClick={handleBuyNow}
        size="lg"
        type="button"
      >
        Buy Now
      </Button>
      <ProductWhatsAppButton
        className="w-full"
        product={product}
        quantity={quantity}
        settings={settings}
        size="lg"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <MarketplaceButton
          href={shopeeUrl}
          icon="shopee"
          label={shopeeUrl ? "Buy on Shopee" : "Shopee Coming Soon"}
        />
        <MarketplaceButton
          href={lazadaUrl}
          icon="lazada"
          label={lazadaUrl ? "Buy on Lazada" : "Lazada Coming Soon"}
        />
      </div>
    </div>
  );
}

function MarketplaceButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "shopee" | "lazada";
  label: string;
}) {
  const Icon = icon === "shopee" ? ShoppingBag : Store;

  if (!href) {
    return (
      <Button className="w-full" disabled size="lg" type="button" variant="outline">
        <Icon />
        {label}
      </Button>
    );
  }

  return (
    <a
      className={buttonVariants({ className: "w-full", size: "lg", variant: "outline" })}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <Icon />
      {label}
      <ExternalLink />
    </a>
  );
}
