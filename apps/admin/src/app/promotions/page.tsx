import type { Database, Json } from "@ecommerce/database";
import { createAdminClient } from "@/lib/supabase";
import { PromotionForm } from "@/components/promotion-form";

type PromotionRow = Database["public"]["Tables"]["promotions"]["Row"];
type ProductRow = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "name" | "sku" | "product_variants">;
type CategoryRow = Pick<Database["public"]["Tables"]["categories"]["Row"], "id" | "name">;

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const sb = createAdminClient();
  const [{ data: promotions, error }, { data: products }, { data: categories }] = await Promise.all([
    sb.from("promotions").select("*").order("created_at", { ascending: false }),
    sb.from("products").select("id, name, sku, product_variants").order("name"),
    sb.from("categories").select("id, name").order("name"),
  ]);
  if (error) throw new Error(`Unable to load promotions: ${error.message}`);
  const promotionRows = (promotions ?? []) as PromotionRow[];
  const productRows = (products ?? []) as ProductRow[];
  const categoryRows = (categories ?? []) as CategoryRow[];
  const productOptions = productRows.map((product) => ({ id: product.id, label: `${product.name} (${product.sku})` }));
  const categoryOptions = categoryRows.map((category) => ({ id: category.id, label: category.name }));
  const variantOptions = productRows.flatMap((product) => parseVariantNames(product.product_variants).map((name) => ({ id: `${product.id}::${name}`, label: `${product.name} — ${name}` })));

  return <main className="grid gap-6"><div><h1 className="text-3xl font-extrabold">Promo Codes</h1><p className="mt-1 text-sm text-muted-foreground">Configure multi-item sequence discounts without changing storefront code.</p></div>{promotionRows.map((promotion) => <PromotionForm categories={categoryOptions} key={promotion.id} products={productOptions} promotion={promotion} variants={variantOptions} />)}<PromotionForm categories={categoryOptions} products={productOptions} variants={variantOptions} /></main>;
}

function parseVariantNames(value: Json | null): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => entry && typeof entry === "object" && !Array.isArray(entry) && typeof entry.name === "string" ? [entry.name] : []);
}
