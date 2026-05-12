export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { ProductForm } from "@/components/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let categories: Awaited<ReturnType<typeof readUrbanixStoreDataAsync>>["categories"] = [];
  let products: Awaited<ReturnType<typeof readUrbanixStoreDataAsync>>["products"] = [];
  try {
    const data = await readUrbanixStoreDataAsync();
    categories = data.categories;
    products = data.products;
  } catch {
    const { defaultUrbanixStoreData } = await import("@ecommerce/shared");
    categories = defaultUrbanixStoreData.categories;
    products = defaultUrbanixStoreData.products;
  }
  const product = products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Edit Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update price, promotions, stock, descriptions, and status.</p>
      </div>
      <ProductForm categories={categories} product={product} />
    </main>
  );
}
