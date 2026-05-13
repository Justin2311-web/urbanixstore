import Link from "next/link";
import { ArrowRight, Backpack, Car, Fan, Lamp } from "lucide-react";
import type { ProductCategory } from "@ecommerce/shared";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { cn } from "@/lib/utils";

const toneAccents: Record<ProductCategory["tone"], string> = {
  teal: "from-[#dbeafe] to-[#eff6ff] text-[#1a56db] dark:from-[#0f1e38] dark:to-[#0b1528] dark:text-[#3b9eff]",
  mint: "from-[#e0f2fe] to-[#f0f9ff] text-[#0369a1] dark:from-[#0c1e30] dark:to-[#0b1528] dark:text-[#38bdf8]",
  peach: "from-[#fff7ed] to-[#fef9f5] text-[#c2410c] dark:from-[#1e1208] dark:to-[#0b1528] dark:text-[#fb923c]",
  lilac: "from-[#f5f3ff] to-[#faf8ff] text-[#6d28d9] dark:from-[#150f2a] dark:to-[#0b1528] dark:text-[#a78bfa]",
  sky: "from-[#e0f2fe] to-[#f0f9ff] text-[#0284c7] dark:from-[#0c1a2a] dark:to-[#0b1528] dark:text-[#38bdf8]",
  rose: "from-[#fff1f2] to-[#fff5f6] text-[#be123c] dark:from-[#1e0a10] dark:to-[#0b1528] dark:text-[#fb7185]",
  amber: "from-[#fffbeb] to-[#fefce8] text-[#92400e] dark:from-[#1c1200] dark:to-[#0b1528] dark:text-[#fcd34d]",
  slate: "from-[#f1f5f9] to-[#f8fafc] text-[#334155] dark:from-[#0f172a] dark:to-[#0b1528] dark:text-[#94a3b8]",
  lime: "from-[#f0fdf4] to-[#f7fef9] text-[#166534] dark:from-[#0a1a0e] dark:to-[#0b1528] dark:text-[#86efac]",
  violet: "from-[#f5f3ff] to-[#faf8ff] text-[#5b21b6] dark:from-[#110f2a] dark:to-[#0b1528] dark:text-[#c4b5fd]",
  sand: "from-[#fef3c7] to-[#fffbeb] text-[#78350f] dark:from-[#1a1000] dark:to-[#0b1528] dark:text-[#fde68a]",
  sun: "from-[#fefce8] to-[#fffbeb] text-[#713f12] dark:from-[#1c1500] dark:to-[#0b1528] dark:text-[#fde047]",
  dark: "from-[#1f2937] to-[#111827] text-white dark:from-[#111827] dark:to-[#0b1528] dark:text-[#e2e8f0]",
  "fan-green": "from-[#dbeafe] to-[#eff6ff] text-[#1a56db] dark:from-[#0f1e38] dark:to-[#0b1528] dark:text-[#3b9eff]",
  "fan-orange": "from-[#fff7ed] to-[#fef9f5] text-[#c2410c] dark:from-[#1e1208] dark:to-[#0b1528] dark:text-[#fb923c]",
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
        "group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-4",
        "border border-white/70 shadow-[0_12px_32px_rgba(17,37,68,0.08)]",
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_46px_rgba(26,86,219,0.16)]",
        "dark:border-[rgba(59,158,255,0.14)] dark:hover:border-[rgba(59,158,255,0.32)] dark:hover:shadow-[0_12px_36px_rgba(59,158,255,0.14)]",
        toneAccents[category.tone]
      )}
      href={category.href}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-white/[0.03] dark:to-transparent" />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">
            <LocalizedValue fallback={category.name} value={category.localizedName} />
          </h3>
          <p className="mt-1 text-xs opacity-65">{category.description}</p>
        </div>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-current/10 ring-1 ring-current/15">
          <Icon className="size-5" />
        </div>
      </div>
      <span className="relative flex items-center gap-1 text-xs font-bold">
        <LocalizedText fallback="Shop now" k="common.shopNow" />
        <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
