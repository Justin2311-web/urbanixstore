import Link from "next/link";
import { ArrowRight, Backpack, Car, Fan, Lamp } from "lucide-react";
import type { ProductCategory } from "@ecommerce/shared";
import { cn } from "@/lib/utils";

const toneStyles: Record<ProductCategory["tone"], string> = {
  teal: "bg-[#e7f2ef] text-primary",
  mint: "bg-[#e4f6ee] text-primary",
  peach: "bg-[#fff0df] text-[#9f4b2f]",
  lilac: "bg-[#f0eaf8] text-[#4f3b6d]",
};

const icons = {
  "Portable Fans": Fan,
  "Car Accessories": Car,
  "Home Picks": Lamp,
  Lifestyle: Backpack,
};

export function CategoryCard({ category }: { category: ProductCategory }) {
  const Icon = icons[category.name as keyof typeof icons] ?? Fan;

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
          <h3 className="text-sm font-bold">{category.name}</h3>
          <p className="mt-1 text-xs opacity-75">{category.description}</p>
        </div>
        <Icon className="size-9 opacity-90" />
      </div>
      <span className="flex items-center gap-1 text-xs font-bold">
        Shop now <ArrowRight className="size-3 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
