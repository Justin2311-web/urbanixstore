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

function localizedTextFrom(
  legacy: string,
  localized?: Partial<Record<BannerLang, string>>,
  buttonText?: PromotionBanner["buttonText"]
) {
  return {
    en: localized?.en || buttonText?.en || legacy || "",
    zh: localized?.zh || buttonText?.zh || "",
    ms: localized?.ms || buttonText?.bm || "",
  };
}

function newBanner(sortOrder: number): BannerRow {
  return {
    buttonEnabled: false,
    buttonPosition: "bottom-left",
    buttonUrl: "",
    buttonText: { bm: "", en: "", zh: "" },
    ctaText: "",
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
    targetUrl: "",
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
            <div className="grid gap-4 md:col-span-2 xl:grid-cols-3">
              {bannerLanguages.map(({ code, label }) => {
                const titles = localizedTextFrom(banner.title, banner.localizedTitle);
                const subtitles = localizedTextFrom(banner.subtitle, banner.localizedSubtitle);
                const buttonTexts = localizedTextFrom(banner.ctaText, banner.localizedCtaText, banner.buttonText);

                return (
                  <div className="grid gap-3 rounded-2xl border border-border p-3" key={`copy-${code}`}>
                    <Field label={`Title (${label})`}>
                      <Input defaultValue={titles[code]} name={`${banner.key}-title-${code}`} />
                    </Field>
                    <Field label={`Description (${label})`}>
                      <Input defaultValue={subtitles[code]} name={`${banner.key}-subtitle-${code}`} />
                    </Field>
                    <Field label={`Button Text (${label})`}>
                      <Input defaultValue={buttonTexts[code]} name={`${banner.key}-buttonText-${code}`} />
                    </Field>
                  </div>
                );
              })}
            </div>
            <Field label="Image click URL / CTA link">
              <Input defaultValue={banner.targetUrl} name={`${banner.key}-targetUrl`} />
            </Field>
            <Field label="Button position">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue={banner.buttonPosition ?? "bottom-left"}
                name={`${banner.key}-buttonPosition`}
              >
                <option value="bottom-left">Bottom left</option>
                <option value="bottom-right">Bottom right</option>
                <option value="top-left">Top left</option>
                <option value="top-right">Top right</option>
              </select>
            </Field>
            <Field label="Sort order">
              <Input defaultValue={banner.sortOrder || index + 1} min="1" name={`${banner.key}-sortOrder`} type="number" />
            </Field>
            <div className="grid gap-2 self-end sm:grid-cols-3">
              <CheckField defaultChecked={banner.isActive} label="Active" name={`${banner.key}-isActive`} />
              <CheckField defaultChecked={banner.buttonEnabled} label="Show button" name={`${banner.key}-buttonEnabled`} />
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
