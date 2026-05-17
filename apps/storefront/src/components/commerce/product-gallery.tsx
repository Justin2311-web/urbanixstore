"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { UrbanixProduct } from "@ecommerce/shared";
import { ProductVisual } from "@/components/commerce/product-visual";
import { PromotionBadge } from "@/components/commerce/promotion-badge";
import { cn } from "@/lib/utils";

const galleryTones: Record<UrbanixProduct["imageTone"], UrbanixProduct["imageTone"][]> = {
  "fan-green": ["fan-green", "fan-cream", "fan-black", "fan-green"],
  "fan-cream": ["fan-cream", "fan-green", "fan-black", "fan-cream"],
  "fan-black": ["fan-black", "fan-green", "fan-cream", "fan-black"],
  car: ["car", "fan-black", "car", "cable"],
  perfume: ["perfume", "car", "perfume", "cable"],
  cable: ["cable", "car", "cable", "fan-black"],
};

export function ProductGallery({ product }: { product: UrbanixProduct }) {
  const tones = galleryTones[product.imageTone];
  const imageUrls = product.galleryImages?.length
    ? product.galleryImages
    : product.image
      ? [product.image]
      : [];
  const hasMultiple = imageUrls.length > 1;
  const total = imageUrls.length || tones.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [variantImageUrl, setVariantImageUrl] = useState("");
  const activeImage = variantImageUrl || (imageUrls.length ? imageUrls[activeIndex] : undefined);

  // Auto-slide every 4 s — only when multiple real images and no variant override
  useEffect(() => {
    if (!hasMultiple || variantImageUrl) return;
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % imageUrls.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [hasMultiple, imageUrls.length, variantImageUrl]);

  // Variant image override via custom event from purchase panel
  useEffect(() => {
    function handleVariantImage(event: Event) {
      setVariantImageUrl(String((event as CustomEvent<string>).detail ?? ""));
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
    <section className="flex flex-col gap-3">
      {/* ── Main image with prev/next arrows ── */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute left-3 top-3 z-10">
          <PromotionBadge percent={product.promotionPercent} />
        </div>

        <ProductVisual
          alt={product.name}
          className="shadow-[0_16px_48px_rgba(15,23,42,0.08)]"
          data-product-main-image
          imageUrl={activeImage}
          tone={tones[activeIndex] ?? product.imageTone}
        />

        {hasMultiple && !variantImageUrl ? (
          <>
            <button
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
              onClick={() => navigate(-1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-20 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/55 active:scale-95"
              onClick={() => navigate(1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
              {imageUrls.map((_, i) => (
                <button
                  aria-label={`Go to image ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    activeIndex === i
                      ? "w-5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                      : "w-1.5 bg-white/55 hover:bg-white/75"
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

      {/* ── Thumbnails ── */}
      <div className="grid grid-cols-4 gap-2">
        {(imageUrls.length > 0 ? imageUrls : tones).map((item, index) => (
          <button
            aria-label={`View product image ${index + 1}`}
            className={cn(
              "rounded-xl border bg-card p-1 transition hover:border-primary/40",
              activeIndex === index
                ? "border-primary ring-2 ring-primary/15"
                : "border-border"
            )}
            key={`${item}-${index}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <ProductVisual
              alt={`${product.name} thumbnail ${index + 1}`}
              className="rounded-lg"
              imageUrl={imageUrls.length > 0 ? item : undefined}
              tone={
                imageUrls.length > 0
                  ? product.imageTone
                  : (item as UrbanixProduct["imageTone"])
              }
            />
          </button>
        ))}
      </div>
    </section>
  );
}
