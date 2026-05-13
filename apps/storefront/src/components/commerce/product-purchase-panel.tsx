"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ShoppingBag, ShoppingCart, Store } from "lucide-react";
import { formatCurrency, type StoreSettings, type UrbanixProduct } from "@ecommerce/shared";
import { useCart } from "@/components/cart/cart-provider";
import { QuantitySelector } from "@/components/commerce/quantity-selector";
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
  const isOutOfStock = product.stockStatus === "out_of_stock";
  const shopeeUrl = product.shopeeUrl || settings.platformLinks?.shopee || "";
  const lazadaUrl = product.lazadaUrl || settings.platformLinks?.lazada || "";

  // Simple JSONB variants from DB: [{name: "Color", values: ["Black","White"]}]
  const variantGroups = product.productVariants ?? [];
  const hasVariants = variantGroups.length > 0;

  // Selected values: { "Color": "Black", "Style": "Premium" }
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [validationMessage, setValidationMessage] = useState("");

  const allVariantsSelected = useMemo(() => {
    if (!hasVariants) return true;
    return variantGroups.every((group) => Boolean(selectedVariants[group.name]));
  }, [hasVariants, variantGroups, selectedVariants]);

  function handleSelect(groupName: string, value: string) {
    setSelectedVariants((current) => ({ ...current, [groupName]: value }));
    setValidationMessage("");
  }

  function validate(): boolean {
    if (hasVariants && !allVariantsSelected) {
      const missing = variantGroups
        .filter((g) => !selectedVariants[g.name])
        .map((g) => g.name)
        .join(", ");
      setValidationMessage(`Please select: ${missing}`);
      return false;
    }
    setValidationMessage("");
    return true;
  }

  function handleAddToCart() {
    if (isOutOfStock || !validate()) return;
    addItem(product.id, quantity, hasVariants ? selectedVariants : undefined);
  }

  function handleBuyNow() {
    if (isOutOfStock || !validate()) return;
    addItem(product.id, quantity, hasVariants ? selectedVariants : undefined);
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-3">
      {hasVariants ? (
        <div className="rounded-3xl border border-primary/15 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            {variantGroups.map((group) => (
              <div className="flex flex-col gap-2" key={group.name}>
                <p className="text-sm font-extrabold text-foreground">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const selected = selectedVariants[group.name] === value;
                    return (
                      <button
                        aria-pressed={selected}
                        className={`rounded-2xl border px-4 py-2 text-sm font-bold transition ${
                          selected
                            ? "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(13,99,206,0.18)]"
                            : "border-border bg-card text-foreground hover:border-primary/45 hover:bg-secondary"
                        }`}
                        key={value}
                        onClick={() => handleSelect(group.name, value)}
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
