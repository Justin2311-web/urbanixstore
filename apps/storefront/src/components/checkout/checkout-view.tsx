"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, ShieldCheck, Upload, X } from "lucide-react";
import type { CheckoutCustomer, PaymentSettings, StoreSettings, UrbanixOrder, UrbanixProduct } from "@ecommerce/shared";
import { calculateOrderTotals } from "@ecommerce/shared";
import { buildCartLines } from "@/lib/cart-utils";
import { useCart } from "@/components/cart/cart-provider";
import { EmptyState } from "@/components/commerce/empty-state";
import { OrderSummaryCard } from "@/components/commerce/order-summary-card";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createOrderNumber, saveOrder } from "@/lib/order-storage";
import { loadCustomerProfile, profileToCheckoutCustomer, saveCustomerProfileLocally, syncCustomerProfile } from "@/lib/customer-profile";

const MAX_RECEIPT_MB = 10;
const MAX_RECEIPT_BYTES = MAX_RECEIPT_MB * 1024 * 1024;
const ACCEPTED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ACCEPTED_RECEIPT_EXTS = ".jpg,.jpeg,.png,.webp,.pdf";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lines = buildCartLines(items, products);
  const totals = calculateOrderTotals(lines, settings);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProfile = loadCustomerProfile();
      if (storedProfile) {
        setCustomer((current) => ({
          ...current,
          ...profileToCheckoutCustomer(storedProfile),
        }));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
    if (customer.email && !customer.email.includes("@")) nextErrors.email = "Enter a valid email.";
    if (!customer.addressLine1.trim()) nextErrors.addressLine1 = "Address line 1 is required.";
    if (!customer.city.trim()) nextErrors.city = "City is required.";
    if (!customer.state.trim()) nextErrors.state = "State is required.";
    if (!customer.postcode.trim()) nextErrors.postcode = "Postcode is required.";
    if (!customer.country.trim()) nextErrors.country = "Country is required.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  // ── Receipt upload ───────────────────────────────────────────────────────────

  function handleReceiptSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_RECEIPT_TYPES.includes(file.type)) {
      setReceiptError("Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setReceiptError(
        `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed is ${MAX_RECEIPT_MB} MB.`
      );
      e.target.value = "";
      return;
    }

    setReceiptError(null);
    setReceiptFile(file);
    setReceiptUrl(null);

    // Show image preview (not for PDFs)
    if (file.type !== "application/pdf") {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  }

  function clearReceipt() {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptUrl(null);
    setReceiptError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadReceiptToSupabase(file: File, orderNumber: string): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `receipts/${orderNumber}/${Date.now()}.${ext}`;

    // Get signed upload URL from our API route
    const res = await fetch("/api/signed-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket: "uploads", filePath }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(errData.error ?? "Could not prepare upload.");
    }

    const { signedUrl, publicUrl } = await res.json() as { signedUrl: string; publicUrl: string };

    // Upload directly to Supabase Storage (bypasses Vercel body limit)
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      throw new Error(`Receipt upload failed: ${uploadRes.statusText}`);
    }

    return publicUrl;
  }

  // ── Form submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const orderNumber = createOrderNumber();

      // 1. Upload receipt if one was selected
      let finalReceiptUrl: string | null = null;
      if (receiptFile) {
        setReceiptUploading(true);
        try {
          finalReceiptUrl = await uploadReceiptToSupabase(receiptFile, orderNumber);
          setReceiptUrl(finalReceiptUrl);
        } catch (uploadErr) {
          setReceiptError(
            uploadErr instanceof Error ? uploadErr.message : "Receipt upload failed."
          );
          setSubmitting(false);
          setReceiptUploading(false);
          return;
        }
        setReceiptUploading(false);
      }

      // 2. Save order to Supabase via API route
      const orderPayload = {
        orderNumber,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        customerEmail: customer.email || undefined,
        deliveryNote: customer.deliveryNote || undefined,
        shippingAddress: {
          addressLine1: customer.addressLine1,
          addressLine2: customer.addressLine2,
          city: customer.city,
          state: customer.state,
          postcode: customer.postcode,
          country: customer.country,
        },
        subtotal: totals.subtotal,
        shippingFee: totals.shipping,
        discountAmount: totals.discount,
        totalAmount: totals.total,
        paymentMethod: "manual" as const,
        receiptUrl: finalReceiptUrl ?? undefined,
        items: lines.map((line) => ({
          productId: line.product.id,
          productName: line.product.name,
          productSku: line.product.sku,
          quantity: line.quantity,
          unitPrice: line.product.price,
          totalPrice: line.lineTotal,
          selectedVariants: line.selectedVariants ?? null,
        })),
      };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json() as { ok?: boolean; orderId?: string; orderNumber?: string; error?: string };

      if (!orderRes.ok) {
        throw new Error(orderData.error ?? "Failed to place order. Please try again.");
      }

      // 3. Save to localStorage for success page / order history
      const order: UrbanixOrder = {
        createdAt: new Date().toISOString(),
        customer,
        id: orderData.orderId ?? crypto.randomUUID(),
        items: lines,
        orderNumber: orderData.orderNumber ?? orderNumber,
        orderStatus: "pending",
        paymentMethod: "manual",
        paymentStatus: "pending",
        totals,
      };

      // Sync customer profile in background
      const savedProfile = saveCustomerProfileLocally({
        createdAt: "",
        customerAddress: [
          customer.addressLine1,
          customer.addressLine2,
          customer.postcode,
          customer.city,
          customer.state,
          customer.country,
        ].filter(Boolean).join(", "),
        customerEmail: customer.email,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        updatedAt: "",
        userId: "",
      });
      void syncCustomerProfile({
        ...savedProfile,
        lastOrderDate: order.createdAt,
        lastOrderProduct: lines.map((line) => line.product.name).join(", "),
      }).catch((error) => {
        console.error("[Urbanix] Unable to sync customer profile.", error);
      });

      saveOrder(order);
      clearCart();
      router.push("/checkout/success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
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
          {/* Contact Information */}
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
                  placeholder="Email address (optional)"
                  type="email"
                  value={customer.email}
                />
              </FieldError>
            </CardContent>
          </Card>

          {/* Shipping Address */}
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

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
                <Landmark className="size-6 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">
                    {payments.paymentInstruction || "Transfer to our bank account then upload your receipt below."}
                  </p>
                </div>
                <span className="ml-auto size-4 rounded-full border-4 border-primary" />
              </div>

              {payments.manualPaymentEnabled && (
                <div className="rounded-2xl border border-warning/30 bg-amber-50 p-4 text-sm">
                  <div className="font-extrabold text-primary">Bank Transfer Details</div>
                  <div className="mt-3 grid grid-cols-[110px_1fr] gap-2 text-xs">
                    <span className="text-muted-foreground">Bank Name</span>
                    <span className="font-bold">{payments.bankName}</span>
                    <span className="text-muted-foreground">Account Name</span>
                    <span className="font-bold">{payments.accountName}</span>
                    <span className="text-muted-foreground">Account No.</span>
                    <span className="font-bold">{payments.accountNumber}</span>
                  </div>
                  {payments.paymentInstruction && (
                    <p className="mt-3 text-xs text-muted-foreground">{payments.paymentInstruction}</p>
                  )}
                </div>
              )}

              {/* Receipt Upload */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                <p className="mb-3 text-sm font-bold">
                  Upload Payment Receipt <span className="font-normal text-muted-foreground">(recommended)</span>
                </p>

                {receiptFile ? (
                  <div className="space-y-2">
                    {receiptPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="h-32 w-full rounded-xl object-contain border border-border bg-white"
                      />
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-3">
                        <Upload className="size-4 text-primary" />
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {receiptFile.name}
                        </span>
                      </div>
                    )}
                    {receiptUrl ? (
                      <p className="flex items-center gap-1 text-xs font-semibold text-green-700">
                        ✓ Receipt uploaded successfully
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {(receiptFile.size / 1024 / 1024).toFixed(1)} MB · {receiptFile.name.split(".").pop()?.toUpperCase()}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={clearReceipt}
                      className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
                    >
                      <X className="size-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-white p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload className="size-6 text-muted-foreground" />
                    <span className="text-xs font-semibold text-primary">Choose file</span>
                    <span className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF · Max {MAX_RECEIPT_MB} MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_RECEIPT_EXTS}
                      className="sr-only"
                      onChange={handleReceiptSelect}
                    />
                  </label>
                )}

                {receiptError && (
                  <p className="mt-2 text-xs font-semibold text-destructive">⚠ {receiptError}</p>
                )}
              </div>

              {/* Submit error */}
              {submitError && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
                  ⚠ {submitError}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                type="submit"
                variant="secondary"
                disabled={submitting}
              >
                {submitting
                  ? receiptUploading
                    ? "Uploading receipt…"
                    : "Placing order…"
                  : "Place Order"}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary">
                <ShieldCheck className="size-4" />
                100% Safe & Secure
              </div>
            </CardContent>
          </Card>
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
