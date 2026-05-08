import { ShieldCheck } from "lucide-react";
import { platformConfig } from "@ecommerce/shared";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  inverse?: boolean;
};

export function BrandLogo({ compact = false, className, inverse = false }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-2xl shadow-sm",
          inverse ? "bg-white text-primary" : "bg-primary text-white"
        )}
      >
        <ShieldCheck className="size-5" />
      </div>
      {!compact && (
        <div className="leading-none">
          <div
            className={cn(
              "text-lg font-extrabold uppercase tracking-wide",
              inverse ? "text-white" : "text-primary"
            )}
          >
            Urbanix
          </div>
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-accent">
            Store
          </div>
        </div>
      )}
      <span className="sr-only">{platformConfig.name}</span>
    </div>
  );
}
