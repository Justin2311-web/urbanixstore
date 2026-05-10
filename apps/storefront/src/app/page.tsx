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

      <section className="urbanix-container urbanix-section">
        <div className="grid gap-5 overflow-hidden rounded-3xl border border-accent/20 bg-linear-to-r from-accent via-[#ff784f] to-[#ff9f43] p-5 text-white shadow-[0_18px_45px_rgba(255,107,74,0.22)] sm:p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/25">
            <Truck className="size-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              <LocalizedValue fallback={data.homepage.promotionStripText} value={data.settings.freeShippingText} />
            </h2>
            <p className="text-sm font-semibold text-white/85">Auto-applies from RM{data.settings.freeShippingMinimumAmount} orders. WhatsApp ordering stays fast and simple.</p>
          </div>
          <Link
            className={buttonVariants({
              className: "w-fit bg-white text-foreground hover:bg-white/90",
            })}
            href="/products"
          >
            <LocalizedText fallback={data.homepage.heroButtonText} k={data.homepage.heroButtonText === "Shop Now" ? "common.shopNow" : `hero.${data.homepage.heroButtonText}`} />
          </Link>
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold uppercase text-primary">
            <LocalizedText fallback="Why Shop With Urbanix Store" k="home.whyShop" />
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
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
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-extrabold uppercase text-primary"><LocalizedText fallback={title} k={titleKey} /></h2>
      <Link className="flex items-center gap-1 text-xs font-bold text-primary" href={action}>
        <LocalizedText fallback="View all" k="home.viewAll" /> <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
