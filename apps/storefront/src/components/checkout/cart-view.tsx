"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  calculateOrderTotals,
  type StoreSettings,
  type UrbanixProduct,
} from "@ecommerce/shared";
import { buildCartLines } from "@/lib/cart-utils";
import { useCart } from "@/components/cart/cart-provider";
import { CartItemCard } from "@/components/commerce/cart-item-card";
import { EmptyState } from "@/components/commerce/empty-state";
import { FreeShippingProgress } from "@/components/commerce/free-shipping-progress";
import { OrderSummaryCard } from "@/components/commerce/order-summary-card";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { useLanguage } from "@/components/i18n/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { freeShippingCopy } from "@/lib/shipping-text";

export function CartView({
  products,
  settings,
}: {
  products: UrbanixProduct[];
  settings: StoreSettings;
}) {
  const { t } = useLanguage();
  const { count, items } = useCart();
  const lines = buildCartLines(items, products);
  const totals = calculateOrderTotals(lines, settings);
  const shippingText = freeShippingCopy(settings);

  if (lines.length === 0) {
    return (
      <main className="urbanix-container urbanix-section pb-24">
        <EmptyState
          actionHref="/products"
          actionLabel={t("cart.backToShop", "Back to Shop")}
          title={t("cart.empty", "Your cart is empty")}
        />
      </main>
    );
  }

  return (
    <main className="urbanix-container urbanix-section pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">{t("cart.title", "Your Cart")} ({count})</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("cart.subtitle", "Review your items and proceed to checkout.")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-4">
          {lines.map((line) => (
            <CartItemCard key={line.cartKey ?? line.product.id} line={line} />
          ))}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-accent/20 bg-cream p-4 text-sm font-bold text-primary">
            <LocalizedValue fallback={shippingText.en} value={shippingText} />
          </div>
          {/* Cart has no state yet — progress bar prompts customer to pick one
              at checkout, which is when the free-shipping threshold becomes
              region-aware (West vs East). */}
          <FreeShippingProgress settings={settings} subtotal={totals.subtotal} />
          <OrderSummaryCard lines={lines} totals={totals} />
          <Link
            className={buttonVariants({
              className: "w-full",
              size: "lg",
              variant: "secondary",
            })}
            href="/checkout"
          >
            {t("cart.proceedToCheckout", "Proceed to Checkout")}
          </Link>
          <Link
            className={buttonVariants({ className: "w-full", variant: "outline" })}
            href="/products"
          >
            {t("cart.continueShopping", "Continue Shopping")}
          </Link>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="size-4" />
            {t("checkout.safeSecure", "100% Safe & Secure")}
          </div>
        </aside>
      </div>
    </main>
  );
}
