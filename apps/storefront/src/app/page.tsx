import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";
import { listActivePromotionBanners, listStorefrontCategories, listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CategoryCard } from "@/components/commerce/category-card";
import { ProductCard } from "@/components/commerce/product-card";
import { PromotionBannerCarousel } from "@/components/commerce/promotion-banner-carousel";
import { TrustBadge } from "@/components/commerce/trust-badge";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const data = await readUrbanixStoreDataAsync();
  const categories = listStorefrontCategories(data);
  const products = listStorefrontProducts(data);
  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
  const featuredCategories = categories.filter((category) => data.homepage.featuredCategoryCards.includes(category.id));
  const promotionBanners = listActivePromotionBanners(data);
  const trustBadges = data.homepage.trustBadgeText
    .filter((title) => !title.toLowerCase().includes("return"))
    .map((title) => ({
      description: title === "Free Shipping" ? `Orders above RM${data.settings.freeShippingMinimumAmount}` : title === "WhatsApp Order" ? "Quick and easy confirmation" : "Premium selection for you",
      title,
    }));

  return (
    <main className="bg-[#fdfcfb] pb-24 md:pb-0">
      <PromotionBannerCarousel
        banners={promotionBanners}
        fallback={{
          ...data.homepage,
          heroSubtitle: "Simple, elegant, and curated essentials for your modern lifestyle.",
          heroTitle: data.settings.freeShippingText?.en ?? data.homepage.heroTitle,
        }}
        freeShippingText={data.settings.freeShippingText}
      />

      <section className="urbanix-container urbanix-section">
        <SectionHeader action="/categories" subtitle="Find exactly what you need in our curated collections." title="Shop by Category" titleKey="home.shopByCategory" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {featuredCategories.map((category) => (
            <CategoryCard category={category} key={category.id} />
          ))}
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <SectionHeader action="/products" subtitle="Handpicked favorites that we think you'll love." title="Featured Picks" titleKey="home.featuredPicks" />
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} settings={data.settings} />
          ))}
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <div className="urbanix-surface flex flex-col items-center justify-between gap-8 p-10 md:flex-row md:p-16">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-secondary/50">
            <Truck className="size-10 text-primary" />
          </div>
          <div className="grow text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-foreground">
              <LocalizedValue fallback={data.homepage.promotionStripText} value={data.settings.freeShippingText} />
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">Automatically applied at checkout for orders above RM{data.settings.freeShippingMinimumAmount}.</p>
          </div>
          <Link
            className={buttonVariants({
              className: "h-14 rounded-full px-10 text-sm font-black uppercase tracking-widest",
              size: "lg",
            })}
            href="/products"
          >
            Explore More
          </Link>
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <div className="mb-12 text-center md:text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            <LocalizedText fallback="Why Shop With Urbanix" k="home.whyShop" />
          </h2>
          <p className="mt-2 text-muted-foreground">We focus on quality, simplicity, and your satisfaction.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {trustBadges.map((badge, index) => (
            <TrustBadge badge={badge} index={index} key={badge.title} />
          ))}
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ action, subtitle, title, titleKey }: { title: string; titleKey: string; action: string; subtitle?: string }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground"><LocalizedText fallback={title} k={titleKey} /></h2>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      <Link className="flex w-fit items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-secondary/30" href={action}>
        <LocalizedText fallback="View all" k="home.viewAll" /> <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

