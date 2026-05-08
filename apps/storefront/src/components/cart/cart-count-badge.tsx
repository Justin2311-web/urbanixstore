"use client";

import { useCart } from "@/components/cart/cart-provider";

export function CartCountBadge() {
  const { count } = useCart();

  if (count === 0) {
    return null;
  }

  return (
    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-accent text-[0.65rem] font-bold text-white">
      {count}
    </span>
  );
}
