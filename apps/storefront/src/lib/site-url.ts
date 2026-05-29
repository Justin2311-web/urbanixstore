// Resolves the canonical site URL for metadata, sitemap, robots, and JSON-LD.
// Set NEXT_PUBLIC_SITE_URL to your production domain (e.g. https://urbanix-storefront.vercel.app
// or your custom domain). Falls back to Vercel's deployment URL or localhost in dev.

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}
