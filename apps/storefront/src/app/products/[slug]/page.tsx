import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { ProductGrid } from "@/components/commerce/product-grid";
import { ProductHighlights } from "@/components/commerce/product-highlights";
import { ProductPurchasePanel } from "@/components/commerce/product-purchase-panel";
import { ProductSpecifications } from "@/components/commerce/product-specifications";
import { ProductTrustBadges } from "@/components/commerce/product-trust-badges";
import { StockBadge } from "@/components/commerce/stock-badge";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { freeShippingCopy } from "@/lib/shipping-text";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await readUrbanixStoreDataAsync();
    const product = listStorefrontProducts(data).find((item) => item.slug === slug);
    if (!product) return {};

    const siteUrl = getSiteUrl();
    const title = product.name;
    const description = product.shortDescription || product.description?.slice(0, 160) || product.name;
    const image = product.image || product.galleryImages?.[0] || product.productImages?.[0]?.imageUrl || "/urbanix-logo.png";

    return {
      title,
      description,
      alternates: { canonical: `/products/${slug}` },
      openGraph: {
        type: "website",
        title,
        description,
        url: `${siteUrl}/products/${slug}`,
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await readUrbanixStoreDataAsync();
  const products = listStorefrontProducts(data);
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 8);
  const deliveryInfo = freeShippingCopy(data.settings, product.shippingInfo);
  const siteUrl = getSiteUrl();
  const productImages = [
    product.image,
    ...(product.galleryImages ?? []),
    ...(product.productImages?.map((entry) => entry.imageUrl) ?? []),
  ].filter((value): value is string => Boolean(value));
  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description,
    sku: product.sku,
    image: productImages.length > 0 ? productImages : ["/urbanix-logo.png"],
    brand: { "@type": "Brand", name: data.settings.storeName || "Urbanix Store" },
    aggregateRating:
      product.sold && product.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: Math.max(1, product.sold),
          }
        : undefined,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.slug}`,
      priceCurrency: "MYR",
      price: product.price.toFixed(2),
      availability:
        product.stockStatus === "out_of_stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };

  return (
    <main className="urbanix-container py-8 pb-24 sm:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* ── Main product section: image left, info right ── */}
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-8">
        {/* Left: gallery with auto-slide + arrows */}
        <ProductGallery product={product} />

        {/* Right: all product information */}
        <section className="flex flex-col gap-4">
          {/* Stock badge + SKU */}
          <div className="flex flex-wrap items-center gap-2">
            <StockBadge status={product.stockStatus} />
            <span className="rounded-full bg-secondary/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              SKU: {product.sku}
            </span>
          </div>

          {/* Product name + short description */}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              <LocalizedValue fallback={product.name} value={product.localizedName} />
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <LocalizedValue fallback={product.shortDescription} value={product.localizedShortDescription ?? product.localizedDescription} />
            </p>
          </div>

          {/* Rating + sold — only shown when real review/sales data exists */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {product.sold > 0 && product.rating > 0 ? (
              <>
                <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5 font-bold text-muted-foreground">
                  <Star className="size-3.5 fill-warning text-warning" />
                  <span className="text-foreground">{product.rating}</span>
                  <span className="opacity-60">({product.sold} reviews)</span>
                </div>
                <span className="rounded-full bg-cream/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                  {product.sold}+ sold
                </span>
              </>
            ) : (
              <span className="italic text-muted-foreground">
                <LocalizedText fallback="No reviews yet" k="reviews.noReviewsYet" />
              </span>
            )}
          </div>

          {/* Price display + variant selector + add-to-cart (client component) */}
          <ProductPurchasePanel product={product} settings={data.settings} />

          {/* Highlight cards */}
          <ProductHighlights product={product} />

          {/* Site-wide trust badges (PR-C). Always visible, distinct from
              the admin-defined ProductHighlights above. */}
          <ProductTrustBadges settings={data.settings} />
        </section>
      </div>

      {/* ── Info panels ── */}
      <section className="mt-12">
        <div className="grid gap-5 lg:grid-cols-3">
          <InfoPanel title="Description" titleKey="product.description">
            <p>
              <LocalizedValue fallback={product.description} value={product.localizedDescription} />
            </p>
          </InfoPanel>
          <InfoPanel title="Specifications" titleKey="product.specifications">
            <ProductSpecifications product={product} />
          </InfoPanel>
          <InfoPanel title="Delivery Info" titleKey="product.deliveryInfo">
            <p>
              <LocalizedValue fallback={deliveryInfo.en} value={deliveryInfo} />
            </p>
          </InfoPanel>
        </div>
      </section>

      {/* ── Related products ── */}
      {relatedProducts.length > 0 ? (
        <section className="mt-12 border-t border-border/50 pt-12">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              <LocalizedText fallback="Related Products" k="product.relatedProducts" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <LocalizedText fallback="More from the collection." k="product.moreFrom" />
            </p>
          </div>
          <ProductGrid compact products={relatedProducts} />
        </section>
      ) : null}
    </main>
  );
}

function InfoPanel({
  children,
  title,
  titleKey,
}: {
  title: string;
  titleKey?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="urbanix-surface p-6 text-sm leading-relaxed text-muted-foreground">
      <h2 className="mb-4 text-base font-extrabold text-foreground">
        <LocalizedText fallback={title} k={titleKey ?? title} />
      </h2>
      {children}
    </article>
  );
}
