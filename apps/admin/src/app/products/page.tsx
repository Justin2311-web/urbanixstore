export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { Flash } from "@/components/flash";

type ProductRow = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  main_image_url: string | null;
  categories: { name: string } | null;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string; q?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  let query = sb
    .from("products")
    .select("id, name, sku, slug, price, stock_quantity, is_active, is_featured, main_image_url, categories(name)")
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,sku.ilike.%${params.q}%`);
  }

  const { data: productsRaw, error } = await query;
  const products = productsRaw as ProductRow[] | null;

  if (error) console.error("[Admin] Products list error:", error);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <Link href="/products/new" className="btn-primary">
          + Add Product
        </Link>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      {/* Search */}
      <form className="mb-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by name or SKU…"
          className="field-input max-w-xs"
        />
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="table-th">Product</th>
                <th className="table-th">SKU</th>
                <th className="table-th">Category</th>
                <th className="table-th">Price</th>
                <th className="table-th">Stock</th>
                <th className="table-th">Status</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(products ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                    No products found.{" "}
                    <Link href="/products/new" className="text-[#0e5c56] underline">
                      Add one.
                    </Link>
                  </td>
                </tr>
              )}
              {(products ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      {p.main_image_url ? (
                        <img
                          src={p.main_image_url}
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                          No img
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 max-w-[180px] truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td font-mono text-xs">{p.sku}</td>
                  <td className="table-td text-gray-500">
                    {p.categories?.name ?? "—"}
                  </td>
                  <td className="table-td font-semibold">{formatCurrency(Number(p.price))}</td>
                  <td className="table-td">
                    <span className={p.stock_quantity <= 0 ? "text-red-600 font-semibold" : p.stock_quantity <= 5 ? "text-yellow-600 font-semibold" : "text-gray-700"}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={p.is_active ? "badge-active" : "badge-inactive"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                    {p.is_featured && (
                      <span className="ml-1 badge-shipped">Featured</span>
                    )}
                  </td>
                  <td className="table-td text-right">
                    <Link
                      href={`/products/${p.id}/edit`}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
