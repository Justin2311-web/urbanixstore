import Link from "next/link";
import { ArrowRight, Backpack, Car, Fan, Lamp } from "lucide-react";
import type { ProductCategory } from "@ecommerce/shared";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { cn } from "@/lib/utils";

const toneStyles: Record<ProductCategory["tone"], string> = {
  teal: "bg-[#f0f7f9] text-[#2d4a53] dark:bg-[#1a2e35] dark:text-[#a0c4cf]",
  mint: "bg-[#f2f9f5] text-[#3a5a40] dark:bg-[#1e2e24] dark:text-[#a0cfb4]",
  peach: "bg-[#fff8f0] text-[#8c5a4a] dark:bg-[#2e261e] dark:text-[#cfb4a0]",
  lilac: "bg-[#f8f5ff] text-[#5a4a8c] dark:bg-[#221e2e] dark:text-[#b4a0cf]",
  sky: "bg-[#f0f8ff] text-[#4a6a8c] dark:bg-[#1e242e] dark:text-[#a0b4cf]",
  rose: "bg-[#fff5f7] text-[#8c4a5a] dark:bg-[#2e1e22] dark:text-[#cfa0ac]",
  amber: "bg-[#fffaf0] text-[#8c7a4a] dark:bg-[#2e2c1e] dark:text-[#cfc8a0]",
  slate: "bg-[#f5f7f9] text-[#4a4d53] dark:bg-[#222426] dark:text-[#a0a4a8]",
  lime: "bg-[#f9fff0] text-[#5a8c4a] dark:bg-[#282e1e] dark:text-[#b4cfa0]",
  violet: "bg-[#f5f0ff] text-[#4a4a8c] dark:bg-[#1e1e2e] dark:text-[#a0a0cf]",
  sand: "bg-[#faf9f5] text-[#5c5a4a] dark:bg-[#26261e] dark:text-[#a4a4a0]",
  sun: "bg-[#fffdf0] text-[#8c8a4a] dark:bg-[#2e2e1e] dark:text-[#cfcca0]",
  dark: "bg-[#2d3436] text-white dark:bg-card dark:text-foreground",
  "fan-green": "bg-[#f0fdf4] text-[#166534] dark:bg-[#142e1a] dark:text-[#86efac]",
  "fan-orange": "bg-[#fff7ed] text-[#9a3412] dark:bg-[#2e1a14] dark:text-[#fdba74]",
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
        "group relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-[2rem] p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]",
        toneStyles[category.tone]
      )}
      href={category.href}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight">
            <LocalizedValue fallback={category.name} value={category.localizedName} />
          </h3>
          <p className="mt-1 text-xs font-medium opacity-60 line-clamp-2">{category.description}</p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/40 backdrop-blur-sm">
          <Icon className="size-6" />
        </div>
      </div>
      <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest">
        <LocalizedText fallback="Explore" k="common.shopNow" /> <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

