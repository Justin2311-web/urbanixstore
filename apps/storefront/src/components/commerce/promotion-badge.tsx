import { cn } from "@/lib/utils";

type PromotionBadgeProps = {
  className?: string;
  percent?: number;
  size?: "sm" | "lg";
};

export function PromotionBadge({ className, percent, size = "sm" }: PromotionBadgeProps) {
  if (!percent) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-2xl border border-white/55 bg-linear-to-br from-rose-500 via-red-500 to-orange-500 font-black leading-none tracking-tight text-white shadow-[0_12px_26px_rgba(239,68,68,0.35)] ring-1 ring-red-200/35 transition duration-300 dark:border-white/15 dark:from-rose-400 dark:via-red-500 dark:to-orange-400 dark:shadow-[0_12px_30px_rgba(248,113,113,0.26)] dark:ring-white/10",
        size === "lg" ? "px-3.5 py-2 text-sm sm:text-[0.95rem]" : "px-2.5 py-1 text-xs",
        className
      )}
      data-promotion-badge
    >
      -{percent}%
    </span>
  );
}
