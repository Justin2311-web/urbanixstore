export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  deleteFinanceExpense,
  deleteFinanceRevenue,
  saveFinanceExpense,
  saveFinanceRevenue,
} from "@/lib/actions";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Flash } from "@/components/flash";

const EXPENSE_CATEGORIES = [
  "Product Cost",
  "Shipping / Logistics",
  "Advertising",
  "Packaging",
  "Platform Fee",
  "Software / Tools",
  "SSM / Business Registration",
  "Sample / Testing Product",
  "Office / Misc",
  "Other",
];

const REVENUE_SOURCES = ["Website", "Shopee", "Lazada", "TikTok Shop", "Manual / Offline", "Other"];
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "E-wallet", "Online Banking", "Other"];
const INCLUDED_ORDER_STATUSES = ["processing", "shipped", "completed"];

type SearchParams = {
  category?: string;
  editExpense?: string;
  editRevenue?: string;
  from?: string;
  month?: string;
  paymentMethod?: string;
  preset?: string;
  saveError?: string;
  saved?: string;
  source?: string;
  to?: string;
  year?: string;
};

type ExpenseRow = {
  amount: number;
  attachment_url: string | null;
  category: string;
  currency: string;
  expense_date: string;
  id: string;
  notes: string | null;
  payment_method: string | null;
  title: string;
};

type RevenueRow = {
  amount: number;
  currency: string;
  id: string;
  notes: string | null;
  related_order_id: string | null;
  revenue_date: string;
  source: string;
  title: string;
};

type OrderRevenueRow = {
  created_at: string;
  id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay() || 7;
  next.setDate(next.getDate() - day + 1);
  return next;
}

