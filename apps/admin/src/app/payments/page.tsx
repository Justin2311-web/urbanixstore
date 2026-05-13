export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { ImageUploadField } from "@/components/image-upload-field";
import { saveQrPaymentMethod } from "@/lib/actions";
import type { Database } from "@ecommerce/database";

type QrRow = Database["public"]["Tables"]["qr_payment_methods"]["Row"];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  const { data: qrMethodsRaw } = await sb
    .from("qr_payment_methods")
    .select("*");

  const qrMethods = (qrMethodsRaw ?? []) as QrRow[];

  // Ensure we have both default rows even if DB is empty
  const bankQr = qrMethods.find((m) => m.id === "bank_qr") ?? {
    id: "bank_qr",
    display_name: "Bank QR Payment",
    qr_image_url: null,
    instruction_text: "Scan the QR code to pay via bank transfer.",
    is_active: true,
    created_at: "",
    updated_at: "",
  };
  const ewalletQr = qrMethods.find((m) => m.id === "ewallet_qr") ?? {
    id: "ewallet_qr",
    display_name: "E-wallet QR Payment",
    qr_image_url: null,
    instruction_text: "Scan the QR code to pay via e-wallet.",
    is_active: true,
    created_at: "",
    updated_at: "",
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payment Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage QR payment methods shown to customers at checkout.
        </p>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      <div className="grid gap-8 lg:grid-cols-2">
        <QrMethodCard method={bankQr} />
        <QrMethodCard method={ewalletQr} />
      </div>
    </div>
  );
}

function QrMethodCard({ method }: { method: QrRow }) {
  const label = method.id === "bank_qr" ? "🏦 Bank QR Payment" : "📱 E-wallet QR Payment";

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">{label}</h2>
      </div>

      <form action={saveQrPaymentMethod} className="space-y-4">
        <input type="hidden" name="id" value={method.id} />

        {/* Enable/disable toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={method.is_active}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Active (shown at checkout)</span>
        </label>

        {/* Display name */}
        <div>
          <label className="field-label">Display Name</label>
          <input
            name="display_name"
            className="field-input"
            defaultValue={method.display_name}
            placeholder="e.g. Bank QR Payment"
          />
        </div>

        {/* QR image upload */}
        <div>
          <label className="field-label">QR Code Image</label>
          <ImageUploadField
            bucket="banners"
            storagePath={`qr-codes/${method.id}`}
            name="qr_image_url"
            initialUrl={method.qr_image_url}
          />
        </div>

        {/* Instruction text */}
        <div>
          <label className="field-label">Customer Instructions</label>
          <textarea
            name="instruction_text"
            className="field-textarea"
            rows={3}
            defaultValue={method.instruction_text ?? ""}
            placeholder="Instructions shown to customers when they select this payment method…"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          💾 Save {method.id === "bank_qr" ? "Bank QR" : "E-wallet QR"}
        </button>
      </form>
    </div>
  );
}
