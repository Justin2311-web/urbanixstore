"use client";

import Link from "next/link";
import { ArrowRight, Backpack, Car, Fan, Lamp } from "lucide-react";
import type { LanguageCode, ProductCategory } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { cn } from "@/lib/utils";

type ToneStyle = {
  card: string;
  image: string;
  icon: string;
  glow: string;
};

const premiumToneStyles = {
  "tech-blue": {
    card: "from-[#eef5ff] via-[#f8fbff] to-white text-[#173f8a] border-[#bad3ff] shadow-[0_14px_36px_rgba(37,99,235,0.10)] dark:from-[#071a35] dark:via-[#0b2241] dark:to-[#050b18] dark:text-[#b9ddff] dark:border-[#255d9f]/45 dark:shadow-[0_18px_44px_rgba(37,99,235,0.18)]",
    image: "from-[#1d4ed8]/10 to-[#38bdf8]/18 dark:from-[#60a5fa]/18 dark:to-[#22d3ee]/10",
    icon: "bg-[#1d4ed8]/10 text-[#1d4ed8] ring-[#1d4ed8]/15 dark:bg-[#60a5fa]/14 dark:text-[#93c5fd] dark:ring-[#60a5fa]/25",
    glow: "bg-[#38bdf8]/24 dark:bg-[#60a5fa]/20",
  },
  "cyber-cyan": {
    card: "from-[#e9fbfd] via-[#f6feff] to-white text-[#075f6b] border-[#a8e8ef] shadow-[0_14px_36px_rgba(8,145,178,0.10)] dark:from-[#042228] dark:via-[#07323b] dark:to-[#050b18] dark:text-[#a5f3fc] dark:border-[#1f8c9a]/45 dark:shadow-[0_18px_44px_rgba(34,211,238,0.14)]",
    image: "from-[#0891b2]/10 to-[#67e8f9]/18 dark:from-[#67e8f9]/16 dark:to-[#0891b2]/10",
    icon: "bg-[#0891b2]/10 text-[#0e7490] ring-[#0891b2]/15 dark:bg-[#67e8f9]/14 dark:text-[#a5f3fc] dark:ring-[#67e8f9]/22",
    glow: "bg-[#67e8f9]/24 dark:bg-[#22d3ee]/18",
  },
  "aurora-purple": {
    card: "from-[#f4efff] via-[#fbf8ff] to-white text-[#5b21b6] border-[#d8c7ff] shadow-[0_14px_36px_rgba(124,58,237,0.10)] dark:from-[#170f2f] dark:via-[#231747] dark:to-[#050b18] dark:text-[#ddd6fe] dark:border-[#7c3aed]/40 dark:shadow-[0_18px_44px_rgba(124,58,237,0.17)]",
    image: "from-[#7c3aed]/10 to-[#f472b6]/16 dark:from-[#a78bfa]/16 dark:to-[#f472b6]/10",
    icon: "bg-[#7c3aed]/10 text-[#6d28d9] ring-[#7c3aed]/15 dark:bg-[#a78bfa]/14 dark:text-[#c4b5fd] dark:ring-[#a78bfa]/22",
    glow: "bg-[#a78bfa]/24 dark:bg-[#a78bfa]/18",
  },
  "sunset-orange": {
    card: "from-[#fff3e6] via-[#fffaf5] to-white text-[#a53b0b] border-[#ffd1a6] shadow-[0_14px_36px_rgba(234,88,12,0.10)] dark:from-[#2a1105] dark:via-[#3a1908] dark:to-[#080c14] dark:text-[#fed7aa] dark:border-[#ea580c]/38 dark:shadow-[0_18px_44px_rgba(249,115,22,0.14)]",
    image: "from-[#ea580c]/10 to-[#facc15]/16 dark:from-[#fb923c]/16 dark:to-[#facc15]/10",
    icon: "bg-[#ea580c]/10 text-[#c2410c] ring-[#ea580c]/15 dark:bg-[#fb923c]/14 dark:text-[#fdba74] dark:ring-[#fb923c]/22",
    glow: "bg-[#fb923c]/22 dark:bg-[#fb923c]/18",
  },
  "emerald-glow": {
    card: "from-[#eafbf3] via-[#f7fefb] to-white text-[#0f6b45] border-[#a9edcf] shadow-[0_14px_36px_rgba(16,185,129,0.10)] dark:from-[#06251a] dark:via-[#0b3526] dark:to-[#050b18] dark:text-[#bbf7d0] dark:border-[#10b981]/38 dark:shadow-[0_18px_44px_rgba(16,185,129,0.13)]",
    image: "from-[#059669]/10 to-[#bef264]/16 dark:from-[#34d399]/16 dark:to-[#bef264]/8",
    icon: "bg-[#059669]/10 text-[#047857] ring-[#059669]/15 dark:bg-[#34d399]/14 dark:text-[#86efac] dark:ring-[#34d399]/22",
    glow: "bg-[#34d399]/22 dark:bg-[#34d399]/16",
  },
  graphite: {
    card: "from-[#f1f5f9] via-white to-[#f8fafc] text-[#263445] border-[#cbd5e1] shadow-[0_14px_36px_rgba(51,65,85,0.10)] dark:from-[#111827] dark:via-[#172033] dark:to-[#050b18] dark:text-[#e2e8f0] dark:border-[#64748b]/35 dark:shadow-[0_18px_44px_rgba(0,0,0,0.28)]",
    image: "from-[#475569]/10 to-[#94a3b8]/14 dark:from-[#94a3b8]/12 dark:to-[#475569]/8",
    icon: "bg-[#475569]/10 text-[#334155] ring-[#475569]/15 dark:bg-[#94a3b8]/12 dark:text-[#cbd5e1] dark:ring-[#94a3b8]/18",
    glow: "bg-[#94a3b8]/20 dark:bg-[#94a3b8]/12",
  },
  "premium-gold": {
    card: "from-[#fff7dc] via-[#fffdf5] to-white text-[#7a4a05] border-[#f4d272] shadow-[0_14px_36px_rgba(180,120,15,0.11)] dark:from-[#261900] dark:via-[#3a2807] dark:to-[#080c14] dark:text-[#fde68a] dark:border-[#d4a017]/40 dark:shadow-[0_18px_44px_rgba(245,158,11,0.14)]",
    image: "from-[#d97706]/10 to-[#fde047]/18 dark:from-[#fbbf24]/16 dark:to-[#fde047]/8",
    icon: "bg-[#d97706]/10 text-[#92400e] ring-[#d97706]/15 dark:bg-[#fbbf24]/14 dark:text-[#fde68a] dark:ring-[#fbbf24]/22",
    glow: "bg-[#fde047]/24 dark:bg-[#fbbf24]/16",
  },
  "ice-silver": {
    card: "from-[#eef7fb] via-white to-[#f8fafc] text-[#28566a] border-[#c7dce7] shadow-[0_14px_36px_rgba(71,85,105,0.09)] dark:from-[#0c1822] dark:via-[#122435] dark:to-[#050b18] dark:text-[#d7eef8] dark:border-[#7dd3fc]/25 dark:shadow-[0_18px_44px_rgba(125,211,252,0.10)]",
    image: "from-[#7dd3fc]/12 to-[#e2e8f0]/18 dark:from-[#bae6fd]/12 dark:to-[#94a3b8]/8",
    icon: "bg-[#0ea5e9]/10 text-[#0369a1] ring-[#0ea5e9]/15 dark:bg-[#bae6fd]/12 dark:text-[#e0f2fe] dark:ring-[#bae6fd]/18",
    glow: "bg-[#bae6fd]/22 dark:bg-[#bae6fd]/12",
  },
} satisfies Record<string, ToneStyle>;

