"use client";

import { Check } from "lucide-react";
import type { UrbanixProduct } from "@ecommerce/shared";
import { useLocalizedArray } from "@/components/i18n/localized-array";

export function ProductSpecifications({ product }: { product: UrbanixProduct }) {
  const specifications = useLocalizedArray(product.localizedSpecifications, product.specifications);

  return (
    <ul className="flex flex-col gap-2.5">
      {specifications.map((spec) => (
        <li className="flex gap-3" key={spec}>
          <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success/10">
            <Check className="size-2.5 text-success" />
          </div>
          {spec}
        </li>
      ))}
    </ul>
  );
}
