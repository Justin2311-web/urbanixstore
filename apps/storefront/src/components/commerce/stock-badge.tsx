import type { UrbanixProduct } from "@ecommerce/shared";
import { Badge } from "@/components/ui/badge";

const stockLabels: Record<UrbanixProduct["stockStatus"], string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Sold out",
};

export function StockBadge({ status }: { status: UrbanixProduct["stockStatus"] }) {
  const variant = status === "in_stock" ? "secondary" : status === "low_stock" ? "outline" : "destructive";

  return <Badge variant={variant}>{stockLabels[status]}</Badge>;
}
