"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UrbanixProduct } from "@ecommerce/shared";
import { ProductVisual } from "@/components/commerce/product-visual";
import { PromotionBadge } from "@/components/commerce/promotion-badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/i18n/language-provider";
import { getProductImagesForLanguage } from "@/lib/product-media";

type GalleryMode = "product" | "variant";
type VariantImageEventDetail =
  | string
  | {
      imageUrl?: string;
      images?: string[];
      mode?: GalleryMode;
    };

const galleryTones: Record<UrbanixProduct["imageTone"], UrbanixProduct["imageTone"][]> = {
  "fan-green": ["fan-green", "fan-cream", "fan-black", "fan-green"],
  "fan-cream": ["fan-cream", "fan-green", "fan-black", "fan-cream"],
  "fan-black": ["fan-black", "fan-green", "fan-cream", "fan-black"],
  car: ["car", "fan-black", "car", "cable"],
  perfume: ["perfume", "car", "perfume", "cable"],
  cable: ["cable", "car", "cable", "fan-black"],
};

export function ProductGallery({ product }: { product: UrbanixProduct }) {
  const { language } = useLanguage();
  const tones = galleryTones[product.imageTone];

  const baseProductImages = getProductImagesForLanguage(product, language);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeGalleryMode, setActiveGalleryMode] = useState<GalleryMode>("product");
  const [selectedVariantImages, setSelectedVariantImages] = useState<string[]>([]);

  const isVariantMode = activeGalleryMode === "variant" && selectedVariantImages.length > 0;
  const displayedImages = isVariantMode ? selectedVariantImages : baseProductImages;
  const hasMultiple = displayedImages.length > 1;
  const total = displayedImages.length || tones.length;
  const thumbItems = displayedImages.length > 0 ? displayedImages : tones;
  const safeActiveIndex = total > 0 ? Math.min(activeIndex, total - 1) : 0;
  const activeImage = displayedImages.length ? displayedImages[safeActiveIndex] : undefined;

  useEffect(() => {
    if (!hasMultiple) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % displayedImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [displayedImages.length, hasMultiple]);

  useEffect(() => {
    function handleVariantImage(event: Event) {
      const detail = (event as CustomEvent<VariantImageEventDetail>).detail;
      const images = normalizeVariantImages(detail);

      setSelectedVariantImages(images);
      setActiveGalleryMode(images.length > 0 ? "variant" : "product");
      setActiveIndex(0);
    }

    window.addEventListener(`urbanix-product-variant-image:${product.id}`, handleVariantImage);
    return () => {
      window.removeEventListener(`urbanix-product-variant-image:${product.id}`, handleVariantImage);
    };
  }, [product.id]);

  function navigate(dir: 1 | -1) {
    setActiveIndex((i) => ((i + dir + total) % total));
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute left-2.5 top-2.5 z-10">
          <PromotionBadge percent={product.promotionPercent} size="sm" />
        </div>

        {selectedVariantImages.length > 0 ? (
          <div className="absolute right-2.5 top-2.5 z-20 flex rounded-full border border-white/30 bg-black/35 p-1 text-[10px] font-black uppercase tracking-wide text-white shadow-lg backdrop-blur-md dark:border-white/15">
            <button
              aria-pressed={!isVariantMode}
              className={cn(
                "rounded-full px-2.5 py-1 transition",
                !isVariantMode ? "bg-white text-slate-950" : "text-white/80 hover:text-white"
              )}
              onClick={() => {
                setActiveGalleryMode("product");
                setActiveIndex(0);
              }}
              type="button"
            >
              Product Images
            </button>
            <button
              aria-pressed={isVariantMode}
              className={cn(
                "rounded-full px-2.5 py-1 transition",
                isVariantMode ? "bg-white text-slate-950" : "text-white/80 hover:text-white"
              )}
              onClick={() => {
                setActiveGalleryMode("variant");
                setActiveIndex(0);
              }}
              type="button"
            >
              Variant Images
            </button>
          </div>
        ) : null}

        <ProductVisual
          alt={product.name}
          className="aspect-[4/3] bg-muted/25 shadow-[0_16px_42px_rgba(15,23,42,0.08)] dark:bg-[rgba(9,20,38,0.72)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.3)]"
          data-product-main-image
          imageFit="contain"
          imageUrl={activeImage}
          tone={tones[safeActiveIndex] ?? product.imageTone}
        />

        {hasMultiple ? (
          <>
            <button
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
              onClick={() => navigate(1)}
              type="button"
            >
              <ChevronRight className="size-3.5" />
            </button>

            <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-1">
              {displayedImages.map((_, i) => (
                <button
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    safeActiveIndex === i
                      ? "w-4 bg-white shadow-[0_0_4px_rgba(255,255,255,0.6)]"
                      : "w-1 bg-white/55 hover:bg-white/75"
                  )}
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  type="button"
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {thumbItems.length > 1 ? (
        <div className="grid grid-cols-4 gap-1.5 sm:flex sm:gap-1.5 sm:overflow-x-auto sm:pb-0.5">
          {thumbItems.map((item, index) => (
            <button
              aria-label={`View product image ${index + 1}`}
              className={cn(
                "rounded-lg border bg-card/70 p-0 transition hover:border-primary/40 dark:bg-[rgba(11,21,40,0.78)] sm:w-[3.25rem] sm:shrink-0",
                safeActiveIndex === index
                  ? "border-primary ring-2 ring-primary/15"
                  : "border-border"
              )}
              key={`${item}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <ProductVisual
                alt={`${product.name} thumbnail ${index + 1}`}
                className="aspect-square rounded-md bg-transparent"
                imageFit="contain"
                imageUrl={displayedImages.length > 0 ? item : undefined}
                tone={
                  displayedImages.length > 0
                    ? product.imageTone
                    : (item as UrbanixProduct["imageTone"])
                }
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function normalizeVariantImages(detail: VariantImageEventDetail): string[] {
  if (typeof detail === "string") return detail ? [detail] : [];
  if (!detail) return [];

  const images = detail.images?.length ? detail.images : detail.imageUrl ? [detail.imageUrl] : [];
  return Array.from(new Set(images.map((image) => image.trim()).filter(Boolean)));
}
