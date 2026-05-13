export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { formatCurrency } from "@/lib/utils";
import { saveInventory } from "@/lib/actions";

type InventoryRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  main_image_url: string | null;
  categories: { name: string } | null;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  const { data: productsRaw } = await sb
    .from("products")
    .select("id, name, sku, price, stock_quantity, is_active, main_image_url, categories(name)")
    .order("stock_quantity", { ascending: true });
  const products = productsRaw as InventoryRow[] | null;

  const outOfStock = (products ?? []).filter((p) => p.stock_quantity <= 0).length;
  const lowStock = (products ?? []).filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {outOfStock > 0 && (
              <span className="font-semibold text-red-600">{outOfStock} out of stock · </span>
            )}
            {lowStock > 0 && (
              <span className="font-semibold text-yellow-600">{lowStock} low stock · </span>
            )}
            {(products ?? []).length} products total
          </p>
        </div>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      <form action={saveInventory}>
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-800">Stock Levels</h2>
            <button type="submit" className="btn-primary text-sm">
              Save All Changes
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">SKU</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Current Stock</th>
                  <th className="table-th">New Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(products ?? []).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {p.main_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.main_image_url}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-lg bg-gray-100 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900 max-w-[160px] truncate">{p.name}</p>
                          <span className={p.is_active ? "badge-active" : "badge-inactive"}>
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="table-td font-mono text-xs">{p.sku}</td>
                    <td className="table-td text-gray-500 text-xs">
                      {p.categories?.name ?? "—"}
                    </td>
                    <td className="table-td font-semibold">{formatCurrency(Number(p.price))}</td>
                    <td className="table-td">
                      <span className={
                        p.stock_quantity <= 0 ? "font-bold text-red-600" :
                        p.stock_quantity <= 5 ? "font-bold text-yellow-600" :
                        "text-gray-700"
                      }>
                        {p.stock_quantity <= 0
                          ? "Out of stock"
                          : p.stock_quantity <= 5
                          ? `Low (${p.stock_quantity})`
                          : p.stock_quantity}
                      </span>
                    </td>
                    <td className="table-td">
                      {/* Hidden product ID for the action to know which row this is */}
                      <input type="hidden" name="product_id" value={p.id} />
                      <input
                        type="number"
                        name={`stock_${p.id}`}
                        min="0"
                        defaultValue={p.stock_quantity}
                        className="w-24 field-input text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-100 px-5 py-4 text-right">
            <button type="submit" className="btn-primary">
              Save All Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
