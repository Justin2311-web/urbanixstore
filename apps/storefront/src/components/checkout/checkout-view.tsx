"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, MessageCircle, ShieldCheck } from "lucide-react";
import type { CheckoutCustomer, PaymentMethod, PaymentSettings, StoreSettings, UrbanixOrder, UrbanixProduct } from "@ecommerce/shared";
import {
  calculateOrderTotals,
  createWhatsAppOrderMessage,
  getCartLines,
} from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { EmptyState } from "@/components/commerce/empty-state";
import { OrderSummaryCard } from "@/components/commerce/order-summary-card";
import { WhatsAppCta } from "@/components/commerce/whatsapp-cta";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createOrderNumber, saveOrder } from "@/lib/order-storage";
import { createWhatsAppHref, getWhatsAppNumber } from "@/lib/order-links";

const initialCustomer: CheckoutCustomer = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: "Malaysia",
  deliveryNote: "",
  email: "",
  fullName: "",
  phone: "",
  postcode: "",
  state: "",
};

export function CheckoutView({
  payments,
  products,
  settings,
}: {
  payments: PaymentSettings;
  products: UrbanixProduct[];
  settings: StoreSettings;
}) {
  const router = useRouter();
  const { clearCart, items } = useCart();
  const [customer, setCustomer] = useState(initialCustomer);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    payments.manualPaymentEnabled ? "manual" : "whatsapp"
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lines = getCartLines(items, products);
  const totals = calculateOrderTotals(lines, settings);

  const previewOrder = useMemo<UrbanixOrder>(
    () => ({
      createdAt: new Date().toISOString(),
      customer,
      id: "preview",
      items: lines,
      orderNumber: "URX-PREVIEW",
      orderStatus: "pending",
      paymentMethod,
      paymentStatus: paymentMethod === "manual" ? "pending" : "unpaid",
      totals,
    }),
    [customer, lines, paymentMethod, totals]
  );

  const whatsappHref = createWhatsAppHref(getWhatsAppNumber(settings), createWhatsAppOrderMessage(previewOrder));

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

  function updateField(field: keyof CheckoutCustomer, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!customer.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!customer.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!customer.email.trim()) nextErrors.email = "Email is required.";
    if (customer.email && !customer.email.includes("@")) nextErrors.email = "Enter a valid email.";
    if (!customer.addressLine1.trim()) nextErrors.addressLine1 = "Address line 1 is required.";
    if (!customer.city.trim()) nextErrors.city = "City is required.";
    if (!customer.state.trim()) nextErrors.state = "State is required.";
    if (!customer.postcode.trim()) nextErrors.postcode = "Postcode is required.";
    if (!customer.country.trim()) nextErrors.country = "Country is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const order: UrbanixOrder = {
      createdAt: new Date().toISOString(),
      customer,
      id: crypto.randomUUID(),
      items: lines,
      orderNumber: createOrderNumber(),
      orderStatus: "pending",
      paymentMethod,
      paymentStatus: paymentMethod === "manual" ? "pending" : "unpaid",
      totals,
    };

    saveOrder(order);
    clearCart();
    router.push("/checkout/success");
  }

  return (
    <main className="urbanix-container urbanix-section pb-24">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill in your details to place the order.
        </p>
      </div>

      <form className="grid gap-6 lg:grid-cols-[1fr_380px]" onSubmit={handleSubmit}>
        <section className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <FieldError error={errors.fullName}>
                <Input
                  aria-invalid={Boolean(errors.fullName)}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Full name"
                  value={customer.fullName}
                />
              </FieldError>
              <FieldError error={errors.phone}>
                <Input
                  aria-invalid={Boolean(errors.phone)}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="Phone number"
                  value={customer.phone}
                />
              </FieldError>
              <FieldError error={errors.email}>
                <Input
                  aria-invalid={Boolean(errors.email)}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Email address"
                  type="email"
                  value={customer.email}
                />
              </FieldError>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <FieldError className="sm:col-span-2" error={errors.addressLine1}>
                <Input
                  aria-invalid={Boolean(errors.addressLine1)}
                  onChange={(event) => updateField("addressLine1", event.target.value)}
                  placeholder="Address line 1"
                  value={customer.addressLine1}
                />
              </FieldError>
              <Input
                className="sm:col-span-2"
                onChange={(event) => updateField("addressLine2", event.target.value)}
                placeholder="Address line 2"
                value={customer.addressLine2}
              />
              <FieldError error={errors.city}>
                <Input
                  aria-invalid={Boolean(errors.city)}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="City"
                  value={customer.city}
                />
              </FieldError>
              <FieldError error={errors.state}>
                <Input
                  aria-invalid={Boolean(errors.state)}
                  onChange={(event) => updateField("state", event.target.value)}
                  placeholder="State / Province"
                  value={customer.state}
                />
              </FieldError>
              <FieldError error={errors.postcode}>
                <Input
                  aria-invalid={Boolean(errors.postcode)}
                  onChange={(event) => updateField("postcode", event.target.value)}
                  placeholder="Postcode"
                  value={customer.postcode}
                />
              </FieldError>
              <FieldError error={errors.country}>
                <Input
                  aria-invalid={Boolean(errors.country)}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Country"
                  value={customer.country}
                />
              </FieldError>
              <Input
                className="sm:col-span-2"
                onChange={(event) => updateField("deliveryNote", event.target.value)}
                placeholder="Delivery note, e.g. leave at the front door"
                value={customer.deliveryNote}
              />
            </CardContent>
          </Card>
        </section>

        <aside className="flex flex-col gap-4">
          <OrderSummaryCard lines={lines} showItems totals={totals} />
          <div className="rounded-2xl border border-accent/20 bg-cream p-4 text-sm font-bold text-primary">
            <LocalizedValue fallback="Free shipping for orders above RM40" value={settings.freeShippingText} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {payments.manualPaymentEnabled ? (
                <PaymentOption
                  description={payments.paymentInstruction}
                  icon={Landmark}
                  label="Manual Payment / Bank Transfer"
                  onClick={() => setPaymentMethod("manual")}
                  selected={paymentMethod === "manual"}
                />
              ) : null}
              {paymentMethod === "manual" && payments.manualPaymentEnabled ? <ManualPaymentNotice payments={payments} /> : null}
              {payments.whatsAppOrderEnabled ? (
                <PaymentOption
                  description="Place your order directly through WhatsApp."
                  icon={MessageCircle}
                  label="WhatsApp Order"
                  onClick={() => setPaymentMethod("whatsapp")}
                  selected={paymentMethod === "whatsapp"}
                />
              ) : null}
              {paymentMethod === "whatsapp" ? (
                <a
                  className="rounded-2xl border border-success/20 bg-success/10 p-3 text-sm font-bold text-success"
                  href={whatsappHref}
                  target="_blank"
                >
                  Preview WhatsApp message
                </a>
              ) : null}
              <Button className="w-full" size="lg" type="submit" variant="secondary">
                Place Order
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary">
                <ShieldCheck className="size-4" />
                100% Safe & Secure
              </div>
            </CardContent>
          </Card>

          <WhatsAppCta message={createWhatsAppOrderMessage(previewOrder)} whatsappNumber={settings.whatsappNumber} />
        </aside>
      </form>
    </main>
  );
}

