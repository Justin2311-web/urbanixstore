import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listActivePromotionBanners, listStorefrontCategories, listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CategoryCard } from "@/components/commerce/category-card";
import { ProductCard } from "@/components/commerce/product-card";
import { PromotionBannerCarousel } from "@/components/commerce/promotion-banner-carousel";
import { LocalizedText } from "@/components/i18n/localized-text";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const data = await readUrbanixStoreDataAsync();
  const categories = listStorefrontCategories(data);
  const products = listStorefrontProducts(data);
  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
  const featuredCategories = categories.filter((category) => data.homepage.featuredCategoryCards.includes(category.id));
  const promotionBanners = listActivePromotionBanners(data);

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
            <ProductCard key={product.id} product={product} />
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
