"use client";

import { LockKeyhole, ShieldCheck, Sparkles, Truck } from "lucide-react";
import type { UrbanixProduct } from "@ecommerce/shared";
import { useLocalizedArray } from "@/components/i18n/localized-array";

const icons = [Sparkles, Truck, LockKeyhole, ShieldCheck];

export function ProductHighlights({ product }: { product: UrbanixProduct }) {
  const items = useLocalizedArray(product.localizedHighlights, product.highlights ?? []).filter(Boolean).slice(0, 4);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((title, index) => {
        const Icon = icons[index] ?? Sparkles;
        return (
          <div className="urbanix-surface p-4 transition-transform hover:scale-[1.02]" key={`${title}-${index}`}>
            <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Icon className="size-5" />
            </div>
            <h2 className="text-sm font-extrabold text-foreground">{title}</h2>
          </div>
        );
      })}
    </div>
  );
}
