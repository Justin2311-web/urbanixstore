"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PromotionBanner } from "@ecommerce/shared";
import { savePromotionBanners } from "@/lib/admin-actions";
import { CheckField, Field, SaveButton } from "@/components/admin-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BannerRow = PromotionBanner & {
  key: string;
};

type BannerLang = "en" | "zh" | "ms";
const bannerLanguages: Array<{ code: BannerLang; label: string }> = [
  { code: "en", label: "EN" },
  { code: "zh", label: "中文" },
  { code: "ms", label: "BM" },
];

function localizedImagesFrom(value: string, localized?: Partial<Record<BannerLang, string>>) {
  const fallback = value || "";
  return {
    en: localized?.en || fallback,
    zh: localized?.zh || localized?.en || fallback,
    ms: localized?.ms || localized?.en || fallback,
  };
}

function newBanner(sortOrder: number): BannerRow {
  return {
    buttonEnabled: true,
    buttonUrl: "",
    ctaText: "Shop Now",
    desktopImageUrl: "",
    id: "",
    imageClickUrl: "",
    isActive: true,
    key: `new-${Date.now()}-${sortOrder}`,
    localizedDesktopImageUrls: { en: "", zh: "", ms: "" },
    localizedMobileImageUrls: { en: "", zh: "", ms: "" },
    mobileImageUrl: "",
    sortOrder,
    subtitle: "",
    targetUrl: "/products",
    title: "",
  };
}

export function PromotionBannersForm({ banners }: { banners: PromotionBanner[] }) {
  const [rows, setRows] = useState<BannerRow[]>(
    banners.length > 0
      ? banners.map((banner) => ({ ...banner, key: banner.id }))
      : [newBanner(1)]
  );

  return (
    <form action={savePromotionBanners} className="grid gap-4" encType="multipart/form-data">
      <input name="bannerKeys" type="hidden" value={JSON.stringify(rows.map((row) => row.key))} />
      <div className="flex justify-end">
        <Button onClick={() => setRows((current) => [...current, newBanner(current.length + 1)])} type="button" variant="secondary">
          <Plus className="size-4" />
          Add Banner
        </Button>
      </div>
      {rows.map((banner, index) => (
        <Card key={banner.key}>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{banner.title || "New promotion banner"}</CardTitle>
            <Button onClick={() => setRows((current) => current.filter((row) => row.key !== banner.key))} size="icon-sm" type="button" variant="ghost">
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <input name={`${banner.key}-id`} type="hidden" value={banner.id} />
            {(() => {
              const desktopImages = localizedImagesFrom(banner.desktopImageUrl, banner.localizedDesktopImageUrls);
              const mobileImages = localizedImagesFrom(banner.mobileImageUrl, banner.localizedMobileImageUrls);
              return (
                <>
                  {bannerLanguages.map(({ code }) => (
                    <input key={`desktop-${code}`} name={`${banner.key}-desktopImageUrl-${code}`} type="hidden" value={desktopImages[code]} />
                  ))}
                  {bannerLanguages.map(({ code }) => (
                    <input key={`mobile-${code}`} name={`${banner.key}-mobileImageUrl-${code}`} type="hidden" value={mobileImages[code]} />
                  ))}
                </>
              );
            })()}
            <Field label="Title">
              <Input defaultValue={banner.title} name={`${banner.key}-title`} required />
            </Field>
            <Field label="Subtitle / description">
              <Input defaultValue={banner.subtitle} name={`${banner.key}-subtitle`} />
            </Field>
            <Field label="CTA button text">
              <Input defaultValue={banner.ctaText} name={`${banner.key}-ctaText`} />
            </Field>
            <Field label="Target URL / product URL">
              <Input defaultValue={banner.targetUrl} name={`${banner.key}-targetUrl`} />
            </Field>
            <Field label="Sort order">
              <Input defaultValue={banner.sortOrder || index + 1} min="1" name={`${banner.key}-sortOrder`} type="number" />
            </Field>
            <div className="grid gap-2 self-end sm:grid-cols-2">
              <CheckField defaultChecked={banner.isActive} label="Active" name={`${banner.key}-isActive`} />
              <CheckField label="Delete" name={`${banner.key}-delete`} />
            </div>
            {bannerLanguages.map(({ code, label }) => {
              const desktopImages = localizedImagesFrom(banner.desktopImageUrl, banner.localizedDesktopImageUrls);
              const mobileImages = localizedImagesFrom(banner.mobileImageUrl, banner.localizedMobileImageUrls);
              return (
                <div className="grid gap-3 rounded-2xl border border-border p-3 md:col-span-2 md:grid-cols-2" key={code}>
                  <Field label={`${label} desktop banner image`}>
                    <Input accept="image/*" name={`${banner.key}-desktopFile-${code}`} type="file" />
                  </Field>
                  <Field label={`${label} mobile banner image`}>
                    <Input accept="image/*" name={`${banner.key}-mobileFile-${code}`} type="file" />
                  </Field>
                  {desktopImages[code] ? (
                    <img alt={`${label} desktop banner preview`} className="aspect-[16/6] w-full rounded-2xl border object-cover" src={desktopImages[code]} />
                  ) : null}
                  {mobileImages[code] ? (
                    <img alt={`${label} mobile banner preview`} className="aspect-[4/5] w-full rounded-2xl border object-cover md:max-w-56" src={mobileImages[code]} />
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
      <SaveButton />
    </form>
  );
}
