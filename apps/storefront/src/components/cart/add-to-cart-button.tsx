"use client";

import { ShoppingCart } from "lucide-react";
import { ADD_TO_CART_EVENT } from "@/components/cart/add-to-cart-toast";
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
      onClick={() => {
        addItem(productId, quantity);
        // No variant validation here (list-page quick add), so any click
        // that reaches us is a successful add — safe to toast.
        window.dispatchEvent(new CustomEvent(ADD_TO_CART_EVENT));
      }}
      size={children ? "default" : "icon-xs"}
      type="button"
      variant="outline"
    >
      {children || <ShoppingCart />}
    </Button>
  );
}

