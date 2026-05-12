export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { ProductForm } from "@/components/product-form";

export default async function AddProductPage() {
  const { categories } = await readUrbanixStoreDataAsync();

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Add Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a storefront-ready Urbanix product.</p>
      </div>
      <ProductForm categories={categories} />
    </main>
  );
}
