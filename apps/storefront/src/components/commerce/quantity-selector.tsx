import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantitySelector({
  disabled = false,
  onDecrease,
  onIncrease,
  value = 1,
}: {
  value?: number;
  disabled?: boolean;
  onDecrease?: () => void;
  onIncrease?: () => void;
}) {
  return (
    <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Button
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={onDecrease}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Minus />
      </Button>
      <span className="min-w-9 text-center text-sm font-bold">{value}</span>
      <Button
        aria-label="Increase quantity"
        disabled={disabled}
        onClick={onIncrease}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Plus />
      </Button>
    </div>
  );
}
