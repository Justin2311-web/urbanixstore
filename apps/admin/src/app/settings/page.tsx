export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveStoreSettings } from "@/lib/actions";
import { CheckField, Field, SaveButton } from "@/components/admin-form";
import { SaveNotice } from "@/components/save-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
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
      <SaveNotice saveError={params.saveError} saved={params.saved} />
      <form action={saveStoreSettings}>
        <Card>
          <CardHeader>
            <CardTitle>Brand & Operations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Store name"><Input defaultValue={settings.storeName} name="store_name" /></Field>
            <Field label="Store tagline"><Input defaultValue={settings.storeTagline} name="store_tagline" /></Field>
            <Field label="Logo URL"><Input defaultValue={settings.logoUrl ?? settings.logo} name="logo_url" /></Field>
            <Field label="Favicon URL"><Input defaultValue={settings.faviconUrl ?? settings.favicon} name="favicon_url" /></Field>
            <Field label="WhatsApp number"><Input defaultValue={settings.whatsappNumber} name="whatsapp_number" /></Field>
            <Field label="Contact email"><Input defaultValue={settings.contactEmail} name="contact_email" /></Field>
            <Field label="Contact phone"><Input defaultValue={settings.contactPhone} name="contact_phone" /></Field>
            <Field label="Shipping fee (RM)"><Input defaultValue={settings.shippingFee} name="shipping_fee" step="0.01" type="number" /></Field>
            <Field label="Free shipping minimum (RM)"><Input defaultValue={settings.freeShippingMinimumAmount} name="free_shipping_min_amount" step="0.01" type="number" /></Field>
            <Field label="Facebook URL"><Input defaultValue={settings.socialLinks.facebook} name="facebook" placeholder="https://facebook.com/yourpage" /></Field>
            <Field label="Instagram URL"><Input defaultValue={settings.socialLinks.instagram} name="instagram" placeholder="https://instagram.com/yourhandle" /></Field>
            <Field label="TikTok URL"><Input defaultValue={settings.socialLinks.tiktok} name="tiktok" placeholder="https://tiktok.com/@yourhandle" /></Field>
            <Field label="Shopee store URL"><Input defaultValue={settings.platformLinks?.shopee ?? ""} name="shopee" placeholder="https://shopee.com.my/yourstore" /></Field>
            <Field label="Lazada store URL"><Input defaultValue={settings.platformLinks?.lazada ?? ""} name="lazada" placeholder="https://www.lazada.com.my/shop/yourstore" /></Field>
            <CheckField defaultChecked={settings.storeActive} label="Store active" name="is_store_active" />
            <div className="md:col-span-2">
              <SaveButton />
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
