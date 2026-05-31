"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ClipboardList, MapPin, PackageCheck, Search, ShieldCheck } from "lucide-react";
import type { UrbanixOrder } from "@ecommerce/shared";
import { OrderSummaryCard } from "@/components/commerce/order-summary-card";
import { useLanguage } from "@/components/i18n/language-provider";
import { buttonVariants } from "@/components/ui/button";
import { getLatestOrder } from "@/lib/order-storage";

export function OrderSuccessView() {
  const { t } = useLanguage();
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
      <main className="urbanix-container urbanix-section flex justify-center pb-24">
        <div className="w-full max-w-md rounded-3xl border border-primary/10 bg-card p-6 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Search className="size-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-primary">{t("success.noOrder", "No recent order found")}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {t("success.noOrderHint", "If you already placed an order, use your order number and phone number to check the latest status.")}
          </p>
          <Link
            className={buttonVariants({ className: "mt-5 w-full", variant: "secondary" })}
            href="/track-order"
          >
            {t("success.goToTrackOrder", "Go to Track Order")}
          </Link>
          <Link
            className={buttonVariants({ className: "mt-5 w-full", variant: "outline" })}
            href="/products"
          >
            {t("success.continueShopping", "Continue Shopping")}
          </Link>
        </div>
      </main>
    );
  }

  const trackHref = `/track-order?order_number=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(order.customer.phone)}`;
  const nextSteps = [
    {
      icon: ShieldCheck,
      text: t("success.nextStepVerify", "We verify your payment receipt manually."),
    },
    {
      icon: PackageCheck,
      text: t("success.nextStepPack", "After verification, we pack and prepare your order for shipping."),
    },
    {
      icon: MapPin,
      text: t("success.nextStepTrack", "Use Track My Order anytime for the latest status."),
    },
  ];

  return (
    <main className="urbanix-container urbanix-section flex justify-center pb-24">
      <section className="w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        {/* Header */}
        <div className="bg-primary p-8 text-center text-white">
          <div className="mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-white text-success">
            <Check className="size-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">{t("success.orderPlaced", "Order Placed!")}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/80">{t("success.thankYou", "Thank you. Your order has been received and is waiting for payment verification.")}</p>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Order Number */}
          <div className="rounded-2xl bg-cream p-4 text-center">
            <div className="text-xs font-bold text-muted-foreground">{t("success.orderNumber", "Order Number")}</div>
            <div className="mt-1 text-xl font-extrabold text-primary">{order.orderNumber}</div>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              {t("success.saveOrderNumber", "Save this order number. You will need it to track your order.")}
            </p>
          </div>

          {/* Payment notice */}
          <div className="rounded-2xl border border-warning/30 bg-amber-50 p-4 text-center">
            <div className="font-extrabold text-primary">{t("success.paymentPending", "Payment Pending Verification")}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("success.paymentPendingNote", "We will verify your bank transfer and update your order status shortly.")}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/10 bg-secondary/30 p-4">
            <div className="mb-3 flex items-center gap-2 font-extrabold text-primary">
              <ClipboardList className="size-4" />
              {t("success.nextStepsTitle", "What happens next")}
            </div>
            <div className="flex flex-col gap-3">
              {nextSteps.map(({ icon: Icon, text }, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <p className="text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <OrderSummaryCard lines={order.items} showItems totals={order.totals} />

          {/* Track Order CTA */}
          <Link
            className={buttonVariants({
              className: "h-12 w-full gap-2 text-base font-extrabold",
              variant: "secondary",
              size: "lg",
            })}
            href={trackHref}
          >
            <MapPin className="size-4" />
            {t("success.trackMyOrder", "Track My Order")}
          </Link>
          <p className="-mt-2 text-center text-xs text-muted-foreground">
            {t("success.trackOrderHelp", "Your order number and phone number will be filled in automatically.")}
          </p>

          <Link
            className={buttonVariants({ className: "w-full", variant: "outline" })}
            href="/products"
          >
            {t("success.continueShopping", "Continue Shopping")}
          </Link>
        </div>
      </section>
    </main>
  );
}
