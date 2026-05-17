export const dynamic = "force-dynamic";

import type { Database } from "@ecommerce/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { ProductForm } from "@/components/product-form";
import { Flash } from "@/components/flash";
import { deleteProduct } from "@/lib/actions";

type CategoryOption = { id: string; name: string };
type ProductWithImages = Database["public"]["Tables"]["products"]["Row"] & {
  product_images: Array<{ image_url: string; sort_order: number }>;
  name_en?: string | null;
  name_zh?: string | null;
  name_ms?: string | null;
  short_description_en?: string | null;
  short_description_zh?: string | null;
  short_description_ms?: string | null;
  description_en?: string | null;
  description_zh?: string | null;
  description_ms?: string | null;
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = createAdminClient();

  const [{ data: productRaw }, { data: categoriesRaw }] = await Promise.all([
    sb
      .from("products")
      .select(
        "id, name, name_en, name_zh, name_ms, sku, slug, category_id, price, promotion_price, promotion_start_at, promotion_end_at, stock_quantity, is_active, is_featured, short_description, short_description_en, short_description_zh, short_description_ms, description, description_en, description_zh, description_ms, highlights, specifications, shipping_info, return_note, rating, main_image_url, product_variants, product_images(image_url, sort_order)"
      )
      .eq("id", id)
      .single(),
    sb
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const product = productRaw as ProductWithImages | null;
  const categories = categoriesRaw as CategoryOption[] | null;

  if (!product) notFound();

  // Parse product_variants JSONB — detect new format (with originalPrice) vs old (with values)
  const rawVariants = Array.isArray(product.product_variants) ? product.product_variants : [];
  type NewVariant = { name: string; sku: string; originalPrice: number; promotionPrice?: number | null; stockQuantity: number };
  type OldVariant = { name: string; values: string[] };

  const isNewFormat =
    rawVariants.length > 0 &&
    typeof (rawVariants[0] as Record<string, unknown>).originalPrice === "number";

  const variantEntries: NewVariant[] | null = isNewFormat
    ? (rawVariants as NewVariant[])
    : null; // null → form will auto-seed from legacy price

  // Build product shape for the form
  const formProduct = {
    id: product.id,
    name: product.name_en || product.name,
    name_en: product.name_en || product.name || "",
    name_zh: product.name_zh || "",
    name_ms: product.name_ms || "",
    sku: product.sku,
    slug: product.slug,
    category_id: product.category_id,
    // Legacy price fields — used to seed default variant for old products
    price: Number(product.price),
    promotion_price: product.promotion_price ? Number(product.promotion_price) : null,
    promotion_start_at: product.promotion_start_at,
    promotion_end_at: product.promotion_end_at,
    stock_quantity: product.stock_quantity,
    is_active: product.is_active,
    is_featured: product.is_featured,
    short_description: product.short_description_en || product.short_description || "",
    short_description_en: product.short_description_en || product.short_description || "",
    short_description_zh: product.short_description_zh || "",
    short_description_ms: product.short_description_ms || "",
    description: product.description_en || product.description || "",
    description_en: product.description_en || product.description || "",
    description_zh: product.description_zh || "",
    description_ms: product.description_ms || "",
    highlights: Array.isArray(product.highlights) ? (product.highlights as string[]) : [],
    specifications: Array.isArray(product.specifications) ? (product.specifications as string[]) : [],
    shipping_info: product.shipping_info || "",
    return_note: product.return_note || "",
    rating: product.rating,
    // New-format variant entries (null → form seeds default from legacy price)
    variant_entries: variantEntries,
    images: (product.product_images ?? []).sort((a, b) => a.sort_order - b.sort_order),
  };

  // Suppress "declared but never read" for OldVariant (used only for JSONB detection)
  void (null as unknown as OldVariant);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="mb-1 text-sm text-gray-500">
            <Link href="/products" className="hover:underline">Products</Link>
            {" › "}Edit
          </div>
          <h1 className="page-title">{product.name}</h1>
          <p className="text-sm text-gray-500 font-mono">{product.slug}</p>
        </div>

        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <button
            type="submit"
            className="btn-danger text-xs px-3 py-1.5"
            onClick={undefined}
            formAction={deleteProduct}
          >
            Delete Product
          </button>
        </form>
      </div>

      <Flash saved={sp.saved} saveError={sp.saveError} />

      <ProductForm categories={categories ?? []} product={formProduct} />
    </div>
  );
}
