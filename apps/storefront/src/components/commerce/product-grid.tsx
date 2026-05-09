import type { StoreSettings, UrbanixProduct } from "@ecommerce/shared";
import { EmptyState } from "@/components/commerce/empty-state";
import { ProductCard } from "@/components/commerce/product-card";

export function ProductGrid({
  emptyActionLabel = "Back to Shop",
  emptyTitle = "No products found",
  products,
  settings,
}: {
  products: UrbanixProduct[];
  settings: Pick<StoreSettings, "storeName" | "whatsappNumber">;
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
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} settings={settings} />
      ))}
    </div>
  );
}
