export const dynamic = "force-dynamic";

import { formatCurrency } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CustomerSummary = {
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderStatus: string;
};

export default async function CustomersPage() {
  let data;
  try {
    data = await readUrbanixStoreDataAsync({ includeOrders: true });
  } catch {
    data = (await import("@ecommerce/shared")).defaultUrbanixStoreData;
  }

  // Derive customer list from orders
  const customerMap = new Map<string, CustomerSummary>();

  for (const order of data.orders) {
    const email = order.customer?.email ?? order.customerEmail ?? "";
    const phone = order.customer?.phone ?? order.customerPhone ?? "";
    const name = order.customer?.fullName ?? order.customerName ?? "Unknown";
    const key = email || phone || name;

    if (!key) continue;

    const existing = customerMap.get(key);
    const orderTotal = order.totals?.total ?? order.totalAmount ?? 0;

    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += orderTotal;
      if (order.createdAt > existing.lastOrderDate) {
        existing.lastOrderDate = order.createdAt;
        existing.lastOrderStatus = order.orderStatus;
      }
    } else {
      customerMap.set(key, {
        name,
        email,
        phone,
        orderCount: 1,
        totalSpent: orderTotal,
        lastOrderDate: order.createdAt,
        lastOrderStatus: order.orderStatus,
      });
    }
  }

  const customers = [...customerMap.values()].sort(
    (a, b) => b.totalSpent - a.totalSpent
  );

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {customers.length} unique customer{customers.length !== 1 ? "s" : ""} derived from order history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customers.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No customer data yet. Orders will populate this list.</p>
          )}
          <div className="overflow-hidden">
            {customers.map((customer, i) => (
              <div
                className="grid gap-3 border-b bg-card px-6 py-4 last:border-b-0 md:grid-cols-[1fr_120px_120px_100px_80px]"
                key={i}
              >
                <div>
                  <div className="font-bold">{customer.name}</div>
                  <div className="text-xs text-muted-foreground">{customer.email || customer.phone}</div>
                  {customer.email && customer.phone && (
                    <div className="text-xs text-muted-foreground">{customer.phone}</div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-sm font-bold">{customer.orderCount}</div>
                  <div className="text-xs text-muted-foreground">orders</div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="text-sm font-bold text-accent">{formatCurrency(customer.totalSpent)}</div>
                  <div className="text-xs text-muted-foreground">total spent</div>
                </div>
                <Badge
                  className="h-fit w-fit self-center"
                  variant={customer.lastOrderStatus === "completed" ? "secondary" : "outline"}
                >
                  {customer.lastOrderStatus}
                </Badge>
                {customer.phone && (
                  <a
                    className="self-center text-sm font-bold text-success hover:underline"
                    href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
