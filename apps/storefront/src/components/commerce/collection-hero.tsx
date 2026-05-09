import { BatteryFull, Fan, Feather } from "lucide-react";
import type { ProductCategory } from "@ecommerce/shared";
import { ProductVisual } from "@/components/commerce/product-visual";
import { LocalizedText } from "@/components/i18n/localized-text";

const copyByCategory: Record<string, string> = {
  "portable-fans": "Powerful. Portable. Stay cool anywhere.",
  "car-accessories": "Drive smarter with compact daily upgrades.",
  "home-picks": "Simple home picks that elevate your space.",
  lifestyle: "Everyday essentials for a smoother urban routine.",
};

export function CollectionHero({
  category,
  title = "Shop Urbanix Picks",
  titleKey,
}: {
  title?: string;
  titleKey?: string;
  category?: ProductCategory;
}) {
  const subtitle = category
    ? category.description || copyByCategory[category.id]
    : "Curated essentials for smart urban living.";

  return (
    <section className="mb-6 overflow-hidden rounded-3xl bg-primary text-white shadow-[0_22px_60px_rgba(14,92,86,0.22)]">
      <div className="grid gap-4 md:grid-cols-[1fr_0.65fr]">
        <div className="flex flex-col justify-center gap-5 p-6 sm:p-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
              <LocalizedText fallback={category?.name ?? title} k={category ? `category.${category.name}` : titleKey ?? title} />
            </h1>
            <p className="mt-2 max-w-md text-sm font-medium leading-6 text-white/85">
              {subtitle}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[0.68rem] font-semibold text-white/85 sm:max-w-md sm:text-xs">
            <FeatureBadge icon={Fan} label="Powerful Airflow" />
            <FeatureBadge icon={Feather} label="Compact & Light" />
            <FeatureBadge icon={BatteryFull} label="Long Battery Life" />
          </div>
        </div>
        <div className="hidden items-center justify-center bg-[radial-gradient(circle_at_center,rgba(23,165,137,0.8),transparent_45%)] p-6 md:flex">
          <ProductVisual className="max-w-52 bg-white/10" tone="fan-green" />
        </div>
      </div>
    </section>
  );
}

function FeatureBadge({
  icon: Icon,
  label,
}: {
  icon: typeof Fan;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/10 p-3 sm:flex-row sm:items-center">
      <Icon className="size-4" />
      <span>{label}</span>
    </div>
  );
}
