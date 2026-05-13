import { LockKeyhole, MessageCircle, Star, Truck } from "lucide-react";
import type { TrustBadge as TrustBadgeType } from "@ecommerce/shared";

const icons = [Truck, LockKeyhole, MessageCircle, Star];

export function TrustBadge({ badge, index }: { badge: TrustBadgeType; index: number }) {
  const Icon = icons[index] ?? Truck;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/80 p-3.5 shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-[0_6px_20px_rgba(26,86,219,0.08)] dark:border-[rgba(59,158,255,0.1)] dark:bg-[rgba(11,21,40,0.6)] dark:hover:border-[rgba(59,158,255,0.24)]">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 dark:bg-[rgba(59,158,255,0.12)] dark:text-[#3b9eff] dark:ring-[rgba(59,158,255,0.2)]">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-foreground">{badge.title}</div>
        {badge.description ? (
          <div className="text-xs text-muted-foreground">{badge.description}</div>
        ) : null}
      </div>
    </div>
  );
}
