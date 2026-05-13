"use client";

import { ImageUploadField } from "@/components/image-upload-field";

/**
 * Thin wrapper so the server component HomepagePage can include a client-side
 * image upload field without converting the whole page to "use client".
 */
export function HeroImageField({ initialUrl }: { initialUrl?: string | null }) {
  return (
    <ImageUploadField
      bucket="banners"
      storagePath="hero"
      name="hero_image_url"
      initialUrl={initialUrl}
    />
  );
}
