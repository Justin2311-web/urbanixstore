export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Flash } from "@/components/flash";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  subtotal: number;
  total_amount: number;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
};

const ORDER_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"] as const;
const PAYMENT_STATUSES = ["pending", "unpaid", "paid", "failed", "refunded"] as const;

const statusColors: Record<string, string> = {
  pending: "badge-pending",
  processing: "badge-shipped",
  shipped: "badge-shipped",
  completed: "badge-paid",
  cancelled: "badge-cancelled",
};

const paymentColors: Record<string, string> = {
  paid: "badge-paid",
  unpaid: "badge-inactive",
  pending: "badge-pending",
  failed: "badge-cancelled",
  refunded: "badge-inactive",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    saveError?: string;
    status?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  let query = sb
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, customer_email, subtotal, total_amount, order_status, payment_status, payment_method, created_at")
    .order("created_at", { ascending: false });

  if (params.status && params.status !== "all") {
    query = query.eq("order_status", params.status);
  }
  if (params.q) {
    query = query.or(`order_number.ilike.%${params.q}%,customer_name.ilike.%${params.q}%,customer_phone.ilike.%${params.q}%`);
  }

  const { data: ordersRaw } = await query;
  const orders = ordersRaw as OrderRow[] | null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        <span className="text-sm text-gray-500">{(orders ?? []).length} orders</span>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      {/* Filters */}
      <form className="mb-4 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search order # or customer…"
          className="field-input max-w-xs"
        />
        <select name="status" defaultValue={params.status ?? "all"} className="field-select w-40">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filter</button>
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="table-th">Order #</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Date</th>
                <th className="table-th">Total</th>
                <th className="table-th">Order Status</th>
                <th className="table-th">Payment</th>
                <th className="table-th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="table-td text-center text-gray-400 py-10">
                    No orders found.
                  </td>
                </tr>
              )}
              {(orders ?? []).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="table-td font-mono text-sm font-semibold">
                    {order.order_number}
                  </td>
                  <td className="table-td">
                    <p className="font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{order.customer_phone}</p>
                  </td>
                  <td className="table-td text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                  <td className="table-td font-semibold">{formatCurrency(Number(order.total_amount))}</td>
                  <td className="table-td">
                    <span className={statusColors[order.order_status] ?? "badge-inactive"}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className={paymentColors[order.payment_status] ?? "badge-inactive"}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="table-td text-right">
                    <Link
                      href={`/orders/${order.id}`}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      View
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
