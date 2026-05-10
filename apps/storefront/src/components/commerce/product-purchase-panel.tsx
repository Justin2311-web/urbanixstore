"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import { formatCurrency, type ProductVariantGroup, type ProductVariantOption, type StoreSettings, type UrbanixProduct } from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
import { ProductWhatsAppButton } from "@/components/commerce/product-whatsapp-button";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { type SelectedProductOption } from "@/lib/order-links";

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
  const isOutOfStock = product.stockStatus === "out_of_stock";
  const shopeeUrl = product.shopeeUrl || settings.platformLinks?.shopee || "";
  const lazadaUrl = product.lazadaUrl || settings.platformLinks?.lazada || "";
  const variantGroups = useMemo(() => product.variantGroups ?? [], [product.variantGroups]);
  const hasVariants = variantGroups.length > 0;
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState("");
  const selectedOptions = useMemo(
    () => variantGroups
      .map((group): SelectedProductOption | null => {
        const selected = group.options.find((option) => option.id === selectedByGroup[group.id]);

        return selected ? { groupName: group.optionName, option: selected } : null;
      })
      .filter((item): item is SelectedProductOption => Boolean(item)),
    [selectedByGroup, variantGroups]
  );
  const allOptionsSelected = !hasVariants || selectedOptions.length === variantGroups.length;
  const finalPrice = product.price + selectedOptions.reduce((sum, { option }) => sum + option.priceAdjustment, 0);
  const selectedVariantImage = [...selectedOptions].reverse().find(({ option }) => option.imageUrl)?.option.imageUrl ?? "";

  const ctaText = useMemo(
    () => (isOutOfStock ? "Out of Stock" : hasVariants ? "Use WhatsApp" : "Add to Cart"),
    [hasVariants, isOutOfStock]
  );

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(`urbanix-product-variant-image:${product.id}`, {
      detail: selectedVariantImage,
    }));
  }, [product.id, selectedVariantImage]);

  function validateSelections() {
    if (hasVariants && !allOptionsSelected) {
      setValidationMessage("Please select all product options before ordering.");
      return false;
    }

    setValidationMessage("");
    return true;
  }

  function handleAddToCart() {
    if (!isOutOfStock && !hasVariants) {
      addItem(product.id, quantity);
    } else if (hasVariants) {
      validateSelections();
    }
  }

  function handleBuyNow() {
    if (!isOutOfStock && !hasVariants) {
      addItem(product.id, quantity);
      router.push("/checkout");
    } else if (hasVariants) {
      validateSelections();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {hasVariants ? (
        <div className="rounded-3xl border border-primary/15 bg-white p-4 shadow-sm" data-product-variant-panel>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Selected Price</p>
              <p className="mt-1 text-2xl font-extrabold text-accent" data-variant-final-price>
                {formatCurrency(finalPrice)}
              </p>
            </div>
            <p className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
              Base {formatCurrency(product.price)}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {variantGroups.map((group) => (
              <VariantGroupSelector
                group={group}
                key={group.id}
                onSelect={(option) => {
                  setSelectedByGroup((current) => ({ ...current, [group.id]: option.id }));
                  setValidationMessage("");
                }}
                selectedOptionId={selectedByGroup[group.id]}
              />
            ))}
          </div>
          {validationMessage ? (
            <p className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" data-variant-validation>
              {validationMessage}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <QuantitySelector
          disabled={isOutOfStock}
          onDecrease={() => setQuantity((current) => Math.max(1, current - 1))}
          onIncrease={() => setQuantity((current) => current + 1)}
          value={quantity}
        />
        <Button
          className="w-full"
          disabled={isOutOfStock || hasVariants}
          onClick={handleAddToCart}
          size="lg"
          type="button"
          variant="secondary"
        >
          <ShoppingCart />
          {ctaText}
        </Button>
      </div>
      <Button
        className="w-full"
        disabled={isOutOfStock || hasVariants}
        onClick={handleBuyNow}
        size="lg"
        type="button"
      >
        Buy Now
      </Button>
      <ProductWhatsAppButton
        className="w-full"
        disabled={hasVariants && !allOptionsSelected}
        finalPrice={finalPrice}
        onBlocked={validateSelections}
        product={product}
        quantity={quantity}
        selectedOptions={hasVariants ? selectedOptions : undefined}
        settings={settings}
        size="lg"
      />
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

function VariantGroupSelector({
  group,
  onSelect,
  selectedOptionId,
}: {
  group: ProductVariantGroup;
  onSelect: (option: ProductVariantOption) => void;
  selectedOptionId?: string;
}) {
  return (
    <div className="flex flex-col gap-2" data-variant-group={group.id}>
      <p className="text-sm font-extrabold text-foreground">
        <LocalizedValue fallback={group.optionName} value={group.localizedOptionName} />
      </p>
      <div className="flex flex-wrap gap-2">
        {group.options.map((option) => {
          const selected = selectedOptionId === option.id;

          return (
            <button
              aria-pressed={selected}
              className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                selected
                  ? "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(13,99,206,0.18)]"
                  : "border-border bg-card text-foreground hover:border-primary/45 hover:bg-secondary"
              }`}
              data-variant-option={option.id}
              key={option.id}
              onClick={() => onSelect(option)}
              type="button"
            >
              <LocalizedValue fallback={option.optionValue} value={option.localizedOptionValue} />
              {option.priceAdjustment ? (
                <span className={selected ? "ml-2 text-white/82" : "ml-2 text-muted-foreground"}>
                  {option.priceAdjustment > 0 ? "+" : ""}
                  {formatCurrency(option.priceAdjustment)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
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
