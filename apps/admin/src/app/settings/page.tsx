export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveStoreSettings } from "@/lib/actions";
import { CheckField, Field, SaveButton } from "@/components/admin-form";
import { ImageUploadField } from "@/components/image-upload-field";
import { SaveNotice } from "@/components/save-notice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PLATFORMS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
  { key: "shopee", label: "Shopee", placeholder: "https://shopee.com.my/yourstore" },
  { key: "lazada", label: "Lazada", placeholder: "https://www.lazada.com.my/shop/yourstore" },
] as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const { settings } = await readUrbanixStoreDataAsync();

  function getPlatformUrl(key: string) {
    if (key === "shopee") return settings.platformLinks?.shopee ?? "";
    if (key === "lazada") return settings.platformLinks?.lazada ?? "";
    return (settings.socialLinks as Record<string, string>)[key] ?? "";
  }

  function getPlatformLogo(key: string) {
    return (settings.platformLogoUrls as Record<string, string> | undefined)?.[key] ?? "";
  }

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
        {/* ── Brand & Operations ───────────────────────────────── */}
        <Card className="mb-6">
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
            <CheckField defaultChecked={settings.storeActive} label="Store active" name="is_store_active" />
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipping Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sabah, Sarawak, and Labuan use East Malaysia rates. All other Malaysian states use West Malaysia rates.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="West Malaysia Shipping Fee (RM)">
              <Input defaultValue={settings.westMalaysiaShippingFee ?? settings.shippingFee} name="west_malaysia_shipping_fee" step="0.01" type="number" />
            </Field>
            <Field label="East Malaysia Shipping Fee (RM)">
              <Input defaultValue={settings.eastMalaysiaShippingFee ?? 15} name="east_malaysia_shipping_fee" step="0.01" type="number" />
            </Field>
            <Field label="West Malaysia Free Shipping Threshold (RM)">
              <Input defaultValue={settings.westMalaysiaFreeShippingMinimumAmount ?? settings.freeShippingMinimumAmount} name="west_malaysia_free_shipping_min_amount" step="0.01" type="number" />
            </Field>
            <Field label="East Malaysia Free Shipping Threshold (RM)">
              <Input defaultValue={settings.eastMalaysiaFreeShippingMinimumAmount ?? 150} name="east_malaysia_free_shipping_min_amount" step="0.01" type="number" />
            </Field>
          </CardContent>
        </Card>

        {/* ── Social & Marketplace Platforms ───────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Social & Marketplace Platforms</CardTitle>
            <p className="text-sm text-muted-foreground">
              Set the URL and upload a logo for each platform. The logo appears in the storefront footer.
              If URL is empty, that platform is hidden from the footer.
            </p>
          </CardHeader>
          <CardContent className="grid gap-6">
            {PLATFORMS.map(({ key, label, placeholder }) => (
              <div key={key} className="rounded-xl border border-border/60 p-4">
                <h3 className="mb-3 text-sm font-bold text-foreground">{label}</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label={`${label} URL`}>
                    <Input
                      defaultValue={getPlatformUrl(key)}
                      name={key}
                      placeholder={placeholder}
                    />
                  </Field>
                  <Field label="Logo image (optional — shows instead of default icon)">
                    <ImageUploadField
                      bucket="logos"
                      initialUrl={getPlatformLogo(key)}
                      name={`${key}_logo`}
                      storagePath={`platforms/${key}`}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <SaveButton />
        </div>
      </form>
    </main>
  );
}
