import type { CartLine, UrbanixProduct } from "@ecommerce/shared";
import type { CartItem } from "@/components/cart/cart-provider";

/**
 * Converts the new CartItem[] format into CartLine[] for display and checkout.
 * Products are looked up by their slug/id (UrbanixProduct.id is the slug).
 */
export function buildCartLines(items: CartItem[], products: UrbanixProduct[]): CartLine[] {
  const productMap = new Map(products.map((p) => [p.id, p]));

  return items
    .filter((item) => item.quantity > 0)
    .map((item): CartLine | null => {
      const product = productMap.get(item.productId);
      if (!product) return null;

      return {
        cartKey: item.cartKey,
        lineTotal: product.price * item.quantity,
        product,
        quantity: item.quantity,
        selectedVariants: item.selectedVariants,
      };
    })
    .filter((line): line is CartLine => line !== null);
}
