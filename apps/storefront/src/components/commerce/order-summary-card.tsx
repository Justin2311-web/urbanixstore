import type { CartLine, OrderTotals } from "@ecommerce/shared";
import { formatCurrency } from "@ecommerce/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductVisual } from "@/components/commerce/product-visual";
import { LocalizedValue } from "@/components/i18n/localized-value";

export function OrderSummaryCard({
  lines = [],
  showItems = false,
  totals,
}: {
  lines?: CartLine[];
  totals: OrderTotals;
  showItems?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {showItems && lines.length > 0 ? (
          <div className="mb-2 flex flex-col gap-3">
            {lines.map((line) => (
              <div className="flex items-center gap-3" key={line.product.id}>
                <ProductVisual
                  className="size-14 rounded-xl"
                  imageUrl={line.product.image || line.product.mainImageUrl || line.product.galleryImages?.[0]}
                  tone={line.product.imageTone}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold">
                    <LocalizedValue fallback={line.product.name} value={line.product.localizedName} />
                  </div>
                  <div className="text-xs text-muted-foreground">x{line.quantity}</div>
                </div>
                <div className="text-xs font-bold">{formatCurrency(line.lineTotal)}</div>
              </div>
            ))}
          </div>
        ) : null}
        <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
        <SummaryRow
          accent
          label="Discount"
          value={totals.discount > 0 ? `-${formatCurrency(totals.discount)}` : formatCurrency(0)}
        />
        <SummaryRow
          success={totals.shipping === 0}
          label="Shipping"
          value={totals.shipping === 0 ? "Free" : formatCurrency(totals.shipping)}
        />
        <div className="mt-2 border-t pt-3">
          <SummaryRow strong label="Total" value={formatCurrency(totals.total)} />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  accent,
  label,
  strong,
  success,
  value,
}: {
  label: string;
  value: string;
  accent?: boolean;
  success?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={strong ? "font-bold" : "text-muted-foreground"}>{label}</span>
      <span
        className={
          strong
            ? "text-lg font-extrabold text-foreground"
            : success
              ? "font-bold text-success"
              : accent
                ? "font-bold text-accent"
                : "font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}
