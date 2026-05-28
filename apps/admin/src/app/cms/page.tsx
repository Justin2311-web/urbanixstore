export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { storefrontNavItems } from "@ecommerce/shared";
import { saveCmsBanner, saveCmsNavigation } from "@/lib/actions";
import { CheckField, Field, SaveButton } from "@/components/admin-form";
import { SaveNotice } from "@/components/save-notice";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CmsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const { homepage, settings } = await readUrbanixStoreDataAsync();

  // Use nav items from DB if available, else fall back to storefrontNavItems
  const navItems = settings.navItems ?? storefrontNavItems;

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Homepage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the storefront announcement bar and navigation.
          Hero banners and promotion banners are managed in{" "}
          <a className="font-semibold text-[#0e5c56] hover:underline" href="/banners">Banners</a>.
        </p>
      </div>

      <SaveNotice saveError={params.saveError} saved={params.saved} />

      {/* ── Announcement Bar ──────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">📢 Announcement Bar</h2>
        <form action={saveCmsBanner}>
          {/*
            Pass hero fields as hidden so they are NOT wiped when saving only the
            announcement bar. IMPORTANT: each name must appear ONCE so formData.get()
            returns the correct (user-edited) value — no duplicate names.
          */}
          <input name="heroTitle" type="hidden" value={homepage.heroTitle} />
          <input name="heroSubtitle" type="hidden" value={homepage.heroSubtitle} />
          <input name="heroImage" type="hidden" value={homepage.heroImage} />
          <input name="heroButtonText" type="hidden" value={homepage.heroButtonText} />
          <input name="heroButtonLink" type="hidden" value={homepage.heroButtonLink} />
          <input name="isActive" type="hidden" value={String(homepage.isActive ?? true)} />
          {/* NOTE: promotionStripText is intentionally NOT duplicated here as a hidden
              field — it is the editable field below. Duplicating it caused the old
              value to override user edits on every save. */}

          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <CheckField
                defaultChecked={homepage.announcementEnabled ?? true}
                label="Announcement bar enabled"
                name="announcementEnabled"
              />
              <Field label="Announcement text — EN">
                <Input
                  defaultValue={homepage.localizedPromoStripText?.en ?? homepage.promotionStripText}
                  name="promotionStripText"
                  placeholder="Free shipping for orders above RM40"
                />
              </Field>
              <Field label="Announcement text — 中文">
                <Input
                  defaultValue={homepage.localizedPromoStripText?.zh ?? ""}
                  name="promo_strip_text_zh"
                  placeholder="西马满 RM80 免邮｜东马满 RM150 免邮"
                />
              </Field>
              <Field label="Announcement text — BM">
                <Input
                  defaultValue={homepage.localizedPromoStripText?.ms ?? ""}
                  name="promo_strip_text_ms"
                  placeholder="Penghantaran percuma untuk pesanan melebihi RM40"
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
                  {/*
                    Color picker is display-only (no name) — the hex Input below is the
                    single named field. Previously both shared the same name, causing
                    formData.get() to return the color picker's original value and
                    silently discard the user's typed hex code on every save.
                  */}
                  <input
                    className="size-10 cursor-pointer rounded border border-input"
                    defaultValue={homepage.announcementBgColor ?? "#1a1a1a"}
                    id="announcementBgColorPicker"
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
                    id="announcementTextColorPicker"
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
                      name={`nav_label_${i}`}
                    />
                  </Field>
                  <Field label="Link">
                    <Input
                      defaultValue={item.href}
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
