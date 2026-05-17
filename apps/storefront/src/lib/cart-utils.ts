import type { CartLine, UrbanixProduct } from "@ecommerce/shared";
import { getVariantEffectivePrice } from "@ecommerce/shared";
import type { CartItem } from "@/components/cart/cart-provider";

/**
 * Converts CartItem[] into CartLine[] for display and checkout.
 *
 * Pricing resolution:
 *  1. If the product has new-format `variants` (per-variant pricing), look up the
 *     variant whose `name` matches `item.selectedVariants?.variant`.
 *     Fall back to the first variant if no match is found.
 *  2. If no new-format variants (old products), use `product.price` as-is.
 *
 * Products are keyed by their slug (UrbanixProduct.id === slug).
 */
export function buildCartLines(items: CartItem[], products: UrbanixProduct[]): CartLine[] {
  const productMap = new Map(products.map((p) => [p.id, p]));

  return items
    .filter((item) => item.quantity > 0)
    .map((item): CartLine | null => {
      const product = productMap.get(item.productId);
      if (!product) return null;

      // ── Resolve effective unit price ────────────────────────────────────────
      let unitPrice = product.price; // default fallback

      if (product.variants && product.variants.length > 0) {
        // New format: find variant by name stored in selectedVariants.variant
        const variantName = item.selectedVariants?.variant;
        const variant = variantName
          ? product.variants.find((v) => v.name === variantName)
          : product.variants[0]; // auto-select first if no selection stored

        if (variant) {
          unitPrice = getVariantEffectivePrice(variant).price;
        }
      }

      return {
        cartKey: item.cartKey,
        lineTotal: unitPrice * item.quantity,
        product,
        quantity: item.quantity,
        selectedVariants: item.selectedVariants,
      };
    })
    .filter((line): line is CartLine => line !== null);
}

/**
 * Returns the display price and originalPrice for a cart item,
 * resolving from the selected variant if available.
 */
export function getCartItemDisplayPricing(
  product: UrbanixProduct,
  selectedVariants?: Record<string, string>
): { price: number; originalPrice?: number } {
  if (product.variants && product.variants.length > 0) {
    const variantName = selectedVariants?.variant;
    const variant = variantName
      ? product.variants.find((v) => v.name === variantName)
      : product.variants[0];

    if (variant) {
      const vp = getVariantEffectivePrice(variant);
      return { price: vp.price, originalPrice: vp.originalPrice };
    }
  }
  return { price: product.price, originalPrice: product.originalPrice };
}
