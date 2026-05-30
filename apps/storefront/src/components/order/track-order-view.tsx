"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Package, Search, Truck } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type OrderItem = {
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedVariants?: Record<string, string> | null;
};

type TrackedOrder = {
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  paymentStatus: string;
  trackingNumber: string | null;
  courier: string | null;
  hasReceipt: boolean;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  items: OrderItem[];
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Pending Verification",
  unpaid: "Unpaid",
  paid: "Payment Confirmed",
  failed: "Payment Failed",
  refunded: "Refunded",
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  unpaid: "bg-gray-100 text-gray-700",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

function formatRM(amount: number) {
  return `RM${Number(amount ?? 0).toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-MY", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TrackOrderView({
  initialOrderNumber = "",
  initialPhone = "",
}: {
  initialOrderNumber?: string;
  initialPhone?: string;
}) {
  const { t } = useLanguage();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-search when arriving from the order success page with params pre-filled
  useEffect(() => {
    if (initialOrderNumber || initialPhone) {
      doSearch(initialOrderNumber, initialPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doSearch(orderNum: string, ph: string) {
    if (!orderNum.trim() || !ph.trim()) {
      setError(t("track.bothFieldsHint", "Please enter your order number and phone number."));
      return;
    }

    setLoading(true);
    setError(null);
    setOrders(null);

    try {
      const params = new URLSearchParams();
      if (orderNum.trim()) params.set("order_number", orderNum.trim().toUpperCase());
      if (ph.trim()) params.set("phone", ph.trim().replace(/\D/g, ""));

      const res = await fetch(`/api/orders/track?${params}`);
      const data = await res.json() as { order?: TrackedOrder; error?: string };

      if (!res.ok || !data.order) {
        setError(data.error ?? t("track.notFound", "Order not found. Please check your order number and phone number."));
      } else {
        setOrders([data.order]);
      }
    } catch {
      setError(t("track.networkError", "Network error. Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    doSearch(orderNumber, phone);
  }

  return (
    <main className="pb-20 md:pb-0">
      {/* Hero */}
      <section className="border-b border-primary/10 bg-gradient-to-br from-[#eaf3ff] via-white to-[#fff4e7]">
        <div className="urbanix-container py-8 sm:py-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Urbanix Store</p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary sm:text-4xl">{t("track.title", "Track Your Order")}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {t("track.subtitle", "Enter your order number and phone number to check your order status and shipment details.")}
          </p>
        </div>
      </section>

      <section className="urbanix-container py-8 sm:py-12">
        <div className="mx-auto max-w-xl">
          {/* Search form */}
          <Card className="mb-8 border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-5" />
                {t("track.findYourOrder", "Find Your Order")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">
                    {t("track.orderNumberLabel", "Order Number")}
                  </label>
                  <Input
                    placeholder="e.g. URX-20260513-12345"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-muted-foreground">
                    {t("track.phoneLabel", "Phone Number")}
                  </label>
                  <Input
                    placeholder="e.g. 0123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("track.bothRequired", "Both fields are required. The order number can be found in your order confirmation.")}
                </p>
                <Button type="submit" variant="secondary" disabled={loading} className="w-full mt-1">
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t("track.searching", "Searching…")}
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      {t("track.trackOrder", "Track Order")}
                    </>
                  )}
                </Button>
              </form>

              {error && (
                <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-semibold text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {orders && orders.map((order) => (
            <OrderCard key={order.orderNumber} order={order} />
          ))}
        </div>
      </section>
    </main>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  return (
    <div className="mb-6 overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-sm">
      {/* Header */}
      <div className="bg-primary px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-white/70">Order Number</p>
            <p className="font-extrabold text-lg">{order.orderNumber}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLORS[order.orderStatus] ?? "bg-gray-100 text-gray-700"}`}>
            {STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* Date */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <InfoRow label="Order Date" value={formatDate(order.createdAt)} />
        </div>

        {/* Payment status */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 px-4 py-3">
          <span className="text-sm font-semibold">Payment Status</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${PAYMENT_COLORS[order.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}>
            {PAYMENT_LABELS[order.paymentStatus] ?? order.paymentStatus}
          </span>
        </div>

        {/* Receipt indicator */}
        {order.hasReceipt && (
          <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <span className="text-base">✓</span>
            <span className="font-semibold">Payment receipt uploaded</span>
          </div>
        )}

        {/* Tracking info */}
        {(order.trackingNumber || order.courier) && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="mb-2 flex items-center gap-2 font-bold text-indigo-900">
              <Truck className="size-4" />
              Shipping Information
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {order.courier && (
                <InfoRow label="Courier" value={order.courier} />
              )}
              {order.trackingNumber && (
                <InfoRow label="Tracking No." value={order.trackingNumber} />
              )}
            </div>
            {order.trackingNumber && (
              <p className="mt-2 text-xs text-muted-foreground">
                Use the tracking number above to check shipping status on your courier&apos;s website.
              </p>
            )}
          </div>
        )}

        {/* Order items */}
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
            <Package className="size-4" />
            Order Items
          </h3>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{item.productName}</p>
                  <p className="text-xs font-mono text-muted-foreground">{item.productSku}</p>
                  {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                  <p className="font-bold text-primary">{formatRM(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-2xl bg-secondary/40 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatRM(order.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-semibold">{formatRM(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between border-t border-border py-1 pt-2">
            <span className="font-extrabold">Total</span>
            <span className="font-extrabold text-primary">{formatRM(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
