"use client";

import { useState } from "react";
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
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="relative">
      <div className="absolute left-4 top-4 z-10">
        <PromotionBadge percent={product.promotionPercent} />
      </div>
      <ProductVisual
        className="min-h-[350px] shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:min-h-[460px]"
        tone={tones[activeIndex]}
      />
      <div className="mt-3 grid grid-cols-4 gap-2">
        {tones.map((tone, index) => (
          <button
            aria-label={`View product image ${index + 1}`}
            className={cn(
              "rounded-2xl border bg-card p-1 transition",
              activeIndex === index ? "border-primary ring-2 ring-primary/15" : "border-border"
            )}
            key={`${tone}-${index}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <ProductVisual className="rounded-xl" tone={tone} />
          </button>
        ))}
      </div>
    </section>
  );
}
