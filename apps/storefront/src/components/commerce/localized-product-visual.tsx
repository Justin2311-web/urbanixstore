"use client";

import type { ComponentProps } from "react";
import type { UrbanixProduct } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";
import { ProductVisual } from "@/components/commerce/product-visual";
import { getProductImageForLanguage } from "@/lib/product-media";

type LocalizedProductVisualProps = ComponentProps<typeof ProductVisual> & {
  product: UrbanixProduct;
};

export function LocalizedProductVisual({ product, imageUrl, ...props }: LocalizedProductVisualProps) {
  const { language } = useLanguage();

  return (
    <ProductVisual
      {...props}
      imageUrl={imageUrl ?? getProductImageForLanguage(product, language)}
      tone={props.tone ?? product.imageTone}
    />
  );
}
