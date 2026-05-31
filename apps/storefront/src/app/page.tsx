import Link from "next/link";
import { ArrowRight, BadgeCheck, Headphones, Sparkles, Truck, Zap } from "lucide-react";
import { formatCurrency } from "@ecommerce/shared";
import { listActivePromotionBanners, listStorefrontCategories, listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CategoryCard } from "@/components/commerce/category-card";
import { LocalizedProductVisual } from "@/components/commerce/localized-product-visual";
import { ProductCard } from "@/components/commerce/product-card";
import { PromotionBannerCarousel } from "@/components/commerce/promotion-banner-carousel";
import { ReviewWall } from "@/components/commerce/review-wall";
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
  const featuredCategoryKeys = new Set(data.homepage.featuredCategoryCards ?? []);
  const configuredCategories = categories.filter(
    (category) =>
      featuredCategoryKeys.has(category.id) ||
      featuredCategoryKeys.has(category.slug ?? "") ||
      featuredCategoryKeys.has(category.name)
  );
  const featuredCategories = (configuredCategories.length > 0 ? configuredCategories : categories).slice(0, 4);
  const promotionBanners = listActivePromotionBanners(data);
  const visualProducts = featuredProducts.filter((product) => product.image || product.mainImageUrl || product.galleryImages?.[0]);
  const heroProducts = (visualProducts.length >= 3 ? visualProducts : featuredProducts).slice(0, 3);
  const heroImage = data.homepage.heroImageUrl || data.homepage.heroImage || "";
  const hasHeroImage = /^https?:\/\//.test(heroImage) || heroImage.startsWith("/");

  return (
    <main className="pb-20 md:pb-0">
      {data.homepage.isActive !== false ? (
        <section className="urbanix-container pt-7 sm:pt-10">
          <div className="urbanix-hero-shell grid gap-7 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:p-10">
            {hasHeroImage ? (
              <img
                alt=""
                className="absolute inset-0 size-full object-cover opacity-10 mix-blend-multiply dark:opacity-16 dark:mix-blend-screen"
                data-hero-background-image
                src={heroImage}
              />
            ) : null}
            <div className="relative z-10 flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-primary dark:border-[rgba(59,158,255,0.22)] dark:bg-[rgba(59,158,255,0.12)] dark:text-[#8bdcff]">
                <Sparkles className="size-3.5" />
                Urban Lifestyle Tech
              </div>
              <div>
                <h1 className="urbanix-gradient-text max-w-3xl text-5xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
                  <LocalizedValue fallback={data.homepage.heroTitle} value={data.homepage.localizedHeroTitle} />
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  <LocalizedValue fallback={data.homepage.heroSubtitle} value={data.homepage.localizedHeroSubtitle} />
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className={buttonVariants({
                    className: "rounded-full bg-linear-to-r from-primary via-[#14c8ff] to-[#7c3cff] text-white shadow-[0_16px_40px_rgba(26,86,219,0.28)] hover:scale-[1.02]",
                    size: "lg",
                  })}
                  href={data.homepage.heroButtonLink || "/products"}
                >
                  <LocalizedValue fallback={data.homepage.heroButtonText} value={data.homepage.localizedHeroButtonText} /> <ArrowRight />
                </Link>
                <Link
                  className={buttonVariants({
                    className: "rounded-full border-primary/20 bg-white/65 text-primary backdrop-blur hover:bg-white dark:border-[rgba(59,158,255,0.22)] dark:bg-white/8 dark:text-[#c8eeff] dark:hover:bg-white/12",
                    size: "lg",
                    variant: "outline",
                  })}
                  href="/categories"
                >
                  Explore Categories
                </Link>
              </div>
              <div className="hidden max-w-xl grid-cols-3 gap-2 text-xs font-bold text-muted-foreground sm:grid">
                {["Premium Feel", "Fast Order", "Youth Picks"].map((item) => (
                  <div className="rounded-2xl border border-border/60 bg-card/70 px-3 py-2 dark:border-[rgba(59,158,255,0.12)] dark:bg-white/5" key={item}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative z-10 grid gap-3 self-start sm:grid-cols-3 lg:grid-cols-2">
              {heroProducts.map((product, index) => (
                <Link
                  className={`group overflow-hidden rounded-3xl border border-white/75 bg-white/70 p-2 shadow-[0_18px_50px_rgba(17,37,68,0.12)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-primary/30 dark:border-[rgba(59,158,255,0.16)] dark:bg-white/8 dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${
                    index === 0 ? "sm:col-span-3 lg:col-span-2" : ""
                  }`}
                  href={`/products/${product.slug}`}
                  key={product.id}
                >
                  <div className={index === 0 ? "grid gap-3 sm:grid-cols-[0.78fr_1fr] sm:items-center" : ""}>
                    <LocalizedProductVisual
                      alt={product.name}
                      className={index === 0 ? "aspect-[4/3]" : "aspect-square"}
                      product={product}
                      tone={product.imageTone}
                    />
                    <div className="px-2 py-3">
                      <p className="line-clamp-2 text-sm font-black text-foreground transition group-hover:text-primary">
                        <LocalizedValue fallback={product.name} value={product.localizedName} />
                      </p>
                      <div className="mt-2">
                        {product.originalPrice && product.originalPrice > product.price ? (
                          <p className="text-[0.68rem] leading-none text-muted-foreground line-through">
                            {formatCurrency(product.originalPrice)}
                          </p>
                        ) : null}
                        <p className="text-base font-black text-primary dark:text-[#ffd166]">
                          {formatCurrency(product.price)}
                        </p>
                      </div>
                      {product.variantGroups?.length ? (
                        <p className="mt-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-muted-foreground">Options Available</p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <PromotionBannerCarousel
        banners={promotionBanners}
        fallback={data.homepage}
        freeShippingText={data.settings.freeShippingText}
      />

      <section className="urbanix-container urbanix-section">
        <SectionHeader action="/categories" subtitle="Car holders, car scents, cooling essentials, and daily urban accessories." subtitleKey="home.categoryCaption" title="Shop by Category" titleKey="home.shopByCategory" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {featuredCategories.map((category) => (
            <CategoryCard category={category} key={category.id} />
          ))}
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <SectionHeader action="/products" subtitle="Clean product cards, quick actions, and mobile-first shopping." subtitleKey="home.featuredCaption" title="Featured Picks" titleKey="home.featuredPicks" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Phase 3B Review Wall — hand-curated social proof between
          Featured Picks and the promo strip. Static data, no DB. */}
      <ReviewWall />

      <section className="urbanix-container urbanix-section pt-0">
        <div className="urbanix-hero-shell grid gap-5 p-5 text-foreground sm:p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-[#14c8ff] text-white shadow-[0_14px_32px_rgba(26,86,219,0.28)]">
            <Zap className="size-7" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black sm:text-3xl">Urban Drive Sale</h2>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              <LocalizedValue fallback={data.homepage.promotionStripText} value={data.homepage.localizedPromoStripText} /> | Up to 30% off selected accessories.
            </p>
          </div>
          <Link className={buttonVariants({ className: "relative z-10 rounded-full", variant: "secondary" })} href="/products">
            Shop Deals
          </Link>
        </div>
      </section>

      <section className="urbanix-container urbanix-section pt-0">
        <SectionHeader action="/our-story" subtitle="Built for everyday Malaysia: practical, premium, and trend-aware." title="Why Urbanix" titleKey="home.whyShop" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              icon: BadgeCheck,
              title: "Premium Quality",
              titleKey: "home.trust.premiumQuality.title",
              text: "Curated picks with better everyday feel.",
              textKey: "home.trust.premiumQuality.text",
            },
            {
              icon: Zap,
              title: "Smart Lifestyle",
              titleKey: "home.trust.smartLifestyle.title",
              text: "Tech-inspired accessories for urban routines.",
              textKey: "home.trust.smartLifestyle.text",
            },
            {
              icon: Truck,
              title: "Fast Delivery",
              titleKey: "home.trust.fastDelivery.title",
              text: "Quick order flow and clear shipping info.",
              textKey: "home.trust.fastDelivery.text",
            },
            {
              icon: Sparkles,
              title: "Trendy Products",
              titleKey: "home.trust.trendyProducts.title",
              text: "Useful gear that still looks good.",
              textKey: "home.trust.trendyProducts.text",
            },
            {
              icon: Headphones,
              title: "Customer Support",
              titleKey: "home.trust.customerSupport.title",
              text: "WhatsApp-first help when you need it.",
              textKey: "home.trust.customerSupport.text",
            },
          ].map(({ icon: Icon, text, textKey, title, titleKey }) => (
            <article className="urbanix-glass p-4" key={title}>
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-[rgba(59,158,255,0.12)] dark:text-[#8bdcff]">
                <Icon className="size-5" />
              </div>
              <h3 className="text-sm font-extrabold">
                <LocalizedText fallback={title} k={titleKey} />
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                <LocalizedText fallback={text} k={textKey} />
              </p>
            </article>
          ))}
        </div>
      </section>

    </main>
  );
}

function SectionHeader({ action, subtitle, subtitleKey, title, titleKey }: { title: string; titleKey: string; action: string; subtitle?: string; subtitleKey?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-2xl font-black uppercase tracking-wide text-primary dark:text-[#8bdcff] sm:text-3xl">
          <LocalizedText fallback={title} k={titleKey} />
        </h2>
        {subtitle ? <p className="max-w-xl text-sm text-muted-foreground">{subtitleKey ? <LocalizedText fallback={subtitle} k={subtitleKey} /> : subtitle}</p> : null}
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
