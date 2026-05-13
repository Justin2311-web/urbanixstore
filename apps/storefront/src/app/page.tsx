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
      description: title === "Free Shipping" ? `Orders above RM${data.settings.freeShippingMinimumAmount}` : title === "WhatsApp Order" ? "Fast confirmation" : "",
      title,
    }));

  return (
    <main className="pb-20 md:pb-0">
      <PromotionBannerCarousel
        banners={promotionBanners}
        fallback={{
          ...data.homepage,
          heroSubtitle: "Shop confidently with WhatsApp ordering, Cloudinary product visuals, and marketplace-ready links.",
          heroTitle: data.settings.freeShippingText?.en ?? data.homepage.heroTitle,
        }}
        freeShippingText={data.settings.freeShippingText}
      />

      <section className="urbanix-container urbanix-section">
        <SectionHeader action="/categories" title="Shop by Category" titleKey="home.shopByCategory" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {featuredCategories.map((category) => (
            <CategoryCard category={category} key={category.id} />
          ))}
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <SectionHeader action="/products" title="Featured Picks" titleKey="home.featuredPicks" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} settings={data.settings} />
          ))}
        </div>
      </section>

      {/* Promotional CTA banner */}
      <section className="urbanix-container urbanix-section">
        <div className="relative grid gap-5 overflow-hidden rounded-3xl p-5 sm:p-7 md:grid-cols-[auto_1fr_auto] md:items-center">
          {/* Background layers */}
          <div className="absolute inset-0 bg-linear-to-br from-[#1245b8] via-[#1a56db] to-[#1e78f0] dark:from-[#040d24] dark:via-[#091833] dark:to-[#0c2140]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(59,158,255,0.22),transparent)] dark:bg-[radial-gradient(ellipse_70%_80%_at_80%_50%,rgba(59,158,255,0.15),transparent)]" />
          <div className="absolute right-0 top-0 size-64 rounded-full bg-white/5 blur-3xl" />

          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Truck className="size-7 text-white" />
          </div>
          <div className="relative">
            <h2 className="text-xl font-extrabold text-white sm:text-2xl">
              <LocalizedValue fallback={data.homepage.promotionStripText} value={data.settings.freeShippingText} />
            </h2>
            <p className="mt-1 text-sm font-medium text-white/75">Auto-applies from RM{data.settings.freeShippingMinimumAmount} orders. WhatsApp ordering stays fast and simple.</p>
          </div>
          <Link
            className={buttonVariants({
              className: "relative w-fit bg-white text-[#1245b8] font-bold hover:bg-white/92 shadow-[0_4px_16px_rgba(0,0,0,0.2)]",
            })}
            href="/products"
          >
            <LocalizedText fallback={data.homepage.heroButtonText} k={data.homepage.heroButtonText === "Shop Now" ? "common.shopNow" : `hero.${data.homepage.heroButtonText}`} />
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Trust badges */}
      <section className="urbanix-container urbanix-section">
        <SectionHeader action="#" title="Why Shop With Us" titleKey="home.whyShop" />
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {trustBadges.map((badge, index) => (
            <TrustBadge badge={badge} index={index} key={badge.title} />
          ))}
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ action, title, titleKey }: { title: string; titleKey: string; action: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-extrabold uppercase tracking-wide text-primary dark:text-[#3b9eff]">
          <LocalizedText fallback={title} k={titleKey} />
        </h2>
        <div className="h-0.5 w-8 rounded-full bg-primary/40 dark:bg-[rgba(59,158,255,0.4)]" />
      </div>
      <Link
        className="flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/8 dark:border-[rgba(59,158,255,0.2)] dark:text-[#3b9eff] dark:hover:bg-[rgba(59,158,255,0.08)]"
        href={action}
      >
        <LocalizedText fallback="View all" k="home.viewAll" />
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
