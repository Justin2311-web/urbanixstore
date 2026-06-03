export const dynamic = "force-dynamic";

import type { Database } from "@ecommerce/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { PaymentReceiptViewer } from "@/components/payment-receipt-viewer";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateOrderStatus } from "@/lib/actions";
import { getShippingRegionLabel } from "@ecommerce/shared";

type OrderDetailRow = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: Array<Database["public"]["Tables"]["order_items"]["Row"]>;
};

const ORDER_STATUSES = ["pending", "processing", "shipped", "completed", "cancelled"] as const;
const PAYMENT_STATUSES = ["pending", "unpaid", "paid", "failed", "refunded"] as const;

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = createAdminClient();

  const { data: orderRaw } = await sb
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  const order = orderRaw as OrderDetailRow | null;
  if (!order) notFound();

  const address = (order.shipping_address ?? {}) as Record<string, string>;

  const hasReceipt = Boolean(order.receipt_path || order.receipt_public_url_legacy || order.receipt_url);
  const receiptViewUrl: string | null = null;
  const receiptError: string | null = null;
  const receiptIsLegacy = false;
  const receiptIsPdf = false;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="mb-1 text-sm text-gray-500">
            <Link href="/orders" className="hover:underline">Orders</Link>
            {" › "}{order.order_number}
          </div>
          <h1 className="page-title">Order {order.order_number}</h1>
          <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
        </div>
      </div>

      <Flash saved={sp.saved} saveError={sp.saveError} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order items */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="font-semibold text-gray-800">Order Items</h2>
            </div>
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th text-right">Qty</th>
                  <th className="table-th text-right">Unit Price</th>
                  <th className="table-th text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(order.order_items ?? []).map((item) => {
                  const variants = item.selected_variants as Record<string, string> | null;
                  return (
                    <tr key={item.id}>
                      <td className="table-td">
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs font-mono text-gray-400">{item.product_sku}</p>
                        {variants && Object.keys(variants).length > 0 && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {Object.entries(variants).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="table-td text-right">{item.quantity}</td>
                      <td className="table-td text-right">{formatCurrency(Number(item.unit_price))}</td>
                      <td className="table-td text-right font-semibold">{formatCurrency(Number(item.total_price))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={3} className="table-td text-right font-medium text-gray-500">Subtotal</td>
                  <td className="table-td text-right font-semibold">{formatCurrency(Number(order.subtotal))}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="table-td text-right font-medium text-gray-500">Shipping</td>
                  <td className="table-td text-right font-semibold">{formatCurrency(Number(order.shipping_fee))}</td>
                </tr>
                {order.shipping_region && (
                  <tr>
                    <td colSpan={3} className="table-td text-right font-medium text-gray-500">Shipping Region</td>
                    <td className="table-td text-right font-semibold">
                      {getShippingRegionLabel(order.shipping_region)}
                    </td>
                  </tr>
                )}
                {order.is_free_shipping_applied && (
                  <tr>
                    <td colSpan={3} className="table-td text-right font-medium text-green-600">Free Shipping</td>
                    <td className="table-td text-right font-semibold text-green-600">
                      Applied over {formatCurrency(Number(order.free_shipping_threshold ?? 0))}
                    </td>
                  </tr>
                )}
                {Number(order.discount_amount) > 0 && (
                  <tr>
                    <td colSpan={3} className="table-td text-right font-medium text-green-600">Discount</td>
                    <td className="table-td text-right font-semibold text-green-600">
                      -{formatCurrency(Number(order.discount_amount))}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="table-td text-right font-bold text-gray-900">Total</td>
                  <td className="table-td text-right text-lg font-bold text-[#0e5c56]">
                    {formatCurrency(Number(order.total_amount))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Shipping address */}
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-800">Shipping Address</h2>
            <div className="text-sm text-gray-700 space-y-0.5">
              <p className="font-medium">{order.customer_name}</p>
              <p>{order.customer_phone}</p>
              {order.customer_email && <p>{order.customer_email}</p>}
              {address.addressLine1 && <p>{address.addressLine1}</p>}
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>
                {[address.city, address.state, address.postcode].filter(Boolean).join(", ")}
              </p>
              {address.country && <p>{address.country}</p>}
              {order.delivery_note && (
                <p className="mt-2 rounded bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  📝 {order.delivery_note}
                </p>
              )}
            </div>
          </div>

          {/* Payment receipt */}
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-800">Payment Receipt</h2>
            <PaymentReceiptViewer hasReceipt={hasReceipt} orderId={order.id} />
          </div>
          {false && (receiptViewUrl || receiptError) && (
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-gray-800">Payment Receipt</h2>
              {receiptIsLegacy && (
                <p className="mb-3 rounded bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                  Legacy receipt link (stored before private-bucket migration).
                </p>
              )}
              {receiptError ? (
                <p className="text-sm text-red-700">{receiptError}</p>
              ) : receiptIsPdf ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <a
                    href={receiptViewUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[#0e5c56] hover:underline"
                  >
                    View PDF Receipt
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptViewUrl!}
                    alt="Payment receipt"
                    className="max-h-72 w-auto rounded-lg border border-gray-200 object-contain"
                  />
                  <a
                    href={receiptViewUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs font-semibold text-[#0e5c56] hover:underline"
                  >
                    Open full image ↗
                  </a>
                </div>
              )}
              {!receiptIsLegacy && receiptViewUrl && !receiptError && (
                <p className="mt-2 text-[10px] text-gray-500">
                  Signed link expires in 10 minutes. Refresh the page for a new link.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Status panel */}
        <div className="space-y-5">
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Update Status</h2>
            <form action={updateOrderStatus} className="space-y-4">
              <input type="hidden" name="id" value={order.id} />

              <div>
                <label className="field-label">Order Status</label>
                <select
                  name="order_status"
                  className="field-select"
                  defaultValue={order.order_status}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Payment Status</label>
                <select
                  name="payment_status"
                  className="field-select"
                  defaultValue={order.payment_status}
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Courier / Shipping Provider</label>
                <input
                  name="courier"
                  className="field-input"
                  defaultValue={order.courier ?? ""}
                  placeholder="e.g. J&T Express, Pos Laju"
                />
              </div>

              <div>
                <label className="field-label">Tracking Number</label>
                <input
                  name="tracking_number"
                  className="field-input"
                  defaultValue={order.tracking_number ?? ""}
                  placeholder="Enter tracking number"
                />
              </div>

              <button type="submit" className="btn-primary w-full justify-center">
                Update Status
              </button>
            </form>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-800">Payment Info</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Method</dt>
                <dd className="font-medium capitalize">
                  {(order as Record<string, unknown>).payment_method_type
                    ? String((order as Record<string, unknown>).payment_method_type)
                    : order.payment_method}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Payment Status</dt>
                <dd>
                  <span className={
                    order.payment_status === "paid" ? "badge-paid" :
                    order.payment_status === "failed" ? "badge-cancelled" :
                    "badge-pending"
                  }>
                    {order.payment_status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Order Status</dt>
                <dd>
                  <span className={
                    order.order_status === "completed" ? "badge-paid" :
                    order.order_status === "cancelled" ? "badge-cancelled" :
                    order.order_status === "shipped" ? "badge-shipped" :
                    "badge-pending"
                  }>
                    {order.order_status}
                  </span>
                </dd>
              </div>
              {hasReceipt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Receipt</dt>
                  <dd className="text-xs font-semibold text-[#0e5c56]">Uploaded</dd>
                </div>
              )}
              {false && receiptViewUrl && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Receipt</dt>
                  <dd>
                    <a
                      href="#"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#0e5c56] hover:underline"
                    >
                      View ↗
                    </a>
                  </dd>
                </div>
              )}
              {order.courier && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Courier</dt>
                  <dd className="font-medium">{order.courier}</dd>
                </div>
              )}
              {order.tracking_number && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tracking No.</dt>
                  <dd className="font-mono text-xs font-medium">{order.tracking_number}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
