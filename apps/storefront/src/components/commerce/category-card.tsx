import Link from "next/link";
import { ArrowRight, Backpack, Car, Fan, Lamp } from "lucide-react";
import type { ProductCategory } from "@ecommerce/shared";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { cn } from "@/lib/utils";

const toneStyles: Record<ProductCategory["tone"], string> = {
  teal: "bg-[#e8f2ff] text-primary",
  mint: "bg-[#eef7ff] text-primary",
  peach: "bg-[#fff0df] text-[#9f4b2f]",
  lilac: "bg-[#f0eaf8] text-[#4f3b6d]",
  sky: "bg-[#e8f3ff] text-[#245f9f]",
  rose: "bg-[#ffe8ee] text-[#9f2f55]",
  amber: "bg-[#fff5d8] text-[#8a5a00]",
  slate: "bg-[#e8edf2] text-[#263442]",
  lime: "bg-[#ebf9dc] text-[#3f6f1b]",
  violet: "bg-[#eee9ff] text-[#493783]",
  sand: "bg-[#f4ead9] text-[#66451f]",
  dark: "bg-[#1f2937] text-white",
  "fan-green": "bg-[#dcecff] text-primary",
  "fan-orange": "bg-[#ffe6d8] text-[#9f4b2f]",
};

const icons = {
  backpack: Backpack,
  car: Car,
  fan: Fan,
  home: Lamp,
  lamp: Lamp,
  "Portable Fans": Fan,
  "Car Accessories": Car,
  "Home Picks": Lamp,
  Lifestyle: Backpack,
};

export function CategoryCard({ category }: { category: ProductCategory }) {
  const Icon = icons[(category.icon || category.name) as keyof typeof icons] ?? Fan;

  return (
    <Link
      className={cn(
        "group flex min-h-28 flex-col justify-between rounded-2xl p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md",
        toneStyles[category.tone]
      )}
      href={category.href}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">
            <LocalizedValue fallback={category.name} value={category.localizedName} />
          </h3>
          <p className="mt-1 text-xs opacity-75">{category.description}</p>
        </div>
        <Icon className="size-9 opacity-90" />
      </div>
      <span className="flex items-center gap-1 text-xs font-bold">
        <LocalizedText fallback="Shop now" k="common.shopNow" /> <ArrowRight className="size-3 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
