"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, MessageCircle } from "lucide-react";
import type { UrbanixOrder } from "@ecommerce/shared";
import { createWhatsAppOrderMessage } from "@ecommerce/shared";
import { EmptyState } from "@/components/commerce/empty-state";
import { OrderSummaryCard } from "@/components/commerce/order-summary-card";
import { buttonVariants } from "@/components/ui/button";
import { getLatestOrder } from "@/lib/order-storage";
import { createWhatsAppHref, getWhatsAppNumber } from "@/lib/order-links";

export function OrderSuccessView({ whatsappNumber }: { whatsappNumber: string }) {
  const [order, setOrder] = useState<UrbanixOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setOrder(getLatestOrder());
      setLoaded(true);
    });
  }, []);

  if (!loaded) {
    return (
      <main className="urbanix-container urbanix-section flex justify-center pb-24">
        <section className="h-[540px] w-full max-w-md rounded-3xl bg-card shadow-sm" />
      </main>
    );
  }

  if (!order) {
    return (
      <main className="urbanix-container urbanix-section pb-24">
        <EmptyState
          actionHref="/products"
          actionLabel="Continue Shopping"
          title="No recent order found"
        />
      </main>
    );
  }

  const whatsappHref = createWhatsAppHref(getWhatsAppNumber({ whatsappNumber }), createWhatsAppOrderMessage(order));

  return (
    <main className="urbanix-container urbanix-section flex justify-center pb-24">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <div className="bg-primary p-8 text-center text-white">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white text-success">
            <Check className="size-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Thank You!</h1>
          <p className="mt-2 text-sm text-white/80">Your order has been received.</p>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="rounded-2xl bg-cream p-4 text-center">
            <div className="text-xs font-bold text-muted-foreground">Order Number</div>
            <div className="mt-1 text-xl font-extrabold text-primary">
              {order.orderNumber}
            </div>
          </div>

          <div className="rounded-2xl border border-warning/20 bg-cream p-4 text-center">
            <div className="font-extrabold text-primary">Payment Pending</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Your order will be confirmed after we verify your payment.
            </p>
          </div>

          <OrderSummaryCard lines={order.items} showItems totals={order.totals} />

          <a
            className={buttonVariants({
              className: "w-full bg-success text-white hover:bg-success/90",
              size: "lg",
            })}
            href={whatsappHref}
            target="_blank"
          >
            <MessageCircle />
            Chat on WhatsApp
          </a>
          <Link
            className={buttonVariants({ className: "w-full", variant: "outline" })}
            href="/products"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
