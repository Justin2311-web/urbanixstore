import { notFound } from "next/navigation";
import { formatCurrency } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveOrderStatuses } from "@/lib/admin-actions";
import { Field, SaveButton, Select } from "@/components/admin-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orders } = await readUrbanixStoreDataAsync({ includeOrders: true });
  const order = orders.find((item) => item.id === id);

  if (!order) {
    notFound();
  }

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{order.customer.fullName} · {order.customer.phone}</p>
        </div>
        <a className="text-sm font-bold text-success" href={`https://wa.me/${order.customer.phone}`} target="_blank">Contact on WhatsApp</a>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {order.items.map((item) => (
              <div className="grid gap-2 rounded-xl bg-muted/60 p-3 md:grid-cols-[1fr_70px_100px]" key={item.product.id}>
                <div className="font-bold">{item.product.name}</div>
                <div>x{item.quantity}</div>
                <div>{formatCurrency(item.lineTotal)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex gap-2">
              <Badge variant="outline">{order.paymentStatus}</Badge>
              <Badge variant="secondary">{order.orderStatus}</Badge>
            </div>
            <form action={saveOrderStatuses} className="grid gap-3">
              <input name="orderId" type="hidden" value={order.id} />
              <Field label="Order status">
                <Select defaultValue={order.orderStatus} name="orderStatus">
                  {["pending", "processing", "shipped", "completed", "cancelled"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Payment status">
                <Select defaultValue={order.paymentStatus} name="paymentStatus">
                  {["pending", "unpaid", "paid", "failed", "refunded"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </Field>
              <SaveButton label="Update Status" />
            </form>
            <div className="border-t pt-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><b>{formatCurrency(order.totals.subtotal)}</b></div>
              <div className="flex justify-between"><span>Shipping</span><b>{formatCurrency(order.totals.shipping)}</b></div>
              <div className="flex justify-between text-base"><span>Total</span><b>{formatCurrency(order.totals.total)}</b></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
