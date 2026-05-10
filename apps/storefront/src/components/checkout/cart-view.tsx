"use client";

import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";
import {
  calculateOrderTotals,
  getCartLines,
  type StoreSettings,
  type UrbanixProduct,
} from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { CartItemCard } from "@/components/commerce/cart-item-card";
import { EmptyState } from "@/components/commerce/empty-state";
import { OrderSummaryCard } from "@/components/commerce/order-summary-card";
import { useLanguage } from "@/components/i18n/language-provider";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { buttonVariants } from "@/components/ui/button";
import {
  createCartWhatsAppMessage,
  createWhatsAppHref,
  getWhatsAppNumber,
} from "@/lib/order-links";

export function CartView({
  products,
  settings,
}: {
  products: UrbanixProduct[];
  settings: StoreSettings;
}) {
  const { count, items } = useCart();
  const { language } = useLanguage();
  const lines = getCartLines(items, products);
  const totals = calculateOrderTotals(lines, settings);
  const whatsappHref = createWhatsAppHref(
    getWhatsAppNumber(settings),
    createCartWhatsAppMessage({ language, lines, settings })
  );

  if (lines.length === 0) {
    return (
      <main className="urbanix-container urbanix-section pb-24">
        <EmptyState
          actionHref="/products"
          actionLabel="Back to Shop"
          title="Your cart is empty"
        />
      </main>
    );
  }

  return (
    <main className="urbanix-container urbanix-section pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Your Cart ({count})</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review your items and proceed to checkout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-4">
          {lines.map((line) => (
            <CartItemCard key={line.product.id} line={line} />
          ))}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-accent/20 bg-cream p-4 text-sm font-bold text-primary">
            <LocalizedValue fallback="Free shipping for orders above RM40" value={settings.freeShippingText} />
          </div>
          <OrderSummaryCard lines={lines} totals={totals} />
          <a
            className={buttonVariants({
              className: "w-full bg-success text-white hover:bg-success/90",
              size: "lg",
            })}
            href={whatsappHref}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle />
            Order via WhatsApp
          </a>
          <Link
            className={buttonVariants({
              className: "w-full",
              size: "lg",
              variant: "secondary",
            })}
            href="/checkout"
          >
            Proceed to Checkout
          </Link>
          <Link
            className={buttonVariants({ className: "w-full", variant: "outline" })}
            href="/products"
          >
            Continue Shopping
          </Link>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary">
            <ShieldCheck className="size-4" />
            100% Safe & Secure
          </div>
        </aside>
      </div>
    </main>
  );
}
