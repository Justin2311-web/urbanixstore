import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function EmptyState({
  actionHref = "/products",
  actionLabel = "Start shopping",
  title = "Nothing here yet",
}: {
  title?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="urbanix-surface flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <ShoppingBag className="size-7" />
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore curated Urbanix picks made for everyday life.
        </p>
      </div>
      <Link className={buttonVariants()} href={actionHref}>
        {actionLabel}
      </Link>
    </div>
  );
}
