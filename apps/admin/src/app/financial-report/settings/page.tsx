export const dynamic = "force-dynamic";

import Link from "next/link";
import { saveFinanceSettings } from "@/lib/actions";
import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";

type SettingsRow = {
  currency: string;
  default_packaging_cost: number;
  default_shipping_cost: number;
  startup_capital: number;
};

export default async function FinanceSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const { data, error } = await createAdminClient()
    .from("finance_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  const settings = (data as SettingsRow | null) ?? {
    currency: "MYR",
    default_packaging_cost: 0,
    default_shipping_cost: 0,
    startup_capital: 2500,
  };

  return (
    <div>
      <div className="page-header gap-3">
        <div>
          <h1 className="page-title">Finance Settings</h1>
          <p className="text-sm text-gray-500">Set startup capital and default per-order cost assumptions.</p>
        </div>
        <Link className="btn-secondary" href="/financial-report">Back to Financial Report</Link>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      {error ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Finance settings table is not available yet. Apply migration
          <span className="font-mono"> 20260524024228_ecommerce_financial_management.sql </span>
          first.
        </div>
      ) : null}

      <form action={saveFinanceSettings} className="card grid max-w-2xl gap-4 p-5">
        <label className="grid gap-1">
          <span className="field-label">Startup Capital</span>
          <input className="field-input" min="0" name="startup_capital" required step="0.01" type="number" defaultValue={settings.startup_capital} />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Default Shipping Cost</span>
          <input className="field-input" min="0" name="default_shipping_cost" required step="0.01" type="number" defaultValue={settings.default_shipping_cost} />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Default Packaging Cost</span>
          <input className="field-input" min="0" name="default_packaging_cost" required step="0.01" type="number" defaultValue={settings.default_packaging_cost} />
        </label>
        <label className="grid gap-1">
          <span className="field-label">Currency</span>
          <input className="field-input" name="currency" required defaultValue={settings.currency} />
        </label>
        <button className="btn-primary w-fit" type="submit">Save Finance Settings</button>
      </form>
    </div>
  );
}
