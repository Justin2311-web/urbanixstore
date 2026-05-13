export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase";
import { ProductForm } from "@/components/product-form";
import { Flash } from "@/components/flash";
import Link from "next/link";

type CategoryOption = { id: string; name: string };

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ saveError?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  const { data: categoriesRaw } = await sb
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");
  const categories = categoriesRaw as CategoryOption[] | null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="mb-1 text-sm text-gray-500">
            <Link href="/products" className="hover:underline">Products</Link>
            {" › "}New Product
          </div>
          <h1 className="page-title">Add New Product</h1>
        </div>
      </div>

      <Flash saveError={params.saveError} />

      <ProductForm categories={categories ?? []} />
    </div>
  );
}