function resolveDateRange(params: SearchParams) {
  const now = new Date();
  const preset = params.preset ?? "this-month";
  const year = Number(params.year || now.getFullYear());
  const month = Number(params.month || now.getMonth() + 1);

  if (preset === "today") return { from: isoDate(now), to: isoDate(now), preset };
  if (preset === "this-week") {
    const start = startOfWeek(now);
    return { from: isoDate(start), to: isoDate(addDays(start, 6)), preset };
  }
  if (preset === "last-month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: isoDate(start), to: isoDate(end), preset };
  }
  if (preset === "this-year") {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31`, preset };
  }
  if (preset === "custom") {
    return {
      from: params.from || isoDate(new Date(year, month - 1, 1)),
      to: params.to || isoDate(new Date(year, month, 0)),
      preset,
    };
  }

  return {
    from: isoDate(new Date(year, month - 1, 1)),
    to: isoDate(new Date(year, month, 0)),
    preset: "this-month",
  };
}

function sum(values: Array<{ amount: number }>) {
  return values.reduce((total, item) => total + Number(item.amount || 0), 0);
}

function groupSum<T>(items: T[], keyFn: (item: T) => string, amountFn: (item: T) => number) {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + amountFn(item));
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv({
  expenses,
  from,
  manualRevenue,
  summary,
  to,
  websiteRevenue,
}: {
  expenses: ExpenseRow[];
  from: string;
  manualRevenue: RevenueRow[];
  summary: Record<string, number | string>;
  to: string;
  websiteRevenue: OrderRevenueRow[];
}) {
  const lines = [
    ["Urbanix Financial Report"],
    ["Date range", from, to],
    [],
    ["Summary"],
    ...Object.entries(summary).map(([key, value]) => [key, value]),
    [],
    ["Revenue"],
    ["Date", "Title", "Source", "Amount", "Related Order", "Notes"],
    ...websiteRevenue.map((order) => [
      order.created_at.slice(0, 10),
      `Website order ${order.order_number}`,
      "Website",
      order.total_amount,
      order.order_number,
      "",
    ]),
    ...manualRevenue.map((item) => [
      item.revenue_date,
      item.title,
      item.source,
      item.amount,
      item.related_order_id ?? "",
      item.notes ?? "",
    ]),
    [],
    ["Expenses"],
    ["Date", "Title", "Category", "Amount", "Payment Method", "Notes", "Attachment"],
    ...expenses.map((item) => [
      item.expense_date,
      item.title,
      item.category,
      item.amount,
      item.payment_method ?? "",
      item.notes ?? "",
      item.attachment_url ?? "",
    ]),
  ];

  return `data:text/csv;charset=utf-8,${encodeURIComponent(
    lines.map((row) => row.map(csvEscape).join(",")).join("\n")
  )}`;
}

function BarChart({
  rows,
  title,
}: {
  rows: Array<{ expense?: number; label: string; revenue?: number; value?: number }>;
  title: string;
}) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.value ?? 0, row.revenue ?? 0, row.expense ?? 0]));

  return (
    <div className="card p-5">
      <h2 className="mb-4 font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="py-6 text-sm text-gray-400">No data for this range.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-xs font-semibold text-gray-500">
                <span>{row.label}</span>
                <span>
                  {row.value !== undefined ? formatCurrency(row.value) : null}
                  {row.revenue !== undefined ? `Rev ${formatCurrency(row.revenue)}` : null}
                  {row.expense !== undefined ? ` / Exp ${formatCurrency(row.expense)}` : null}
                </span>
              </div>
              {row.value !== undefined ? (
                <div className="h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-[#0e5c56]" style={{ width: `${Math.max(3, (row.value / max) * 100)}%` }} />
                </div>
              ) : (
                <div className="grid gap-1">
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${Math.max(3, ((row.revenue ?? 0) / max) * 100)}%` }} />
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.max(3, ((row.expense ?? 0) / max) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default async function FinancialReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const range = resolveDateRange(params);
  const sb = createAdminClient();

  let expenseQuery = sb
    .from("finance_expenses")
    .select("*")
    .gte("expense_date", range.from)
    .lte("expense_date", range.to)
    .order("expense_date", { ascending: false });
  if (params.category && params.category !== "all") expenseQuery = expenseQuery.eq("category", params.category);
  if (params.paymentMethod && params.paymentMethod !== "all") expenseQuery = expenseQuery.eq("payment_method", params.paymentMethod);

  let revenueQuery = sb
    .from("finance_revenue")
    .select("*")
    .gte("revenue_date", range.from)
    .lte("revenue_date", range.to)
    .order("revenue_date", { ascending: false });
  if (params.source && params.source !== "all") revenueQuery = revenueQuery.eq("source", params.source);

  const [
    { data: expensesRaw, error: expensesError },
    { data: revenueRaw, error: revenueError },
    { data: ordersRaw },
  ] = await Promise.all([
    expenseQuery,
    revenueQuery,
    sb
      .from("orders")
      .select("id, order_number, total_amount, payment_status, order_status, created_at")
      .gte("created_at", `${range.from}T00:00:00.000Z`)
      .lte("created_at", `${range.to}T23:59:59.999Z`)
      .eq("payment_status", "paid")
      .in("order_status", INCLUDED_ORDER_STATUSES)
      .order("created_at", { ascending: false }),
  ]);

  const expenses = (expensesRaw as ExpenseRow[] | null) ?? [];
  const revenue = (revenueRaw as RevenueRow[] | null) ?? [];
  const migrationMissing = expensesError || revenueError;
  const websiteOrders = (ordersRaw as OrderRevenueRow[] | null) ?? [];
  const websiteOrderIds = new Set(websiteOrders.map((order) => order.id));
  const manualRevenue = revenue.filter((item) => !item.related_order_id || !websiteOrderIds.has(item.related_order_id));
  const websiteRevenueTotal = websiteOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0);
  const manualRevenueTotal = sum(manualRevenue);
  const totalRevenue = websiteRevenueTotal + manualRevenueTotal;
  const totalExpenses = sum(expenses);
  const grossProfit = totalRevenue - expenses.filter((item) => item.category === "Product Cost").reduce((total, item) => total + Number(item.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const currentMonth = isoDate(new Date()).slice(0, 7);
  const monthlyRevenue = [
    ...websiteOrders.filter((order) => monthKey(order.created_at) === currentMonth).map((order) => ({ amount: Number(order.total_amount) })),
    ...manualRevenue.filter((item) => monthKey(item.revenue_date) === currentMonth),
  ].reduce((total, item) => total + Number(item.amount || 0), 0);
  const monthlyExpenses = expenses.filter((item) => monthKey(item.expense_date) === currentMonth).reduce((total, item) => total + Number(item.amount || 0), 0);
  const revenueBySource = groupSum(
    [
      ...websiteOrders.map((order) => ({ amount: Number(order.total_amount || 0), source: "Website" })),
      ...manualRevenue,
    ],
    (item) => item.source,
    (item) => Number(item.amount || 0)
  );
  const expensesByCategory = groupSum(expenses, (item) => item.category, (item) => Number(item.amount || 0));
  const monthLabels = Array.from(
    new Set([
      ...websiteOrders.map((order) => monthKey(order.created_at)),
      ...manualRevenue.map((item) => monthKey(item.revenue_date)),
      ...expenses.map((item) => monthKey(item.expense_date)),
    ])
  ).sort();
  const revenueExpenseRows = monthLabels.map((label) => ({
    expense: expenses.filter((item) => monthKey(item.expense_date) === label).reduce((total, item) => total + Number(item.amount || 0), 0),
    label,
    revenue:
      websiteOrders.filter((order) => monthKey(order.created_at) === label).reduce((total, order) => total + Number(order.total_amount || 0), 0) +
      manualRevenue.filter((item) => monthKey(item.revenue_date) === label).reduce((total, item) => total + Number(item.amount || 0), 0),
  }));
  const netRows = revenueExpenseRows.map((row) => ({ label: row.label, value: row.revenue - row.expense }));
  const editExpense = expenses.find((item) => item.id === params.editExpense);
  const editRevenue = revenue.find((item) => item.id === params.editRevenue);
  const summary = {
    "Total Revenue": totalRevenue,
    "Total Expenses": totalExpenses,
    "Gross Profit": grossProfit,
    "Net Profit": netProfit,
    "Profit Margin": `${profitMargin.toFixed(1)}%`,
  };
  const csvHref = buildCsv({ expenses, from: range.from, manualRevenue, summary, to: range.to, websiteRevenue: websiteOrders });

  const cards = [
    ["Total Revenue", totalRevenue, "text-emerald-700"],
    ["Total Expenses", totalExpenses, "text-red-600"],
    ["Gross Profit", grossProfit, grossProfit >= 0 ? "text-emerald-700" : "text-red-600"],
    ["Net Profit", netProfit, netProfit > 0 ? "text-emerald-700" : netProfit < 0 ? "text-red-600" : "text-gray-700"],
    ["Profit Margin", `${profitMargin.toFixed(1)}%`, profitMargin > 0 ? "text-emerald-700" : profitMargin < 0 ? "text-red-600" : "text-gray-700"],
    ["Monthly Revenue", monthlyRevenue, "text-emerald-700"],
    ["Monthly Expenses", monthlyExpenses, "text-red-600"],
    ["Monthly Net Profit", monthlyRevenue - monthlyExpenses, monthlyRevenue - monthlyExpenses >= 0 ? "text-emerald-700" : "text-red-600"],
    ["Best Revenue Source", revenueBySource[0]?.[0] ?? "No data", "text-gray-900"],
    ["Biggest Expense", expensesByCategory[0]?.[0] ?? "No data", "text-gray-900"],
  ];

  return (
    <div>
      <div className="page-header gap-3">
        <div>
          <h1 className="page-title">Financial Report</h1>
          <p className="text-sm text-gray-500">Track revenue, expenses, and profit for Urbanix Store.</p>
        </div>
        <a className="btn-secondary" download={`urbanix-financial-report-${range.from}-to-${range.to}.csv`} href={csvHref}>
          Export CSV
        </a>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      {migrationMissing ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Financial Report database tables are not available yet. Apply migration
          <span className="font-mono"> 20260524015601_admin_financial_report.sql </span>
          to enable add, edit, delete, charts, and saved records.
        </div>
      ) : null}

      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-7">
        <select className="field-select" name="preset" defaultValue={range.preset}>
          <option value="today">Today</option>
          <option value="this-week">This Week</option>
          <option value="this-month">This Month</option>
          <option value="last-month">Last Month</option>
          <option value="this-year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
        <input className="field-input" name="from" type="date" defaultValue={range.from} />
        <input className="field-input" name="to" type="date" defaultValue={range.to} />
        <select className="field-select" name="category" defaultValue={params.category ?? "all"}>
          <option value="all">All categories</option>
          {EXPENSE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="field-select" name="source" defaultValue={params.source ?? "all"}>
          <option value="all">All sources</option>
          {REVENUE_SOURCES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="field-select" name="paymentMethod" defaultValue={params.paymentMethod ?? "all"}>
          <option value="all">All payment methods</option>
          {PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="btn-primary justify-center" type="submit">Filter</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, color]) => (
          <div className="card p-4" key={label}>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
            <p className={`mt-2 text-2xl font-black ${color}`}>
              {typeof value === "number" ? formatCurrency(value) : value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <BarChart title="Revenue vs Expenses by Month" rows={revenueExpenseRows} />
        <BarChart title="Net Profit Trend" rows={netRows} />
        <BarChart title="Expense Breakdown by Category" rows={expensesByCategory.map(([label, value]) => ({ label, value }))} />
        <BarChart title="Revenue Breakdown by Source" rows={revenueBySource.map(([label, value]) => ({ label, value }))} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-gray-900">{editExpense ? "Edit Expense" : "Add Expense"}</h2>
          <form action={saveFinanceExpense} className="grid gap-3">
            <input name="id" type="hidden" value={editExpense?.id ?? ""} />
            <input className="field-input" name="title" placeholder="Title" required defaultValue={editExpense?.title ?? ""} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="field-select" name="category" required defaultValue={editExpense?.category ?? ""}>
                <option value="">Category</option>
                {EXPENSE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
              </select>
              <input className="field-input" min="0" name="amount" placeholder="Amount" required step="0.01" type="number" defaultValue={editExpense?.amount ?? ""} />
              <input className="field-input" name="expense_date" required type="date" defaultValue={editExpense?.expense_date ?? isoDate(new Date())} />
              <select className="field-select" name="payment_method" defaultValue={editExpense?.payment_method ?? ""}>
                <option value="">Payment method</option>
                {PAYMENT_METHODS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <input className="field-input" name="attachment_url" placeholder="Receipt or invoice URL (optional)" defaultValue={editExpense?.attachment_url ?? ""} />
            <textarea className="field-textarea" name="notes" placeholder="Notes" defaultValue={editExpense?.notes ?? ""} />
            <div className="flex gap-2">
              <button className="btn-primary" type="submit">{editExpense ? "Save Expense" : "Add Expense"}</button>
              {editExpense ? <Link className="btn-secondary" href="/financial-report">Cancel</Link> : null}
            </div>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-gray-900">{editRevenue ? "Edit Revenue" : "Add Revenue"}</h2>
          <form action={saveFinanceRevenue} className="grid gap-3">
            <input name="id" type="hidden" value={editRevenue?.id ?? ""} />
            <input className="field-input" name="title" placeholder="Title" required defaultValue={editRevenue?.title ?? ""} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="field-select" name="source" required defaultValue={editRevenue?.source ?? ""}>
                <option value="">Source</option>
                {REVENUE_SOURCES.map((item) => <option key={item}>{item}</option>)}
              </select>
              <input className="field-input" min="0" name="amount" placeholder="Amount" required step="0.01" type="number" defaultValue={editRevenue?.amount ?? ""} />
              <input className="field-input" name="revenue_date" required type="date" defaultValue={editRevenue?.revenue_date ?? isoDate(new Date())} />
              <input className="field-input" name="related_order_id" placeholder="Related order ID (optional)" defaultValue={editRevenue?.related_order_id ?? ""} />
            </div>
            <textarea className="field-textarea" name="notes" placeholder="Notes" defaultValue={editRevenue?.notes ?? ""} />
            <div className="flex gap-2">
              <button className="btn-primary" type="submit">{editRevenue ? "Save Revenue" : "Add Revenue"}</button>
              {editRevenue ? <Link className="btn-secondary" href="/financial-report">Cancel</Link> : null}
            </div>
          </form>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Expenses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Title</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Payment</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr><td className="table-td py-8 text-center text-gray-400" colSpan={6}>No expenses found.</td></tr>
                ) : expenses.map((item) => (
                  <tr key={item.id}>
                    <td className="table-td whitespace-nowrap">{formatDate(item.expense_date)}</td>
                    <td className="table-td min-w-52">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      {item.notes ? <p className="text-xs text-gray-400">{item.notes}</p> : null}
                    </td>
                    <td className="table-td">{item.category}</td>
                    <td className="table-td font-semibold text-red-600">{formatCurrency(Number(item.amount))}</td>
                    <td className="table-td">{item.payment_method ?? "-"}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <Link className="btn-secondary px-3 py-1.5 text-xs" href={`/financial-report?editExpense=${item.id}`}>Edit</Link>
                        <form action={deleteFinanceExpense}>
                          <input name="id" type="hidden" value={item.id} />
                          <ConfirmSubmitButton className="btn-danger px-3 py-1.5 text-xs" confirmMessage="Delete this expense?">
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Revenue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Title</th>
                  <th className="table-th">Source</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {websiteOrders.map((order) => (
                  <tr key={order.id} className="bg-emerald-50/50">
                    <td className="table-td whitespace-nowrap">{formatDate(order.created_at)}</td>
                    <td className="table-td min-w-52">
                      <p className="font-semibold text-gray-900">Website order {order.order_number}</p>
                      <p className="text-xs text-gray-400">Automatic order revenue</p>
                    </td>
                    <td className="table-td">Website</td>
                    <td className="table-td font-semibold text-emerald-700">{formatCurrency(Number(order.total_amount))}</td>
                    <td className="table-td"><Link className="btn-secondary px-3 py-1.5 text-xs" href={`/orders/${order.id}`}>Order</Link></td>
                  </tr>
                ))}
                {manualRevenue.length === 0 && websiteOrders.length === 0 ? (
                  <tr><td className="table-td py-8 text-center text-gray-400" colSpan={5}>No revenue found.</td></tr>
                ) : manualRevenue.map((item) => (
                  <tr key={item.id}>
                    <td className="table-td whitespace-nowrap">{formatDate(item.revenue_date)}</td>
                    <td className="table-td min-w-52">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      {item.notes ? <p className="text-xs text-gray-400">{item.notes}</p> : null}
                    </td>
                    <td className="table-td">{item.source}</td>
                    <td className="table-td font-semibold text-emerald-700">{formatCurrency(Number(item.amount))}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <Link className="btn-secondary px-3 py-1.5 text-xs" href={`/financial-report?editRevenue=${item.id}`}>Edit</Link>
                        <form action={deleteFinanceRevenue}>
                          <input name="id" type="hidden" value={item.id} />
                          <ConfirmSubmitButton className="btn-danger px-3 py-1.5 text-xs" confirmMessage="Delete this revenue record?">
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
