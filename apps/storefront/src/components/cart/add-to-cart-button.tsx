"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  disabled = false,
  productId,
  productName,
  quantity = 1,
}: {
  productId: string;
  productName: string;
  disabled?: boolean;
  quantity?: number;
}) {
  const { addItem } = useCart();

  return (
    <Button
      aria-label={`Add ${productName} to cart`}
      disabled={disabled}
      onClick={() => addItem(productId, quantity)}
      size="icon-xs"
      type="button"
      variant="outline"
    >
      <ShoppingCart />
    </Button>
  );
}
