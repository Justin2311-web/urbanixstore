export const dynamic = "force-dynamic";

import { formatCurrency } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveStockUpdate } from "@/lib/admin-actions";
import { SaveNotice } from "@/components/save-notice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function stockBadge(qty: number) {
  if (qty <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (qty <= 5) return <Badge variant="outline" className="border-orange-400 text-orange-500">Low Stock ({qty})</Badge>;
  return <Badge variant="secondary">In Stock ({qty})</Badge>;
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  let data;
  try {
    data = await readUrbanixStoreDataAsync();
  } catch {
    data = (await import("@ecommerce/shared")).defaultUrbanixStoreData;
  }

  const sorted = [...data.products].sort(
    (a, b) => (a.stockQuantity ?? 10) - (b.stockQuantity ?? 10)
  );

  const outCount = sorted.filter((p) => (p.stockQuantity ?? 10) <= 0).length;
  const lowCount = sorted.filter((p) => (p.stockQuantity ?? 10) > 0 && (p.stockQuantity ?? 10) <= 5).length;

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {outCount > 0 && <span className="font-bold text-destructive">{outCount} out of stock · </span>}
            {lowCount > 0 && <span className="font-bold text-orange-500">{lowCount} low stock · </span>}
            {sorted.length} products total
          </p>
        </div>
      </div>
      <SaveNotice saveError={params.saveError} saved={params.saved} />
      <form action={saveStockUpdate}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Stock Levels</CardTitle>
            <button
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              type="submit"
            >
              Save All Changes
            </button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <div className="hidden grid-cols-[1fr_140px_100px_80px_120px] gap-3 border-b bg-muted/40 px-6 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
                <span>Product</span>
                <span>Price</span>
                <span>Status</span>
                <span>Category</span>
                <span>New Stock Qty</span>
              </div>
              {sorted.map((product) => (
                <div
                  className="grid gap-3 border-b bg-card px-6 py-3 last:border-b-0 md:grid-cols-[1fr_140px_100px_80px_120px] md:items-center"
                  key={product.id}
                >
                  <div>
                    <div className="font-bold">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.sku}</div>
                  </div>
                  <div className="text-sm font-bold text-accent">{formatCurrency(product.price)}</div>
                  {stockBadge(product.stockQuantity ?? 10)}
                  <div className="text-xs text-muted-foreground">{product.category}</div>
                  <div className="flex items-center gap-2">
                    <input name={`product-id`} type="hidden" value={product.id} />
                    <Input
                      className="w-24 text-center"
                      defaultValue={product.stockQuantity ?? 10}
                      min="0"
                      name={`stock-${product.id}`}
                      type="number"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
