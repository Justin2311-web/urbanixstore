export const dynamic = "force-dynamic";

import type { Database } from "@ecommerce/database";
import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { savePaymentSettings } from "@/lib/actions";

type PaymentRow = Database["public"]["Tables"]["payment_settings"]["Row"];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  const { data: paymentsRaw } = await sb
    .from("payment_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  const payments = paymentsRaw as PaymentRow | null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payment Settings</h1>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      <form action={savePaymentSettings}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Payment Methods</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  name="manual_payment_enabled"
                  type="checkbox"
                  defaultChecked={payments?.manual_payment_enabled ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Manual Bank Transfer</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  name="whatsapp_order_enabled"
                  type="checkbox"
                  defaultChecked={payments?.whatsapp_order_enabled ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">WhatsApp Order</span>
              </label>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Bank Transfer Details</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Bank Name</label>
                <input name="bank_name" className="field-input" defaultValue={payments?.bank_name ?? ""} placeholder="e.g. Maybank" />
              </div>
              <div>
                <label className="field-label">Account Name</label>
                <input name="account_name" className="field-input" defaultValue={payments?.account_name ?? ""} />
              </div>
              <div>
                <label className="field-label">Account Number</label>
                <input name="account_number" className="field-input" defaultValue={payments?.account_number ?? ""} />
              </div>
            </div>
          </div>

          <div className="card p-5 lg:col-span-2">
            <h2 className="mb-4 font-semibold text-gray-800">Payment Instructions</h2>
            <textarea
              name="payment_instruction"
              className="field-textarea"
              rows={4}
              defaultValue={payments?.payment_instruction ?? ""}
              placeholder="Instructions shown to customers after they place an order…"
            />
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Future Gateway</h2>
            <div>
              <label className="field-label">Gateway Placeholder / Notes</label>
              <input
                name="provider_placeholder"
                className="field-input"
                defaultValue={payments?.provider_placeholder ?? ""}
                placeholder="e.g. Stripe integration coming soon"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              💾 Save Payment Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
