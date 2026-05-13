export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { storefrontNavItems } from "@ecommerce/shared";
import { saveCmsBanner, saveCmsNavigation } from "@/lib/actions";
import { CheckField, Field, SaveButton } from "@/components/admin-form";
import { SaveNotice } from "@/components/save-notice";
import { PromotionBannersForm } from "@/components/promotion-banners-form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CmsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const { homepage, promotionBanners, settings } = await readUrbanixStoreDataAsync();

  // Use nav items from DB if available, else fall back to storefrontNavItems
  const navItems = settings.navItems ?? storefrontNavItems;

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Website CMS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the storefront announcement bar, hero banner, promotion banners, and navigation.
        </p>
      </div>

      <SaveNotice saveError={params.saveError} saved={params.saved} />

      {/* ── Announcement Bar ──────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">📢 Announcement Bar</h2>
        <form action={saveCmsBanner}>
          {/* Pass hero fields as hidden so they are not lost */}
          <input name="heroTitle" type="hidden" value={homepage.heroTitle} />
          <input name="heroSubtitle" type="hidden" value={homepage.heroSubtitle} />
          <input name="heroImage" type="hidden" value={homepage.heroImage} />
          <input name="heroButtonText" type="hidden" value={homepage.heroButtonText} />
          <input name="heroButtonLink" type="hidden" value={homepage.heroButtonLink} />
          <input name="promotionStripText" type="hidden" value={homepage.promotionStripText} />
          <input name="isActive" type="hidden" value={String(homepage.isActive ?? true)} />

          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <CheckField
                defaultChecked={homepage.announcementEnabled ?? true}
                label="Announcement bar enabled"
                name="announcementEnabled"
              />
              <Field label="Announcement text (shown in bar)">
                <Input
                  defaultValue={homepage.promotionStripText}
                  name="promotionStripText"
                  placeholder="Free shipping for orders above RM40"
                />
              </Field>
              <Field label="Announcement link (optional)">
                <Input
                  defaultValue={homepage.announcementLink ?? ""}
                  name="announcementLink"
                  placeholder="/products"
                />
              </Field>
              <Field label="Background colour">
                <div className="flex items-center gap-2">
                  <input
                    className="size-10 cursor-pointer rounded border border-input"
                    defaultValue={homepage.announcementBgColor ?? "#1a1a1a"}
                    name="announcementBgColor"
                    type="color"
                  />
                  <Input
                    className="w-32"
                    defaultValue={homepage.announcementBgColor ?? "#1a1a1a"}
                    name="announcementBgColor"
                    placeholder="#1a1a1a"
                  />
                </div>
              </Field>
              <Field label="Text colour">
                <div className="flex items-center gap-2">
                  <input
                    className="size-10 cursor-pointer rounded border border-input"
                    defaultValue={homepage.announcementTextColor ?? "#ffffff"}
                    name="announcementTextColor"
                    type="color"
                  />
                  <Input
                    className="w-32"
                    defaultValue={homepage.announcementTextColor ?? "#ffffff"}
                    name="announcementTextColor"
                    placeholder="#ffffff"
                  />
                </div>
              </Field>
              <div className="md:col-span-2">
                <SaveButton label="Save Announcement Bar" />
              </div>
            </CardContent>
          </Card>
        </form>
      </section>

      {/* ── Hero Banner ────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">🖼️ Hero Banner</h2>
        <form action={saveCmsBanner}>
          {/* Pass announcement fields as hidden so they are not lost */}
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

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">🧭 Navigation</h2>
        <form action={saveCmsNavigation}>
          <Card>
            <CardHeader>
              <CardTitle>Storefront Navigation Items</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {navItems.map((item, i) => (
                <div className="flex items-center gap-3" key={`${item.href}-${i}`}>
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <Field label="Label">
                    <Input
                      defaultValue={item.label}
                      onChange={undefined}
                      name={`nav_label_${i}`}
                    />
                  </Field>
                  <Field label="Link">
                    <Input
                      defaultValue={item.href}
                      onChange={undefined}
                      name={`nav_href_${i}`}
                    />
                  </Field>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Note: Edit labels and links above, then save. To add/remove items, contact your developer.
              </p>
              <SaveButton label="Save Navigation" />
            </CardContent>
          </Card>
        </form>
      </section>
    </main>
  );
}
