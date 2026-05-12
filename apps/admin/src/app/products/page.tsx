export const dynamic = "force-dynamic";

import Link from "next/link";
import { formatCurrency } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { SaveNotice } from "@/components/save-notice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  let products: Awaited<ReturnType<typeof readUrbanixStoreDataAsync>>["products"] = [];
  try {
    const data = await readUrbanixStoreDataAsync();
    products = data.products;
  } catch {
    const { defaultUrbanixStoreData } = await import("@ecommerce/shared");
    products = defaultUrbanixStoreData.products;
  }

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage Urbanix product listings, prices, promotions, and stock.
          </p>
        </div>
        <Link className={buttonVariants({ variant: "secondary" })} href="/products/new">New Product</Link>
      </div>
      <SaveNotice saved={params.saved} />
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input placeholder="Search products..." />
          <div className="overflow-hidden rounded-2xl border">
            {products.map((product) => (
              <div
                className="grid gap-3 border-b bg-card p-4 last:border-b-0 md:grid-cols-[1fr_120px_120px_100px_80px]"
                key={product.id}
              >
                <div>
                  <div className="font-bold">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.category}</div>
                </div>
                <div className="text-sm font-bold text-accent">{formatCurrency(product.promotionPrice ?? product.price)}</div>
                <Badge variant={product.promotionPrice ? "destructive" : "secondary"}>
                  {product.promotionPrice ? "Promo" : "Regular"}
                </Badge>
                <Badge variant={product.status === "inactive" ? "outline" : "secondary"}>
                  {product.status === "inactive" ? "Inactive" : "Active"}
                </Badge>
                <Link className="text-sm font-bold text-primary" href={`/products/${product.id}/edit`}>Edit</Link>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
