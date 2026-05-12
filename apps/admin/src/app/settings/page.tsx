export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveStoreSettings } from "@/lib/admin-actions";
import { CheckField, Field, SaveButton } from "@/components/admin-form";
import { SaveNotice } from "@/components/save-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const { settings } = await readUrbanixStoreDataAsync();

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Store Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure public store identity and operational defaults.
        </p>
      </div>
      <SaveNotice saved={params.saved} />
      <form action={saveStoreSettings}>
        <Card>
          <CardHeader>
            <CardTitle>Brand & Operations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Store name"><Input defaultValue={settings.storeName} name="storeName" /></Field>
            <Field label="Store tagline"><Input defaultValue={settings.storeTagline} name="storeTagline" /></Field>
            <Field label="Logo"><Input defaultValue={settings.logo} name="logo" /></Field>
            <Field label="Favicon"><Input defaultValue={settings.favicon} name="favicon" /></Field>
            <Field label="WhatsApp number"><Input defaultValue={settings.whatsappNumber} name="whatsappNumber" /></Field>
            <Field label="Contact email"><Input defaultValue={settings.contactEmail} name="contactEmail" /></Field>
            <Field label="Contact phone"><Input defaultValue={settings.contactPhone} name="contactPhone" /></Field>
            <Field label="Shipping fee"><Input defaultValue={settings.shippingFee} name="shippingFee" step="0.01" type="number" /></Field>
            <Field label="Free shipping minimum amount"><Input defaultValue={settings.freeShippingMinimumAmount} name="freeShippingMinimumAmount" step="0.01" type="number" /></Field>
            <Field label="Facebook"><Input defaultValue={settings.socialLinks.facebook} name="facebook" /></Field>
            <Field label="Instagram"><Input defaultValue={settings.socialLinks.instagram} name="instagram" /></Field>
            <Field label="TikTok"><Input defaultValue={settings.socialLinks.tiktok} name="tiktok" /></Field>
            <CheckField defaultChecked={settings.storeActive} label="Store active" name="storeActive" />
            <div className="md:col-span-2">
              <SaveButton />
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
