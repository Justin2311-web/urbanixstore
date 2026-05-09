import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { savePaymentSettings } from "@/lib/admin-actions";
import { CheckField, Field, SaveButton, TextArea } from "@/components/admin-form";
import { SaveNotice } from "@/components/save-notice";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PaymentSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const { payments } = await readUrbanixStoreDataAsync();

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Payment Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure manual payment, WhatsApp order, and future gateway notes.</p>
      </div>
      <SaveNotice saved={params.saved} />
      <form action={savePaymentSettings}>
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <CheckField defaultChecked={payments.manualPaymentEnabled} label="Manual Payment enabled" name="manualPaymentEnabled" />
            <CheckField defaultChecked={payments.whatsAppOrderEnabled} label="WhatsApp Order enabled" name="whatsAppOrderEnabled" />
            <Field label="Bank name"><Input defaultValue={payments.bankName} name="bankName" /></Field>
            <Field label="Account name"><Input defaultValue={payments.accountName} name="accountName" /></Field>
            <Field label="Account number"><Input defaultValue={payments.accountNumber} name="accountNumber" /></Field>
            <Field label="Future payment gateway placeholder"><Input defaultValue={payments.futureGatewayPlaceholder} name="futureGatewayPlaceholder" /></Field>
            <div className="md:col-span-2">
              <Field label="Payment instruction">
                <TextArea defaultValue={payments.paymentInstruction} name="paymentInstruction" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <SaveButton />
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
