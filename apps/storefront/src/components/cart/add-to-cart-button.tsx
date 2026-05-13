"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  children,
  className,
  disabled = false,
  productId,
  productName,
  quantity = 1,
}: {
  productId: string;
  productName: string;
  disabled?: boolean;
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const { addItem } = useCart();

  return (
    <Button
      aria-label={`Add ${productName} to cart`}
      className={className}
      disabled={disabled}
      onClick={() => addItem(productId, quantity)}
      size={children ? "default" : "icon-xs"}
      type="button"
      variant="outline"
    >
      {children || <ShoppingCart />}
    </Button>
  );
}

