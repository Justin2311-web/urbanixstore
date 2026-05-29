export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveBannersHeroBanner } from "@/lib/actions";
import { CheckField, Field, SaveButton } from "@/components/admin-form";
import { SaveNotice } from "@/components/save-notice";
import { PromotionBannersForm } from "@/components/promotion-banners-form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function BannersPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const { homepage, promotionBanners } = await readUrbanixStoreDataAsync();
  const languagePanels = [
    {
      code: "en",
      cta: homepage.localizedHeroButtonText?.en ?? homepage.heroButtonText,
      label: "EN",
      promo: homepage.localizedPromoStripText?.en ?? homepage.promotionStripText,
      subtitle: homepage.localizedHeroSubtitle?.en ?? homepage.heroSubtitle,
      title: "English",
      value: homepage.localizedHeroTitle?.en ?? homepage.heroTitle,
    },
    {
      code: "zh",
      cta: homepage.localizedHeroButtonText?.zh ?? "",
      label: "中文",
      promo: homepage.localizedPromoStripText?.zh ?? "",
      subtitle: homepage.localizedHeroSubtitle?.zh ?? "",
      title: "中文",
      value: homepage.localizedHeroTitle?.zh ?? "",
    },
    {
      code: "ms",
      cta: homepage.localizedHeroButtonText?.ms ?? "",
      label: "BM",
      promo: homepage.localizedPromoStripText?.ms ?? "",
      subtitle: homepage.localizedHeroSubtitle?.ms ?? "",
      title: "Bahasa Melayu",
      value: homepage.localizedHeroTitle?.ms ?? "",
    },
  ];

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Banners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage hero banners and promotion banner slides shown on the storefront.
        </p>
      </div>

      <SaveNotice saveError={params.saveError} saved={params.saved} />

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">Hero Banner</h2>
        <form action={saveBannersHeroBanner}>
          <input name="announcementEnabled" type="hidden" value={String(homepage.announcementEnabled ?? true)} />
          <input name="announcementLink" type="hidden" value={homepage.announcementLink ?? ""} />
          <input name="announcementBgColor" type="hidden" value={homepage.announcementBgColor ?? "#1a1a1a"} />
          <input name="announcementTextColor" type="hidden" value={homepage.announcementTextColor ?? "#ffffff"} />
          <input name="heroTitle" type="hidden" value={homepage.localizedHeroTitle?.en ?? homepage.heroTitle} />
          <input name="heroSubtitle" type="hidden" value={homepage.localizedHeroSubtitle?.en ?? homepage.heroSubtitle} />
          <input name="heroButtonText" type="hidden" value={homepage.localizedHeroButtonText?.en ?? homepage.heroButtonText} />
          <input name="promotionStripText" type="hidden" value={homepage.localizedPromoStripText?.en ?? homepage.promotionStripText} />

          <Card>
            <CardContent className="grid gap-5 pt-6">
              <div className="grid gap-4 xl:grid-cols-3">
                {languagePanels.map((item) => (
                  <div className="rounded-2xl border border-border bg-card/70 p-4" key={item.code}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-extrabold">{item.title}</h3>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <div className="grid gap-3">
                      <Field label={`Hero title ${item.label}`}>
                        <Input defaultValue={item.value} name={`hero_title_${item.code}`} />
                      </Field>
                      <Field label={`Hero description ${item.label}`}>
                        <Input defaultValue={item.subtitle} name={`hero_subtitle_${item.code}`} />
                      </Field>
                      <Field label={`CTA button text ${item.label}`}>
                        <Input defaultValue={item.cta} name={`hero_button_text_${item.code}`} />
                      </Field>
                      <Field label={`Promotion strip text ${item.label}`}>
                        <Input defaultValue={item.promo} name={`promo_strip_text_${item.code}`} />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="CTA button link">
                  <Input defaultValue={homepage.heroButtonLink} name="heroButtonLink" placeholder="/products" />
                </Field>
                <Field label="Hero image URL or image key">
                  <Input
                    defaultValue={homepage.heroImageUrl ?? homepage.heroImage}
                    name="heroImage"
                    placeholder="https://... or fan-green"
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
              </div>
            </CardContent>
          </Card>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">Promotion Banners</h2>
        <PromotionBannersForm banners={promotionBanners} />
      </section>
    </main>
  );
}
