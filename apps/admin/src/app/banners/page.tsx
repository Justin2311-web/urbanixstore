export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveCmsBanner } from "@/lib/actions";
import { CheckField, Field, SaveButton } from "@/components/admin-form";
import { SaveNotice } from "@/components/save-notice";
import { PromotionBannersForm } from "@/components/promotion-banners-form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const { homepage, promotionBanners } = await readUrbanixStoreDataAsync();

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Banners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage hero banners and promotion banner slides shown on the storefront.
        </p>
      </div>

      <SaveNotice saveError={params.saveError} saved={params.saved} />

      {/* ── Hero Banner ────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">🖼️ Hero Banner</h2>
        <form action={saveCmsBanner}>
          {/*
            Pass announcement fields as hidden so they are not wiped when saving
            only the hero banner. Each name appears exactly ONCE.
          */}
          <input name="announcementEnabled" type="hidden" value={String(homepage.announcementEnabled ?? true)} />
          <input name="announcementLink" type="hidden" value={homepage.announcementLink ?? ""} />
          <input name="announcementBgColor" type="hidden" value={homepage.announcementBgColor ?? "#1a1a1a"} />
          <input name="announcementTextColor" type="hidden" value={homepage.announcementTextColor ?? "#ffffff"} />

          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <Field label="Hero title">
                <Input defaultValue={homepage.heroTitle} name="heroTitle" required />
              </Field>
              <Field label="Hero subtitle">
                <Input defaultValue={homepage.heroSubtitle} name="heroSubtitle" />
              </Field>
              <Field label="CTA button text">
                <Input defaultValue={homepage.heroButtonText} name="heroButtonText" />
              </Field>
              <Field label="CTA button link">
                <Input defaultValue={homepage.heroButtonLink} name="heroButtonLink" />
              </Field>
              <Field label="Hero image URL">
                <Input
                  defaultValue={homepage.heroImageUrl ?? homepage.heroImage}
                  name="heroImage"
                  placeholder="https://… or fan-green"
                />
              </Field>
              <Field label="Promotion strip text">
                <Input
                  defaultValue={homepage.promotionStripText}
                  name="promotionStripText"
                  placeholder="Free shipping for orders above RM40"
                />
              </Field>
              <CheckField
                defaultChecked={homepage.isActive ?? true}
                label="Hero banner active"
                name="isActive"
              />
              <div className="md:col-span-2">
                <SaveButton label="Save Hero Banner" />
              </div>
            </CardContent>
          </Card>
        </form>
      </section>

      {/* ── Promotion Banners ──────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">🎯 Promotion Banners</h2>
        <PromotionBannersForm banners={promotionBanners} />
      </section>
    </main>
  );
}
