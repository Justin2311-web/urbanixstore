import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  inverse?: boolean;
  logoUrl?: string;
  storeName?: string;
};

export function BrandLogo({
  compact = false,
  className,
  inverse = false,
  logoUrl,
  storeName = "Urbanix Store",
}: BrandLogoProps) {
  const [primaryName, ...secondaryParts] = storeName.trim().split(/\s+/);
  const secondaryName = secondaryParts.join(" ") || "Store";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {logoUrl ? (
        <img
          alt={storeName}
          className="size-10 rounded-2xl bg-white object-cover shadow-sm"
          src={logoUrl}
        />
      ) : (
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-2xl shadow-sm",
            inverse ? "bg-white text-primary" : "bg-primary text-white"
          )}
        >
          <ShieldCheck className="size-5" />
        </div>
      )}
      {!compact && (
        <div className="leading-none">
          <div
            className={cn(
              "text-lg font-extrabold uppercase tracking-wide",
              inverse ? "text-white" : "text-primary"
            )}
          >
            {primaryName}
          </div>
          <div className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-accent">
            {secondaryName}
          </div>
        </div>
      )}
      <span className="sr-only">{storeName}</span>
    </div>
  );
}
