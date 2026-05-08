"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ShoppingCart } from "lucide-react";
import type { UrbanixProduct } from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";

export function ProductPurchasePanel({ product }: { product: UrbanixProduct }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();
  const isOutOfStock = product.stockStatus === "out_of_stock";

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
      <a
        className={buttonVariants({
          className: "w-full bg-success text-white hover:bg-success/90",
          size: "lg",
        })}
        href={`https://wa.me/?text=${encodeURIComponent(`Hi Urbanix Store, I have a question about ${product.name}.`)}`}
      >
        <MessageCircle />
        WhatsApp Enquiry
      </a>
    </div>
  );
}
