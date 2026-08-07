"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ShieldCheck, Upload, X } from "lucide-react";
import type { CheckoutCustomer, PaymentSettings, QrPaymentMethod, StoreSettings, UrbanixOrder, UrbanixProduct } from "@ecommerce/shared";
import { calculateOrderTotals, formatCurrency, malaysiaStates } from "@ecommerce/shared";
import { getWhatsAppNumber } from "@/lib/order-links";
import { buildCartLines } from "@/lib/cart-utils";
import { useCart } from "@/components/cart/cart-provider";
import { EmptyState } from "@/components/commerce/empty-state";
import { FreeShippingProgress } from "@/components/commerce/free-shipping-progress";
import { OrderProcessInfo } from "@/components/checkout/order-process-info";
import { OrderSummaryCard } from "@/components/commerce/order-summary-card";
import { PromotionCodeCard } from "@/components/commerce/promotion-code-card";
import type { AppliedPromotion } from "@/lib/promotion-service";
import { ShippingFeeBreakdown } from "@/components/commerce/shipping-fee-breakdown";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createOrderNumber, saveOrder } from "@/lib/order-storage";
import { loadCustomerProfile, profileToCheckoutCustomer, saveCustomerProfileLocally, syncCustomerProfile } from "@/lib/customer-profile";
import { freeShippingCopy } from "@/lib/shipping-text";
import { useLanguage } from "@/components/i18n/language-provider";

const MAX_RECEIPT_MB = 5;
const MAX_RECEIPT_BYTES = MAX_RECEIPT_MB * 1024 * 1024;
const ACCEPTED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ACCEPTED_RECEIPT_EXTS = ".jpg,.jpeg,.png,.webp,.pdf";

