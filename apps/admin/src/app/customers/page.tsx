export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  total_amount: number;
  created_at: string;
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  // Derive customers from orders — group by phone number
  let query = sb
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, customer_email, total_amount, created_at")
    .order("created_at", { ascending: false });

  if (params.q) {
    query = query.or(
      `customer_name.ilike.%${params.q}%,customer_phone.ilike.%${params.q}%,customer_email.ilike.%${params.q}%`
    );
  }

  const { data: ordersRaw } = await query;
  const orders = ordersRaw as OrderRow[] | null;

  // Group by phone number to create "customers"
  const customerMap = new Map<
    string,
    {
      name: string;
      phone: string;
      email: string | null;
      orderCount: number;
      totalSpent: number;
      lastOrder: string;
      latestOrderId: string;
    }
  >();

  for (const order of orders ?? []) {
    const key = order.customer_phone;
    const existing = customerMap.get(key);

    if (existing) {
      existing.orderCount++;
      existing.totalSpent += Number(order.total_amount);
      if (order.created_at > existing.lastOrder) {
        existing.lastOrder = order.created_at;
        existing.latestOrderId = order.id;
        if (order.customer_email) existing.email = order.customer_email;
      }
    } else {
      customerMap.set(key, {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        orderCount: 1,
        totalSpent: Number(order.total_amount),
        lastOrder: order.created_at,
        latestOrderId: order.id,
      });
    }
  }

  const customers = [...customerMap.values()].sort(
    (a, b) => new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime()
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <span className="text-sm text-gray-500">{customers.length} unique customers</span>
      </div>

      <form className="mb-4">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search by name, phone, or email…"
          className="field-input max-w-xs"
        />
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="table-th">Customer</th>
                <th className="table-th">Phone</th>
                <th className="table-th">Email</th>
                <th className="table-th">Orders</th>
                <th className="table-th">Total Spent</th>
                <th className="table-th">Last Order</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                    No customers found.
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.phone} className="hover:bg-gray-50">
                  <td className="table-td font-medium text-gray-900">{c.name}</td>
                  <td className="table-td font-mono text-sm">{c.phone}</td>
                  <td className="table-td text-gray-500 text-xs">{c.email ?? "—"}</td>
                  <td className="table-td text-center">
                    <span className="badge-shipped">{c.orderCount}</span>
                  </td>
                  <td className="table-td font-semibold">{formatCurrency(c.totalSpent)}</td>
                  <td className="table-td text-gray-500 text-xs">{formatDate(c.lastOrder)}</td>
                  <td className="table-td text-right">
                    <Link
                      href={`/orders/${c.latestOrderId}`}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Latest Order
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
