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
            <input name={`${banner.key}-desktopImageUrl`} type="hidden" value={banner.desktopImageUrl} />
            <input name={`${banner.key}-mobileImageUrl`} type="hidden" value={banner.mobileImageUrl} />
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
            <Field label="Desktop banner image">
              <Input accept="image/*" name={`${banner.key}-desktopFile`} type="file" />
            </Field>
            <Field label="Mobile banner image">
              <Input accept="image/*" name={`${banner.key}-mobileFile`} type="file" />
            </Field>
            {(banner.desktopImageUrl || banner.mobileImageUrl) ? (
              <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
                {banner.desktopImageUrl ? (
                  <img alt="Desktop banner preview" className="aspect-[16/6] w-full rounded-2xl border object-cover" src={banner.desktopImageUrl} />
                ) : null}
                {banner.mobileImageUrl ? (
                  <img alt="Mobile banner preview" className="aspect-[4/5] w-full rounded-2xl border object-cover md:max-w-56" src={banner.mobileImageUrl} />
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
      <SaveButton />
    </form>
  );
}
