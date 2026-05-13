export const dynamic = "force-dynamic";

import Link from "next/link";
import { AlertTriangle, Package, ShoppingBag, TrendingUp, Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { start, end };
}

export default async function Home() {
  let data;
  try {
    data = await readUrbanixStoreDataAsync({ includeOrders: true });
  } catch {
    data = (await import("@ecommerce/shared")).defaultUrbanixStoreData;
  }

  const { start, end } = getMonthBounds();
  const thisMonthOrders = data.orders.filter(
    (o) => o.createdAt >= start && o.createdAt <= end
  );
  const totalRevenue = data.orders
    .filter((o) => o.paymentStatus === "paid" || o.orderStatus === "completed")
    .reduce((sum, o) => sum + (o.totals?.total ?? o.totalAmount ?? 0), 0);
  const monthRevenue = thisMonthOrders
    .filter((o) => o.paymentStatus === "paid" || o.orderStatus === "completed")
    .reduce((sum, o) => sum + (o.totals?.total ?? o.totalAmount ?? 0), 0);
  const lowStockProducts = data.products.filter((p) => (p.stockQuantity ?? 10) <= 5);
  const outOfStock = data.products.filter((p) => (p.stockQuantity ?? 10) <= 0);
  const sortedBySold = [...data.products]
    .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0))
    .slice(0, 5);

  const uniqueCustomers = new Set(
    data.orders.map((o) => o.customer?.email ?? o.customerEmail ?? "").filter(Boolean)
  ).size;

  const stats = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, sub: `${formatCurrency(monthRevenue)} this month` },
    { label: "Total Orders", value: String(data.orders.length), icon: ShoppingBag, sub: `${thisMonthOrders.length} this month` },
    { label: "Customers", value: String(uniqueCustomers), icon: Users, sub: "unique buyers" },
    { label: "Products", value: String(data.products.length), icon: Package, sub: `${outOfStock.length} out of stock` },
  ];

  const recentOrders = data.orders.slice(0, 6);

  return (
    <main className="urbanix-container urbanix-section">
      <section className="mb-6 rounded-2xl border bg-card p-6">
        <Badge className="mb-4">Admin dashboard</Badge>
        <h1 className="text-3xl font-extrabold">Urbanix Control Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage products, stock, orders, and settings from one workspace.
        </p>
      </section>

      {/* Analytics stats */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-extrabold">{stat.value}</div>
                    <div className="text-xs font-semibold text-muted-foreground">{stat.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground/70">{stat.sub}</div>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Stock alerts */}
      {lowStockProducts.length > 0 && (
        <section className="mt-4">
          <div className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <AlertTriangle className="size-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-bold text-destructive">
                {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} low on stock
              </p>
              <p className="text-xs text-muted-foreground">
                {lowStockProducts.map((p) => p.name).join(", ")}
              </p>
            </div>
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/inventory">
              Manage Stock
            </Link>
          </div>
        </section>
      )}

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle>Recent Orders</CardTitle>
            <Link className="text-xs font-semibold text-primary" href="/orders">View all</Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {recentOrders.map((order) => (
              <Link
                className="grid gap-1 rounded-xl bg-muted/60 p-3 hover:bg-muted md:grid-cols-[1fr_100px_90px]"
                href={`/orders/${order.id}`}
                key={order.id}
              >
                <div>
                  <div className="text-sm font-bold">{order.customer?.fullName ?? order.customerName ?? "Customer"}</div>
                  <div className="text-xs text-muted-foreground">{order.orderNumber}</div>
                </div>
                <Badge className="w-fit" variant={order.orderStatus === "completed" ? "secondary" : "outline"}>
                  {order.orderStatus}
                </Badge>
                <div className="text-sm font-bold text-accent">
                  {formatCurrency(order.totals?.total ?? order.totalAmount ?? 0)}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Best Sellers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-4" /> Best Sellers
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {sortedBySold.map((product, i) => (
                <div className="flex items-center gap-2" key={product.id}>
                  <span className="w-4 text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.sold ?? 0} sold</div>
                  </div>
                  <div className="text-xs font-bold text-accent">{formatCurrency(product.price)}</div>
                </div>
              ))}
              {sortedBySold.length === 0 && <p className="text-sm text-muted-foreground">No sales data.</p>}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link className={buttonVariants({ size: "sm" })} href="/products/new">Add Product</Link>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/orders">Review Orders</Link>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/inventory">Update Stock</Link>
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/customers">View Customers</Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
