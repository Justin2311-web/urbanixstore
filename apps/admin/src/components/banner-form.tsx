"use client";

import { savePromotionBanner } from "@/lib/actions";
import { ImageUploadField } from "@/components/image-upload-field";

type BannerData = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string | null;
  target_url: string | null;
  sort_order: number;
  is_active: boolean;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
};

export function BannerForm({ banner }: { banner?: BannerData }) {
  const folder = banner?.id ?? "new";

  return (
    <form action={savePromotionBanner}>
      <input type="hidden" name="id" value={banner?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Title *</label>
          <input
            name="title"
            required
            className="field-input"
            defaultValue={banner?.title ?? ""}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="field-label">Subtitle</label>
          <input
            name="subtitle"
            className="field-input"
            defaultValue={banner?.subtitle ?? ""}
          />
        </div>

        <div>
          <label className="field-label">CTA Button Text</label>
          <input
            name="cta_text"
            className="field-input"
            defaultValue={banner?.cta_text ?? ""}
            placeholder="Shop Now"
          />
        </div>

        <div>
          <label className="field-label">Target URL</label>
          <input
            name="target_url"
            className="field-input"
            defaultValue={banner?.target_url ?? ""}
            placeholder="/products"
          />
        </div>

        <div>
          <label className="field-label">Sort Order</label>
          <input
            name="sort_order"
            type="number"
            min="1"
            className="field-input"
            defaultValue={banner?.sort_order ?? 1}
          />
        </div>

        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={banner?.is_active ?? true}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>

        {/* Desktop image — uploaded directly to Supabase, URL stored in hidden input */}
        <div>
          <label className="field-label">Desktop Image</label>
          <ImageUploadField
            bucket="banners"
            storagePath={`banners/${folder}/desktop`}
            name="desktop_image_url"
            initialUrl={banner?.desktop_image_url}
          />
        </div>

        {/* Mobile image — same pattern */}
        <div>
          <label className="field-label">Mobile Image</label>
          <ImageUploadField
            bucket="banners"
            storagePath={`banners/${folder}/mobile`}
            name="mobile_image_url"
            initialUrl={banner?.mobile_image_url}
          />
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" className="btn-primary">
            Save Banner
          </button>
        </div>
      </div>
    </form>
  );
}
