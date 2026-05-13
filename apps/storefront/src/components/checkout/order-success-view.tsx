"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, MapPin } from "lucide-react";
import type { UrbanixOrder } from "@ecommerce/shared";
import { EmptyState } from "@/components/commerce/empty-state";
import { OrderSummaryCard } from "@/components/commerce/order-summary-card";
import { buttonVariants } from "@/components/ui/button";
import { getLatestOrder } from "@/lib/order-storage";

export function OrderSuccessView() {
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

  return (
    <main className="urbanix-container urbanix-section flex justify-center pb-24">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        {/* Header */}
        <div className="bg-primary p-8 text-center text-white">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white text-success">
            <Check className="size-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Order Placed!</h1>
          <p className="mt-2 text-sm text-white/80">Thank you. Your order has been received.</p>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Order Number */}
          <div className="rounded-2xl bg-cream p-4 text-center">
            <div className="text-xs font-bold text-muted-foreground">Order Number</div>
            <div className="mt-1 text-xl font-extrabold text-primary">{order.orderNumber}</div>
          </div>

          {/* Payment notice */}
          <div className="rounded-2xl border border-warning/30 bg-amber-50 p-4 text-center">
            <div className="font-extrabold text-primary">Payment Pending Verification</div>
            <p className="mt-1 text-xs text-muted-foreground">
              We will verify your bank transfer and update your order status shortly.
            </p>
          </div>

          <OrderSummaryCard lines={order.items} showItems totals={order.totals} />

          {/* Track Order CTA */}
          <Link
            className={buttonVariants({
              className: "w-full gap-2",
              variant: "secondary",
              size: "lg",
            })}
            href={`/track-order?order_number=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(order.customer.phone)}`}
          >
            <MapPin className="size-4" />
            Track My Order
          </Link>

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
