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
  "fan-green": "from-[#eaf3ff] via-[#ffffff] to-[#c8ddff] text-primary",
  "fan-cream": "from-[#fff4e7] via-[#ffffff] to-[#d8e8ff] text-primary",
  "fan-black": "from-[#f0f1f1] via-[#ffffff] to-[#d6d8d8] text-[#1f2937]",
  car: "from-[#e9f1ff] via-[#ffffff] to-[#d7e4f5] text-primary",
  perfume: "from-[#eef5ff] via-[#ffffff] to-[#d8e7fb] text-primary",
  cable: "from-[#f6f0e7] via-[#ffffff] to-[#d8e7fb] text-[#1f2937]",
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
