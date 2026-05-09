import type { UrbanixProduct } from "@ecommerce/shared";
import { Cable, Fan, Gem, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductVisualProps = {
  tone: UrbanixProduct["imageTone"];
  className?: string;
  imageUrl?: string;
  alt?: string;
};

const toneStyles: Record<UrbanixProduct["imageTone"], string> = {
  "fan-green": "from-[#e5f3ee] via-[#f6faf8] to-[#c8e7dc] text-primary",
  "fan-cream": "from-[#fff7ef] via-[#fffdf9] to-[#eadccc] text-[#9a6b4c]",
  "fan-black": "from-[#f0f1f1] via-[#ffffff] to-[#d6d8d8] text-[#1f2937]",
  car: "from-[#e9eef0] via-[#ffffff] to-[#d8dee3] text-[#1f2937]",
  perfume: "from-[#eef7f6] via-[#ffffff] to-[#d8ebe8] text-primary",
  cable: "from-[#f6f0e7] via-[#ffffff] to-[#e7ded1] text-[#1f2937]",
};

export function ProductVisual({ alt = "Product image", className, imageUrl, tone }: ProductVisualProps) {
  const Icon = tone === "car" ? Smartphone : tone === "perfume" ? Gem : tone === "cable" ? Cable : Fan;

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-2xl bg-white",
          className
        )}
      >
        <img alt={alt} className="size-full object-cover" src={imageUrl} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br",
        toneStyles[tone],
        className
      )}
    >
      <div className="absolute inset-5 rounded-full bg-white/45 blur-xl" />
      <div className="relative flex size-20 items-center justify-center rounded-full bg-white/70 shadow-[0_16px_40px_rgba(15,23,42,0.16)] sm:size-24">
        <Icon className="size-10 sm:size-12" strokeWidth={1.8} />
      </div>
      <div className="absolute bottom-4 h-2 w-20 rounded-full bg-black/10 blur-sm" />
    </div>
  );
}
