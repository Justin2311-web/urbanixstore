import { LockKeyhole, MessageCircle, Star, Truck } from "lucide-react";
import type { TrustBadge as TrustBadgeType } from "@ecommerce/shared";

const icons = [Truck, LockKeyhole, MessageCircle, Star];

export function TrustBadge({ badge, index }: { badge: TrustBadgeType; index: number }) {
  const Icon = icons[index] ?? Truck;

  return (
    <div className="urbanix-surface flex flex-col items-center gap-6 p-10 text-center transition-transform hover:scale-[1.02]">
      <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-secondary text-primary">
        <Icon className="size-8" />
      </div>
      <div>
        <div className="text-lg font-extrabold text-foreground">{badge.title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{badge.description}</div>
      </div>
    </div>
  );
}

