import Link from "next/link";
import { Package, Settings, ShoppingBag, TrendingUp } from "lucide-react";
import { formatCurrency } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const data = await readUrbanixStoreDataAsync({ includeOrders: true });
  const stats = [
    { label: "Products", value: String(data.products.length), icon: Package },
    { label: "Orders", value: String(data.orders.length), icon: ShoppingBag },
    { label: "Low Stock", value: String(data.products.filter((product) => (product.stockQuantity ?? 10) <= 5).length), icon: TrendingUp },
    { label: "Store", value: data.settings.storeActive ? "Active" : "Maintenance", icon: Settings },
  ];

  return (
    <main className="urbanix-container urbanix-section">
      <section className="mb-6 rounded-2xl border bg-card p-6">
        <Badge className="mb-4">Admin dashboard</Badge>
        <h1 className="text-3xl font-extrabold">Urbanix Store Control Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage boutique products, stock, orders, banners, and settings from one focused workspace.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 pt-4">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">{stat.value}</div>
                  <div className="text-xs font-semibold text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.products.slice(0, 4).map((product) => (
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-3" key={product.id}>
                <div>
                  <div className="text-sm font-bold">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.category}</div>
                </div>
                <Badge variant={product.status === "inactive" ? "outline" : "secondary"}>
                  {product.status === "inactive" ? "Inactive" : formatCurrency(product.price)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link className={buttonVariants()} href="/products">
              Manage Products
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/orders">
              Review Orders
            </Link>
            <Link className={buttonVariants({ variant: "outline" })} href="/settings">
              Store Settings
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
