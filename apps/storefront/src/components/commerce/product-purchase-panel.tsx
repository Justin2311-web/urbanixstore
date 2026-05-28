"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import {
  formatCurrency,
  getVariantEffectivePrice,
  type ProductVariantEntry,
  type StoreSettings,
  type UrbanixProduct,
} from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { PriceDisplay } from "@/components/commerce/price-display";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { StockBadge } from "@/components/commerce/stock-badge";
import { useLanguage } from "@/components/i18n/language-provider";
import { getProductImageForLanguage } from "@/lib/product-media";
import { Button, buttonVariants } from "@/components/ui/button";

export function ProductPurchasePanel({
  product,
  settings,
}: {
  product: UrbanixProduct;
  settings: Pick<StoreSettings, "platformLinks" | "storeName" | "whatsappNumber">;
}) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();
  const { language } = useLanguage();

  const shopeeUrl = product.shopeeUrl || settings.platformLinks?.shopee || "";
  const lazadaUrl = product.lazadaUrl || settings.platformLinks?.lazada || "";

  // ── New flat variant list (per-variant pricing) ────────────────────────────
  const variants: ProductVariantEntry[] = product.variants ?? [];
  const hasNewVariants = variants.length > 0;

  // ── Legacy simple variant groups (old format, no per-variant pricing) ──────
  const legacyVariantGroups = useMemo(
    () => product.productVariants ?? [],
    [product.productVariants]
  );
  const hasLegacyVariants = !hasNewVariants && legacyVariantGroups.length > 0;

  // ── Selected variant state ─────────────────────────────────────────────────
  // For new-format variants, auto-select the first one.
  // For single-variant products, we always use the only variant (no UI shown).
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantEntry | null>(
    hasNewVariants ? variants[0] : null
  );

  // ── Legacy variant selection state (for old-format products) ──────────────
  const [selectedLegacy, setSelectedLegacy] = useState<Record<string, string>>({});

  const allLegacySelected = useMemo(() => {
    if (!hasLegacyVariants) return true;
    return legacyVariantGroups.every((group) => Boolean(selectedLegacy[group.name]));
  }, [hasLegacyVariants, legacyVariantGroups, selectedLegacy]);

  const [validationMessage, setValidationMessage] = useState("");

  // ── Derived pricing from selected variant ──────────────────────────────────
  const variantPricing = useMemo(() => {
    if (selectedVariant) return getVariantEffectivePrice(selectedVariant);
    return null;
  }, [selectedVariant]);

  const displayPrice = variantPricing?.price ?? product.price;
  const displayOriginalPrice = variantPricing?.originalPrice ?? product.originalPrice;
  const displayPromotionPercent = variantPricing?.promotionPercent ?? product.promotionPercent;

  // ── Stock status from selected variant ────────────────────────────────────
  const selectedStockQty = selectedVariant
    ? selectedVariant.stockQuantity
    : (product.stockQuantity ?? 0);
  const stockStatus: UrbanixProduct["stockStatus"] =
    selectedStockQty <= 0
      ? "out_of_stock"
      : selectedStockQty <= 5
        ? "low_stock"
        : "in_stock";
  const isOutOfStock = stockStatus === "out_of_stock";

  // ── Handlers ──────────────────────────────────────────────────────────────

  function validate(): boolean {
    // New-format: must have a selected variant (always true since we default to first)
    if (hasNewVariants && !selectedVariant) {
      setValidationMessage("Please select a variant.");
      return false;
    }
    // Legacy format: must have all group selections
    if (hasLegacyVariants && !allLegacySelected) {
      const missing = legacyVariantGroups
        .filter((g) => !selectedLegacy[g.name])
        .map((g) => g.name)
        .join(", ");
      setValidationMessage(`Please select: ${missing}`);
      return false;
    }
    setValidationMessage("");
    return true;
  }

  function buildCartVariants(): Record<string, string> | undefined {
    if (hasNewVariants && selectedVariant) {
      // Use a special "variant" key to store the selected variant name
      return { variant: selectedVariant.name };
    }
    if (hasLegacyVariants) return selectedLegacy;
    return undefined;
  }

  function handleAddToCart() {
    if (isOutOfStock || !validate()) return;
    addItem(product.id, quantity, buildCartVariants());
  }

  function handleBuyNow() {
    if (isOutOfStock || !validate()) return;
    addItem(product.id, quantity, buildCartVariants());
    router.push("/checkout");
  }

  const savings =
    displayOriginalPrice && displayOriginalPrice > displayPrice
      ? displayOriginalPrice - displayPrice
      : 0;
  const fallbackVariantImage = getProductImageForLanguage(product, language) || product.image || product.mainImageUrl || "";
  const variantGroupLabel =
    selectedVariant?.localizedGroupName?.[language] ||
    selectedVariant?.localizedGroupName?.en ||
    selectedVariant?.groupName ||
    "Option";

  function previewVariantImage(variant: ProductVariantEntry) {
    window.dispatchEvent(
      new CustomEvent(`urbanix-product-variant-image:${product.id}`, {
        detail: variant.imageUrl
          ? { images: [variant.imageUrl], mode: "variant" }
          : { images: [], mode: "product" },
      })
    );
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Price display (updates on variant selection) ── */}
      <div className="urbanix-surface p-6">
        <PriceDisplay originalPrice={displayOriginalPrice} price={displayPrice} size="lg" />
        {displayPromotionPercent ? (
          <p className="mt-1 inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
            {displayPromotionPercent}% OFF
          </p>
        ) : null}
        {savings > 0 ? (
          <p className="mt-2 text-sm font-bold text-success">
            You save {formatCurrency(savings)}
          </p>
        ) : null}
      </div>

      {/* Variant selector - new flat format */}
      {hasNewVariants ? (
        <div className="rounded-3xl border border-primary/15 bg-card/92 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.06)] dark:border-[rgba(59,158,255,0.18)] dark:bg-[rgba(11,21,40,0.82)] dark:shadow-[0_16px_44px_rgba(0,0,0,0.28)]">
          <p className="mb-3 text-sm font-extrabold text-foreground">Select {variantGroupLabel}</p>
          <div className="flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const isSelected = selectedVariant?.name === v.name;
              const vPricing = getVariantEffectivePrice(v);
              const outOfStock = v.stockQuantity <= 0;
              const label = v.localizedName?.[language] || v.localizedName?.en || v.name;
              const optionImage = v.imageUrl || fallbackVariantImage;
              return (
                <button
                  aria-pressed={isSelected}
                  className={`group relative flex min-w-[8.5rem] items-center gap-2.5 rounded-2xl border p-2 pr-3 text-left text-sm font-bold transition duration-300 ${
                    outOfStock
                      ? "cursor-not-allowed border-border/40 bg-muted/40 text-muted-foreground opacity-60"
                      : isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-[0_12px_28px_rgba(13,99,206,0.18)] ring-2 ring-primary/15 dark:bg-[rgba(59,158,255,0.14)] dark:text-[#8bdcff] dark:shadow-[0_12px_32px_rgba(59,158,255,0.16)]"
                        : "border-border bg-card/88 text-foreground hover:-translate-y-0.5 hover:border-primary/45 hover:bg-secondary/70 dark:bg-[rgba(15,30,56,0.72)] dark:hover:bg-[rgba(28,52,90,0.9)]"
                  }`}
                  data-variant-option
                  disabled={outOfStock}
                  key={`${v.sku}-${v.name}`}
                  onClick={() => {
                    setSelectedVariant(v);
                    setValidationMessage("");
                    previewVariantImage(v);
                  }}
                  type="button"
                  title={outOfStock ? "Out of stock" : `${label} - ${formatCurrency(vPricing.price)}`}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/70 bg-muted/40 shadow-sm dark:border-white/10 dark:bg-[rgba(5,11,24,0.62)]">
                    {optionImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={label}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                        src={optionImage}
                      />
                    ) : (
                      <span className="text-xs font-black uppercase">{label.slice(0, 2)}</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{label}</span>
                    {outOfStock ? (
                      <span className="block text-xs font-semibold opacity-70">sold out</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedVariant && (
            <div className="mt-3 rounded-xl bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">SKU: {selectedVariant.sku}</span>
              {" | "}
              <StockStatus qty={selectedVariant.stockQuantity} />
            </div>
          )}

          {validationMessage ? (
            <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {validationMessage}
            </p>
          ) : null}
        </div>
      ) : null}
      {/* ── Legacy variant selector (old-format products) ── */}
      {hasLegacyVariants ? (
        <div className="rounded-3xl border border-primary/15 bg-card p-4 shadow-sm dark:border-[rgba(59,158,255,0.18)]">
          <div className="flex flex-col gap-4">
            {legacyVariantGroups.map((group) => (
              <div className="flex flex-col gap-2" key={group.name}>
                <p className="text-sm font-extrabold text-foreground">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const selected = selectedLegacy[group.name] === value;
                    return (
                      <button
                        aria-pressed={selected}
                        className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                          selected
                            ? "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(13,99,206,0.18)]"
                            : "border-border bg-card text-foreground hover:border-primary/45 hover:bg-secondary"
                        }`}
                        key={value}
                        onClick={() => {
                          setSelectedLegacy((current) => ({ ...current, [group.name]: value }));
                          setValidationMessage("");
                        }}
                        type="button"
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {validationMessage ? (
            <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {validationMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Stock badge ── */}
      <StockBadge status={stockStatus} />

      {/* ── Qty + Add to cart ── */}
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <QuantitySelector
          disabled={isOutOfStock}
          onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
          onIncrease={() => setQuantity((current) => current + 1)}
          value={quantity}
        />
        <Button
          className="w-full"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          size="lg"
          type="button"
          variant="secondary"
        >
          <ShoppingCart />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>

      <Button
        className="w-full"
        disabled={isOutOfStock}
        onClick={handleBuyNow}
        size="lg"
        type="button"
      >
        Buy Now
      </Button>

      <div className="grid gap-2 sm:grid-cols-2">
        <MarketplaceButton
          href={shopeeUrl}
          icon="shopee"
          label={shopeeUrl ? "Buy on Shopee" : "Shopee Coming Soon"}
        />
        <MarketplaceButton
          href={lazadaUrl}
          icon="lazada"
          label={lazadaUrl ? "Buy on Lazada" : "Lazada Coming Soon"}
        />
      </div>
    </div>
  );
}

function StockStatus({ qty }: { qty: number }) {
  if (qty <= 0) return <span className="font-semibold text-destructive">Out of stock</span>;
  if (qty <= 5) return <span className="font-semibold text-warning">Low stock ({qty} left)</span>;
  return <span className="font-semibold text-success">In stock ({qty})</span>;
}

function MarketplaceButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: "shopee" | "lazada";
  label: string;
}) {
  const Icon = icon === "shopee" ? ShoppingBag : Store;

  if (!href) {
    return (
      <Button className="w-full" disabled size="lg" type="button" variant="outline">
        <Icon />
        {label}
      </Button>
    );
  }

  return (
    <a
      className={buttonVariants({ className: "w-full", size: "lg", variant: "outline" })}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <Icon />
      {label}
      <ExternalLink />
    </a>
  );
}
