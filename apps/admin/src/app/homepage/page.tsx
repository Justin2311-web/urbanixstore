export const dynamic = "force-dynamic";

import type { Database } from "@ecommerce/database";
import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { saveHomepage } from "@/lib/actions";
import { HeroImageField } from "@/components/hero-image-field";

type BannerRow = Database["public"]["Tables"]["banners"]["Row"];

export default async function HomepagePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  const { data: bannerRaw } = await sb
    .from("banners")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  const banner = bannerRaw as BannerRow | null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Homepage / Banner</h1>
          <p className="mt-1 text-sm text-gray-500">
            Edit the hero banner shown on the storefront homepage.
          </p>
        </div>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      <form action={saveHomepage}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-gray-800">Hero Banner</h2>
              <div className="space-y-4">
                <div>
                  <label className="field-label">Hero Title *</label>
                  <input
                    name="hero_title"
                    required
                    className="field-input"
                    defaultValue={banner?.hero_title ?? ""}
                    placeholder="e.g. Free Shipping for Orders Above RM40"
                  />
                </div>

                <div>
                  <label className="field-label">Hero Subtitle</label>
                  <input
                    name="hero_subtitle"
                    className="field-input"
                    defaultValue={banner?.hero_subtitle ?? ""}
                    placeholder="Tagline under the title"
                  />
                </div>

                <div>
                  <label className="field-label">Hero Image</label>
                  <HeroImageField initialUrl={banner?.hero_image_url} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Button Text</label>
                    <input
                      name="hero_button_text"
                      className="field-input"
                      defaultValue={banner?.hero_button_text ?? ""}
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <label className="field-label">Button Link</label>
                    <input
                      name="hero_button_link"
                      className="field-input"
                      defaultValue={banner?.hero_button_link ?? ""}
                      placeholder="/products"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Promo Strip Text</label>
                  <input
                    name="promo_strip_text"
                    className="field-input"
                    defaultValue={banner?.promo_strip_text ?? ""}
                    placeholder="Free shipping · COD available · WhatsApp orders"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-gray-800">Visibility</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={banner?.is_active ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Banner active</span>
              </label>
            </div>

            <div className="card p-5">
              <button type="submit" className="btn-primary w-full justify-center py-2.5">
                💾 Save Homepage
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
