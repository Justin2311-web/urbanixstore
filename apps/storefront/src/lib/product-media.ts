"use client";

import type { LanguageCode, UrbanixProduct } from "@ecommerce/shared";

export function getProductImagesForLanguage(product: UrbanixProduct, language: LanguageCode): string[] {
  const localized = product.localizedImages;
  const selected = localized?.[language] ?? [];
  const english = localized?.en ?? [];
  const fallback = [
    product.image,
    product.mainImageUrl,
    ...(product.galleryImages ?? []),
  ].filter((value): value is string => Boolean(value));

  return (selected.length > 0 ? selected : english.length > 0 ? english : fallback).filter(Boolean);
}

export function getProductImageForLanguage(product: UrbanixProduct, language: LanguageCode): string | undefined {
  return getProductImagesForLanguage(product, language)[0];
}
