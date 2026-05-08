import { LockKeyhole, RefreshCcw, Star, Truck } from "lucide-react";
import type { TrustBadge as TrustBadgeType } from "@ecommerce/shared";

const icons = [Truck, RefreshCcw, LockKeyhole, Star];

export function TrustBadge({ badge, index }: { badge: TrustBadgeType; index: number }) {
  const Icon = icons[index] ?? Truck;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <div className="text-sm font-bold">{badge.title}</div>
        <div className="text-xs text-muted-foreground">{badge.description}</div>
      </div>
    </div>
  );
}
