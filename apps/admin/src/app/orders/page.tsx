export const dynamic = "force-dynamic";

import Link from "next/link";
import { formatCurrency } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/admin-form";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; paymentStatus?: string; orderStatus?: string }>;
}) {
  const params = await searchParams;
  let orders: Awaited<ReturnType<typeof readUrbanixStoreDataAsync>>["orders"] = [];
  let settings: Awaited<ReturnType<typeof readUrbanixStoreDataAsync>>["settings"];
  try {
    const data = await readUrbanixStoreDataAsync({ includeOrders: true });
    orders = data.orders;
    settings = data.settings;
  } catch (error) {
    console.error("[Admin] Orders page data error:", error);
    const { defaultUrbanixStoreData } = await import("@ecommerce/shared");
    settings = defaultUrbanixStoreData.settings;
  }
  const query = (params.q ?? "").trim().toLowerCase();
  const visibleOrders = orders.filter((order) => {
    const searchMatches =
      !query ||
      order.orderNumber.toLowerCase().includes(query) ||
      order.customer.fullName.toLowerCase().includes(query) ||
      order.customer.phone.toLowerCase().includes(query);
    const paymentMatches = !params.paymentStatus || order.paymentStatus === params.paymentStatus;
    const orderMatches = !params.orderStatus || order.orderStatus === params.orderStatus;

    return searchMatches && paymentMatches && orderMatches;
  });

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review payment status, fulfillment status, and customer details.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]" action="/orders">
            <Input defaultValue={params.q} name="q" placeholder="Search orders..." />
            <Select defaultValue={params.paymentStatus ?? ""} name="paymentStatus">
              <option value="">All payment</option>
              {["pending", "unpaid", "paid", "failed", "refunded"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
            <Select defaultValue={params.orderStatus ?? ""} name="orderStatus">
              <option value="">All orders</option>
              {["pending", "processing", "shipped", "completed", "cancelled"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
            <Button type="submit">Filter</Button>
          </form>
          {visibleOrders.map((order) => (
            <div className="grid gap-3 rounded-xl bg-muted/60 p-4 md:grid-cols-[1fr_1fr_120px_120px_110px_90px]" key={order.id}>
              <div className="font-bold">{order.orderNumber}</div>
              <div className="text-sm text-muted-foreground">{order.customer.fullName}</div>
              <Badge variant={order.paymentStatus === "paid" ? "secondary" : "outline"}>{order.paymentStatus}</Badge>
              <Badge variant={order.orderStatus === "completed" ? "secondary" : "outline"}>{order.orderStatus}</Badge>
              <div className="font-bold">{formatCurrency(order.totals.total)}</div>
              <Link className="text-sm font-bold text-primary" href={`/orders/${order.id}`}>View</Link>
              <a className="text-sm font-bold text-success md:col-start-6" href={`https://wa.me/${order.customer.phone || settings.whatsappNumber}`} target="_blank">WhatsApp</a>
            </div>
          ))}
          {visibleOrders.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No matching orders yet. Storefront checkout will add orders here.</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