type UploadedReceipt = {
  bucket: string;
  path: string;
};

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
  products,
  settings,
  qrMethods = [],
}: {
  payments: PaymentSettings;
  products: UrbanixProduct[];
  settings: StoreSettings;
  qrMethods?: QrPaymentMethod[];
}) {
  const supportWhatsAppNumber = settings.whatsappNumber ? getWhatsAppNumber(settings) : null;
  const router = useRouter();
  const { t } = useLanguage();
  const { clearCart, items, promoCode } = useCart();
  const [promotion, setPromotion] = useState<AppliedPromotion | null>(null);
  const handlePromotionChange = useCallback((next: AppliedPromotion | null) => setPromotion(next), []);
  const [customer, setCustomer] = useState(initialCustomer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Only show QR methods that are enabled and ready for customers to pay with.
  const activeQrMethods = qrMethods.filter((m) => m.isActive && Boolean(m.qrImageUrl));
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeQrMethods[0]?.id ?? ""
  );
  const selectedMethod = activeQrMethods.find((m) => m.id === selectedMethodId) ?? activeQrMethods[0] ?? null;

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [uploadedReceipt, setUploadedReceipt] = useState<UploadedReceipt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lines = buildCartLines(items, products);
  const totals = calculateOrderTotals(lines, settings, customer.state, promotion?.discountAmount ?? 0);
  const shippingText = freeShippingCopy(settings);

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
    setUploadedReceipt(null);

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
    setUploadedReceipt(null);
    setReceiptError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadReceiptToSupabase(file: File, orderNumber: string): Promise<UploadedReceipt> {
    const res = await fetch("/api/signed-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        orderNumber,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(errData.error ?? "Receipt upload failed. Please try again.");
    }

    const { bucket, filePath, signedUrl } = await res.json() as {
      bucket: string;
      filePath: string;
      signedUrl: string;
    };

    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!uploadRes.ok) {
      throw new Error(`Receipt upload failed: ${uploadRes.statusText}`);
    }

    return { bucket, path: filePath };
  }

  // ── Form submit ──────────────────────────────────────────────────────────────

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;
    if (!selectedMethod) {
      setSubmitError(t("checkout.noPaymentMethods", "No payment methods available. Please contact the store."));
      return;
    }
    if (!receiptFile) {
      const message = t("checkout.receiptRequiredBeforeOrder", "Please upload your payment receipt before placing the order.");
      setReceiptError(message);
      setSubmitError(message);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const orderNumber = createOrderNumber();

      // 1. Upload receipt before creating the order
      let finalReceipt: UploadedReceipt | null = null;
      setReceiptUploading(true);
      try {
        finalReceipt = await uploadReceiptToSupabase(receiptFile, orderNumber);
        setUploadedReceipt(finalReceipt);
      } catch (uploadErr) {
        setReceiptError(
          uploadErr instanceof Error ? uploadErr.message : "Receipt upload failed."
        );
        setSubmitting(false);
        setReceiptUploading(false);
        return;
      }
      setReceiptUploading(false);

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
        paymentMethodType: selectedMethod?.displayName ?? selectedMethodId ?? null,
        promoCode: promoCode || undefined,
        receiptBucket: finalReceipt?.bucket,
        receiptPath: finalReceipt?.path,
        items: lines.map((line) => ({
          productId: line.product.id,
          productName: line.product.name,
          // Product-level SKU (base); variant SKU not yet separately stored on CartLine
          productSku: line.product.sku,
          quantity: line.quantity,
          // Unit price derived from lineTotal (which already reflects variant-level pricing)
          unitPrice: line.quantity > 0 ? line.lineTotal / line.quantity : line.product.price,
          totalPrice: line.lineTotal,
          selectedVariants: line.selectedVariants ?? null,
        })),
      };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const orderData = await orderRes.json() as {
        ok?: boolean;
        orderId?: string;
        orderNumber?: string;
        error?: string;
        totals?: {
          discountAmount: number;
          freeShippingThreshold: number | null;
          isFreeShippingApplied: boolean;
          shippingFee: number;
          shippingRegion: "west" | "east" | null;
          subtotal: number;
          totalAmount: number;
        };
      };

      if (!orderRes.ok) {
        throw new Error(orderData.error ?? "Failed to place order. Please try again.");
      }

      // 3. Save to localStorage for success page / order history
      const confirmedTotals = orderData.totals
        ? {
            discount: orderData.totals.discountAmount,
            freeShippingThreshold: orderData.totals.freeShippingThreshold ?? undefined,
            isFreeShippingApplied: orderData.totals.isFreeShippingApplied,
            shipping: orderData.totals.shippingFee,
            shippingRegion: orderData.totals.shippingRegion ?? undefined,
            subtotal: orderData.totals.subtotal,
            total: orderData.totals.totalAmount,
          }
        : totals;

      const order: UrbanixOrder = {
        createdAt: new Date().toISOString(),
        customer,
        id: orderData.orderId ?? crypto.randomUUID(),
        items: lines,
        orderNumber: orderData.orderNumber ?? orderNumber,
        orderStatus: "pending",
        paymentMethod: "manual",
        paymentMethodType: selectedMethod?.displayName ?? selectedMethodId ?? null,
        paymentStatus: "pending",
        receiptBucket: finalReceipt?.bucket ?? null,
        receiptPath: finalReceipt?.path ?? null,
        receiptUrl: null,
        freeShippingThreshold: confirmedTotals.freeShippingThreshold,
        isFreeShippingApplied: confirmedTotals.isFreeShippingApplied,
        shippingRegion: confirmedTotals.shippingRegion,
        totals: confirmedTotals,
      };

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
        <h1 className="text-3xl font-extrabold">{t("checkout.title", "Checkout")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("checkout.subtitle", "Fill in your details to place the order.")}
        </p>
      </div>

      <form className="grid gap-6 lg:grid-cols-[1fr_380px]" onSubmit={handleSubmit}>
        <section className="flex flex-col gap-4">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("checkout.contactInformation", "Contact Information")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <FieldError error={errors.fullName}>
                <Input
                  aria-invalid={Boolean(errors.fullName)}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder={t("checkout.fullNamePlaceholder", "Full name")}
                  value={customer.fullName}
                />
              </FieldError>
              <FieldError error={errors.phone}>
                <Input
                  aria-invalid={Boolean(errors.phone)}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder={t("checkout.phonePlaceholder", "Phone number")}
                  value={customer.phone}
                />
              </FieldError>
              <FieldError error={errors.email}>
                <Input
                  aria-invalid={Boolean(errors.email)}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder={t("checkout.emailPlaceholder", "Email address (optional)")}
                  type="email"
                  value={customer.email}
                />
              </FieldError>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>{t("checkout.shippingAddress", "Shipping Address")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <FieldError className="sm:col-span-2" error={errors.addressLine1}>
                <Input
                  aria-invalid={Boolean(errors.addressLine1)}
                  onChange={(event) => updateField("addressLine1", event.target.value)}
                  placeholder={t("checkout.addressLine1Placeholder", "Address line 1")}
                  value={customer.addressLine1}
                />
              </FieldError>
              <Input
                className="sm:col-span-2"
                onChange={(event) => updateField("addressLine2", event.target.value)}
                placeholder={t("checkout.addressLine2Placeholder", "Address line 2")}
                value={customer.addressLine2}
              />
              <FieldError error={errors.city}>
                <Input
                  aria-invalid={Boolean(errors.city)}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder={t("checkout.cityPlaceholder", "City")}
                  value={customer.city}
                />
              </FieldError>
              <FieldError error={errors.state}>
                <select
                  aria-invalid={Boolean(errors.state)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  onChange={(event) => updateField("state", event.target.value)}
                  value={customer.state}
                >
                  <option value="">{t("shipping.selectState", "Select your state to calculate shipping fee")}</option>
                  {malaysiaStates.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </FieldError>
              <FieldError error={errors.postcode}>
                <Input
                  aria-invalid={Boolean(errors.postcode)}
                  onChange={(event) => updateField("postcode", event.target.value)}
                  placeholder={t("checkout.postcodePlaceholder", "Postcode")}
                  value={customer.postcode}
                />
              </FieldError>
              <FieldError error={errors.country}>
                <Input
                  aria-invalid={Boolean(errors.country)}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder={t("checkout.countryPlaceholder", "Country")}
                  value={customer.country}
                />
              </FieldError>
              <Input
                className="sm:col-span-2"
                onChange={(event) => updateField("deliveryNote", event.target.value)}
                placeholder={t("checkout.deliveryNotePlaceholder", "Delivery note, e.g. leave at the front door")}
                value={customer.deliveryNote}
              />
            </CardContent>
          </Card>
        </section>

        <aside className="flex flex-col gap-4">
          {/* State-aware: as soon as the customer picks a state, the bar
              recomputes against the correct West/East threshold and stays
              in sync with the OrderSummaryCard below (same shipping fn). */}
          <FreeShippingProgress settings={settings} subtotal={totals.subtotal} state={customer.state} />
          <PromotionCodeCard customerPhone={customer.phone} lines={lines} onPromotionChange={handlePromotionChange} />
          <OrderSummaryCard lines={lines} showItems totals={totals} />

          <div className="rounded-2xl border border-accent/20 bg-cream p-4 text-sm font-bold text-primary">
            <LocalizedValue fallback={shippingText.en} value={shippingText} />
          </div>
          {/* PR-C: settings-driven shipping fee table (West/East flat fee
              + free-shipping threshold). Read-only display only. */}
          <ShippingFeeBreakdown settings={settings} />

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>{t("checkout.paymentMethod", "Payment Method")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">

              {/* QR method selector */}
              {activeQrMethods.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {activeQrMethods.map((method) => {
                    const isSelected = selectedMethodId === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                          isSelected
                            ? "border-primary/60 bg-primary/5"
                            : "border-border bg-white hover:border-primary/30 hover:bg-primary/5"
                        }`}
                      >
                        <span className="text-xl">{method.id === "bank_qr" ? "🏦" : "📱"}</span>
                        <span className="text-sm font-bold">{method.displayName}</span>
                        <span className={`ml-auto size-4 shrink-0 rounded-full border-4 transition-colors ${
                          isSelected ? "border-primary" : "border-gray-300"
                        }`} />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("checkout.noPaymentMethods", "No payment methods available. Please contact the store.")}</p>
              )}

              {/* Pay amount — shown large above QR so customers transfer the exact total */}
              {selectedMethod && (
                <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary/80">
                    {t("checkout.payAmount", "Amount to pay")}
                  </p>
                  {customer.state ? (
                    <p className="mt-1 text-3xl font-extrabold text-primary">
                      {formatCurrency(totals.total)}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {t("checkout.selectStateForAmount", "Select your state to see the final amount.")}
                    </p>
                  )}
                </div>
              )}

              {/* Selected method QR display */}
              {selectedMethod && (
                <div className="rounded-2xl border border-warning/30 bg-amber-50 p-4 text-sm space-y-3">
                  <p className="font-extrabold text-primary">{selectedMethod.displayName}</p>
                  {selectedMethod.instructionText && (
                    <p className="text-xs text-muted-foreground">{selectedMethod.instructionText}</p>
                  )}
                  {selectedMethod.qrImageUrl ? (
                    <div className="flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedMethod.qrImageUrl}
                        alt={`${selectedMethod.displayName} QR code`}
                        className="h-48 w-48 rounded-xl object-contain border border-border bg-white p-2"
                      />
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-border bg-white text-xs text-muted-foreground">
                      {t("checkout.qrNotSetup", "QR code not set up yet. Please contact the store.")}
                    </div>
                  )}
                </div>
              )}

              {/* Payment steps — clarify the flow for first-time QR payment customers */}
              {selectedMethod && (
                <div className="rounded-2xl border border-border bg-white p-4 text-xs">
                  <p className="mb-2 text-sm font-bold text-primary">{t("payment.steps.title", "How to pay")}</p>
                  <ol className="flex flex-col gap-1.5 text-muted-foreground">
                    <li>{t("payment.steps.1", "Step 1: Scan the QR code")}</li>
                    <li>{t("payment.steps.2", "Step 2: Pay the exact amount shown above")}</li>
                    <li>{t("payment.steps.3", "Step 3: Upload your payment receipt")}</li>
                    <li>{t("payment.steps.4", "Step 4: Tap Place Order")}</li>
                  </ol>
                </div>
              )}

              {/* Receipt Upload */}
              <div className="rounded-2xl border border-border bg-secondary/30 p-4">
                <p className="mb-3 text-sm font-bold">
                  {t("checkout.uploadReceipt", "Upload Payment Receipt")} <span className="font-normal text-muted-foreground">({t("checkout.required", "required")})</span>
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
                    {uploadedReceipt ? (
                      <p className="flex items-center gap-1 text-xs font-semibold text-green-700">
                        ✓ {t("checkout.receiptUploaded", "Receipt uploaded successfully")}
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
                      <X className="size-3" /> {t("checkout.remove", "Remove")}
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-white p-4 text-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload className="size-6 text-muted-foreground" />
                    <span className="text-xs font-semibold text-primary">{t("checkout.chooseFile", "Choose file")}</span>
                    <span className="text-xs text-muted-foreground">{t("checkout.fileHint", `JPG, PNG, WEBP, PDF · Max ${MAX_RECEIPT_MB} MB`)}</span>
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

              {/* WhatsApp fallback — surfaced whenever customer hits an upload or submit
                  problem so they have a human path forward. Only renders when an
                  admin-configured WhatsApp number exists. */}
              {supportWhatsAppNumber && (receiptError || submitError) ? (
                <a
                  href={`https://wa.me/${supportWhatsAppNumber}?text=${encodeURIComponent(t("support.whatsappMessage", "Hi Urbanix Store, I need help with payment / receipt upload for my order."))}`}
                  rel="noreferrer"
                  target="_blank"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="size-4" />
                  <span>
                    {t("support.needHelp", "Need help with payment or upload?")} {t("support.contactWhatsApp", "Contact us on WhatsApp")}
                  </span>
                </a>
              ) : null}

              <Button
                className="w-full"
                size="lg"
                type="submit"
                variant="secondary"
                disabled={submitting}
              >
                {submitting
                  ? receiptUploading
                    ? t("checkout.uploadingReceipt", "Uploading receipt…")
                    : t("checkout.placingOrder", "Placing order…")
                  : t("checkout.placeOrder", "Place Order")}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-primary">
                <ShieldCheck className="size-4" />
                {t("checkout.safeSecure", "100% Safe & Secure")}
              </div>
            </CardContent>
          </Card>

          {/* PR-C: post-submit reassurance (manual verification + tracking
              + WhatsApp fallback). Display-only, does not affect submit. */}
          <OrderProcessInfo settings={settings} />
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