function FieldError({
  children,
  className,
  error,
}: {
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
      {error ? <p className="mt-1 text-xs font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}

function PaymentOption({
  description,
  icon: Icon,
  label,
  onClick,
  selected,
}: {
  icon: typeof Landmark;
  label: string;
  description: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center justify-between rounded-2xl border border-primary/20 bg-secondary/50 p-3 text-left"
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-3">
        <Icon className="size-6 text-primary" />
        <span>
          <span className="block text-sm font-bold">{label}</span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </span>
      </div>
      <span className={selected ? "size-4 rounded-full border-4 border-primary" : "size-4 rounded-full border"} />
    </button>
  );
}

function ManualPaymentNotice({ payments }: { payments: PaymentSettings }) {
  return (
    <div className="rounded-2xl border border-warning/20 bg-cream p-4 text-sm">
      <div className="font-extrabold text-primary">Bank Transfer Instruction</div>
      <div className="mt-3 grid grid-cols-[120px_1fr] gap-2 text-xs">
        <span className="text-muted-foreground">Bank Name</span>
        <span className="font-bold">{payments.bankName}</span>
        <span className="text-muted-foreground">Account Name</span>
        <span className="font-bold">{payments.accountName}</span>
        <span className="text-muted-foreground">Account No.</span>
        <span className="font-bold">{payments.accountNumber}</span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {payments.paymentInstruction}
      </p>
    </div>
  );
}
