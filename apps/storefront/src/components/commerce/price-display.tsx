import { formatCurrency } from "@ecommerce/shared";

type PriceDisplayProps = {
  price: number;
  originalPrice?: number;
  size?: "sm" | "lg";
};

export function PriceDisplay({ originalPrice, price, size = "sm" }: PriceDisplayProps) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={size === "lg" ? "text-2xl price-current" : "price-current"}>
        {formatCurrency(price)}
      </span>
      {originalPrice ? (
        <span className={size === "lg" ? "text-sm price-original" : "price-original"}>
          {formatCurrency(originalPrice)}
        </span>
      ) : null}
    </div>
  );
}
