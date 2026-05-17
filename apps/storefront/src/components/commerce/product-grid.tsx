import type { UrbanixProduct } from "@ecommerce/shared";
import { EmptyState } from "@/components/commerce/empty-state";
import { ProductCard } from "@/components/commerce/product-card";

export function ProductGrid({
  compact = false,
  emptyActionLabel = "Back to Shop",
  emptyTitle = "No products found",
  products,
}: {
  products: UrbanixProduct[];
  compact?: boolean;
  emptyTitle?: string;
  emptyActionLabel?: string;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        actionHref="/products"
        actionLabel={emptyActionLabel}
        title={emptyTitle}
      />
    );
  }

  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          : "grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {products.map((product) => (
        <ProductCard compact={compact} key={product.id} product={product} />
      ))}
    </div>
  );
}