const toneAliases: Record<string, keyof typeof premiumToneStyles> = {
  "neon-cyan": "cyber-cyan",
  "urban-purple": "aurora-purple",
  "lime-green": "emerald-glow",
  "fresh-teal": "cyber-cyan",
  "steel-grey": "graphite",
  "coral-red": "sunset-orange",
  "soft-pink": "aurora-purple",
  teal: "cyber-cyan",
  mint: "emerald-glow",
  peach: "sunset-orange",
  lilac: "aurora-purple",
  sky: "tech-blue",
  rose: "aurora-purple",
  amber: "premium-gold",
  slate: "graphite",
  lime: "emerald-glow",
  violet: "aurora-purple",
  sand: "premium-gold",
  sun: "premium-gold",
  dark: "graphite",
  "fan-green": "tech-blue",
  "fan-orange": "sunset-orange",
  coral: "sunset-orange",
  gold: "premium-gold",
  lavender: "aurora-purple",
  green: "emerald-glow",
  orange: "sunset-orange",
  blue: "tech-blue",
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

function categoryImageForLanguage(category: ProductCategory, language: LanguageCode) {
  const localized = category.localizedImageUrls;
  return localized?.[language] || localized?.en || category.imageUrl || "";
}

function toneFor(category: ProductCategory) {
  const tone = String(category.tone ?? "tech-blue");
  return premiumToneStyles[tone as keyof typeof premiumToneStyles] ?? premiumToneStyles[toneAliases[tone] ?? "tech-blue"];
}

export function CategoryCard({ category }: { category: ProductCategory }) {
  const { language } = useLanguage();
  const Icon = icons[(category.icon || category.name) as keyof typeof icons] ?? Fan;
  const imageUrl = categoryImageForLanguage(category, language);
  const tone = toneFor(category);

  return (
    <Link
      aria-label={category.name}
      className={cn(
        "group relative isolate flex min-h-[11.5rem] flex-col justify-between overflow-hidden rounded-[1.35rem] bg-gradient-to-br p-4",
        "border shadow-sm transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        tone.card
      )}
      href={category.href}
    >
      <div className={cn("absolute -right-8 -top-10 z-0 size-28 rounded-full blur-3xl transition duration-300 group-hover:scale-125", tone.glow)} />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_25%_0%,rgba(255,255,255,0.72),transparent_38%)] dark:bg-[radial-gradient(circle_at_25%_0%,rgba(255,255,255,0.08),transparent_40%)]" />

      <div className="relative z-10 overflow-hidden rounded-2xl border border-white/50 bg-white/40 p-1.5 backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className={cn("relative aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br", tone.image)}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={category.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              src={imageUrl}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className={cn("flex size-12 items-center justify-center rounded-2xl ring-1", tone.icon)}>
                <Icon className="size-6" />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-white/10 opacity-70 dark:from-black/35" />
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-black tracking-tight sm:text-base">
            <LocalizedValue fallback={category.name} value={category.localizedName} />
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 opacity-72">
            <LocalizedValue fallback={category.description} value={category.localizedDescription} />
          </p>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full ring-1 transition duration-300 group-hover:translate-x-0.5", tone.icon)}>
          <ArrowRight className="size-4" />
        </span>
      </div>

      <span className="sr-only">
        <LocalizedText fallback="Shop now" k="common.shopNow" />
      </span>
    </Link>
  );
}
