import { Badge } from "@/components/ui/badge";

export function PromotionBadge({ percent }: { percent?: number }) {
  if (!percent) {
    return null;
  }

  return <Badge variant="destructive">-{percent}%</Badge>;
}
