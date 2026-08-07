export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  order_status: string;
  created_at: string;
};

type RevenueRow = { total_amount: number };

async function getStats() {
  try {
    const sb = createAdminClient();
    const [
      { count: productCount },
      { count: orderCount },
      { count: categoryCount },
      { data: recentOrdersRaw },
      { data: revenueRaw },
    ] = await Promise.all([
      sb.from("products").select("*", { count: "exact", head: true }),
      sb.from("orders").select("*", { count: "exact", head: true }),
      sb.from("categories").select("*", { count: "exact", head: true }),
      sb.from("orders").select("id, order_number, customer_name, total_amount, order_status, created_at").order("created_at", { ascending: false }).limit(5),
      sb.from("orders").select("total_amount").in("payment_status", ["paid"]),
    ]);

    const recentOrders = (recentOrdersRaw as RecentOrder[] | null) ?? [];
    const revenue = (revenueRaw as RevenueRow[] | null) ?? [];

    const totalRevenue = revenue.reduce(
      (sum, o) => sum + Number(o.total_amount),
      0
    );

    return {
      productCount: productCount ?? 0,
      orderCount: orderCount ?? 0,
      categoryCount: categoryCount ?? 0,
      totalRevenue,
      recentOrders,
    };
  } catch (e) {
    console.error("[Admin] Dashboard stats error:", e);
    return {
      productCount: 0,
      orderCount: 0,
      categoryCount: 0,
      totalRevenue: 0,
      recentOrders: [],
    };
  }
}

const statusColors: Record<string, string> = {
  pending: "badge-pending",
  processing: "badge-shipped",
  shipped: "badge-shipped",
  completed: "badge-paid",
  cancelled: "badge-cancelled",
};

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total Products", value: stats.productCount, href: "/products", icon: "📦" },
    { label: "Total Orders", value: stats.orderCount, href: "/orders", icon: "🛒" },
    { label: "Categories", value: stats.categoryCount, href: "/categories", icon: "🗂️" },
    { label: "Paid Revenue", value: formatCurrency(stats.totalRevenue), href: "/orders", icon: "💰" },
  ];

  const quickLinks = [
    { href: "/products/new", label: "Add Product", icon: "➕" },
    { href: "/categories", label: "Manage Categories", icon: "🗂️" },
    { href: "/promotions", label: "Promo Codes", icon: "🎯" },
    { href: "/inventory", label: "Update Inventory", icon: "🏷️" },
    { href: "/homepage", label: "Edit Homepage", icon: "🏠" },
    { href: "/settings", label: "Store Settings", icon: "⚙️" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="text-sm text-gray-500">Welcome back!</span>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-xs font-medium text-gray-400">{card.label}</span>
              </div>
              <div className="mt-3 text-2xl font-bold text-gray-900">
                {card.value}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-xs font-medium text-[#0e5c56] hover:underline">
              View all →
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stats.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-xs text-gray-500">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(Number(order.total_amount))}</p>
                      <span className={statusColors[order.order_status] ?? "badge-inactive"}>
                        {order.order_status}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick links */}
        <div className="card">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-px bg-gray-100">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 bg-white px-4 py-4 hover:bg-[#e8f3ef] transition-colors"
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
