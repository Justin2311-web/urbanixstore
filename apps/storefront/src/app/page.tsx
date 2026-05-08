import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Car, Fan, Leaf, Sparkles, Truck } from "lucide-react";
import { trustBadges } from "@ecommerce/shared";
import { listStorefrontCategories, listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CategoryCard } from "@/components/commerce/category-card";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductVisual } from "@/components/commerce/product-visual";
import { TrustBadge } from "@/components/commerce/trust-badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const data = await readUrbanixStoreDataAsync();
  const categories = listStorefrontCategories(data);
  const products = listStorefrontProducts(data);
  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
  const featuredCategories = categories.filter((category) => data.homepage.featuredCategoryCards.includes(category.id));

  return (
    <main className="pb-20 md:pb-0">
      <section className="urbanix-container pt-5 sm:pt-8 lg:pt-10">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-white shadow-[0_24px_70px_rgba(14,92,86,0.24)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(23,165,137,0.75),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(255,107,74,0.25),transparent_25%)]" />
          <div className="relative grid min-h-[430px] gap-4 md:min-h-[390px] md:grid-cols-[1fr_0.95fr]">
            <div className="flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-14">
              <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                {data.homepage.heroTitle}
              </h1>
              <p className="max-w-sm text-base font-medium leading-7 text-white/86 sm:text-lg">
                {data.homepage.heroSubtitle}
              </p>
              <Link
                className={buttonVariants({
                  className: "w-fit bg-accent text-white hover:bg-accent/90",
                  size: "lg",
                })}
                href={data.homepage.heroButtonLink}
              >
                {data.homepage.heroButtonText}
              </Link>
              <div className="grid max-w-md grid-cols-3 gap-3 pt-2 text-[0.7rem] font-semibold text-white/85 sm:text-xs">
                <HeroPoint icon={Fan} label="Portable comfort" />
                <HeroPoint icon={Car} label="Smarter drives" />
                <HeroPoint icon={Leaf} label="Daily essentials" />
              </div>
            </div>
            <div className="relative flex items-end justify-center px-8 pb-8 md:items-center md:p-10">
              <div className="absolute bottom-8 right-6 hidden rounded-3xl bg-white/12 p-4 backdrop-blur md:block">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Sparkles className="size-4 text-accent" />
                  Curated Urban Picks
                </div>
                <p className="mt-1 max-w-40 text-xs text-white/70">Useful things, beautifully chosen.</p>
              </div>
              <ProductVisual
                className="w-full max-w-[280px] border border-white/15 bg-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:max-w-[330px]"
                tone={(data.homepage.heroImage || "fan-green") as never}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <SectionHeader action="/categories" title="Shop by Category" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {featuredCategories.map((category) => (
            <CategoryCard category={category} key={category.id} />
          ))}
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <SectionHeader action="/products" title="Featured Picks" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <div className="grid gap-5 overflow-hidden rounded-3xl bg-accent p-5 text-white shadow-[0_18px_45px_rgba(255,107,74,0.22)] sm:p-6 md:grid-cols-[auto_1fr_auto] md:items-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/18">
            <Truck className="size-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">{data.homepage.promotionStripText}</h2>
            <p className="text-sm font-semibold text-white/85">For orders over RM{data.settings.freeShippingMinimumAmount}</p>
          </div>
          <Link
            className={buttonVariants({
              className: "w-fit bg-white text-foreground hover:bg-white/90",
            })}
            href="/products"
          >
            {data.homepage.heroButtonText}
          </Link>
        </div>
      </section>

      <section className="urbanix-container urbanix-section">
        <div className="mb-4">
          <h2 className="text-lg font-extrabold uppercase text-primary">
            Why Shop With Urbanix Store
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

function SectionHeader({ action, title }: { title: string; action: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-extrabold uppercase text-primary">{title}</h2>
      <Link className="flex items-center gap-1 text-xs font-bold text-primary" href={action}>
        View all <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function HeroPoint({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/10 p-3 backdrop-blur sm:flex-row sm:items-center">
      <Icon className="size-4 text-white" />
      <span>{label}</span>
    </div>
  );
}
