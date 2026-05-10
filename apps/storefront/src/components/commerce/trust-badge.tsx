import { LockKeyhole, MessageCircle, Star, Truck } from "lucide-react";
import type { TrustBadge as TrustBadgeType } from "@ecommerce/shared";

const icons = [Truck, LockKeyhole, MessageCircle, Star];

export function TrustBadge({ badge, index }: { badge: TrustBadgeType; index: number }) {
  const Icon = icons[index] ?? Truck;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary ring-1 ring-primary/10">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-sm font-bold">{badge.title}</div>
        <div className="text-xs text-muted-foreground">{badge.description}</div>
      </div>
    </div>
  );
}
