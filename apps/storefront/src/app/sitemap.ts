import type { MetadataRoute } from "next";
import {
  listStorefrontCategories,
  listStorefrontProducts,
  readUrbanixStoreDataAsync,
} from "@ecommerce/shared/store";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

const staticPaths = [
  "/",
  "/products",
  "/categories",
  "/track-order",
  "/contact-us",
  "/our-story",
  "/shipping",
  "/privacy-policy",
  "/terms-and-conditions",
  "/refund-policy",
  "/return-policy",
  "/faq",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1.0 : 0.6,
  }));

  try {
    const data = await readUrbanixStoreDataAsync();
    const products = listStorefrontProducts(data).filter((product) => product.isActive !== false);
    const categories = listStorefrontCategories(data);

    for (const category of categories) {
      entries.push({
        url: `${siteUrl}/categories/${category.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }

    for (const product of products) {
      entries.push({
        url: `${siteUrl}/products/${product.slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // sitemap still returns static paths if catalog read fails
  }

  return entries;
}
