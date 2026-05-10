"use client";

import { useEffect, useState } from "react";
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
  const imageUrls = product.galleryImages?.length ? product.galleryImages : product.image ? [product.image] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [variantImageUrl, setVariantImageUrl] = useState("");
  const activeImage = variantImageUrl || imageUrls[activeIndex];

  useEffect(() => {
    function handleVariantImage(event: Event) {
      setVariantImageUrl(String((event as CustomEvent<string>).detail ?? ""));
    }

    window.addEventListener(`urbanix-product-variant-image:${product.id}`, handleVariantImage);

    return () => {
      window.removeEventListener(`urbanix-product-variant-image:${product.id}`, handleVariantImage);
    };
  }, [product.id]);

  return (
    <section className="relative">
      <div className="absolute left-4 top-4 z-10">
        <PromotionBadge percent={product.promotionPercent} />
      </div>
      <ProductVisual
        alt={product.name}
        className="min-h-[350px] shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:min-h-[460px]"
        data-product-main-image
        imageUrl={activeImage}
        tone={tones[activeIndex] ?? product.imageTone}
      />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {(imageUrls.length > 0 ? imageUrls : tones).map((item, index) => (
          <button
            aria-label={`View product image ${index + 1}`}
            className={cn(
              "rounded-2xl border bg-card p-1 transition",
              activeIndex === index ? "border-primary ring-2 ring-primary/15" : "border-border"
            )}
            key={`${item}-${index}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <ProductVisual
              alt={`${product.name} thumbnail ${index + 1}`}
              className="rounded-xl"
              imageUrl={imageUrls.length > 0 ? item : undefined}
              tone={imageUrls.length > 0 ? product.imageTone : (item as UrbanixProduct["imageTone"])}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
