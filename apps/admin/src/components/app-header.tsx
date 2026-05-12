import Link from "next/link";
import { BarChart3, Boxes, CreditCard, Home, Image, ListTree, PackagePlus, Settings, ShoppingBag } from "lucide-react";
import { adminNavItems } from "@ecommerce/shared";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const icons = [Home, Boxes, PackagePlus, ListTree, Image, ShoppingBag, Settings, CreditCard, BarChart3];

export function AppHeader() {
  return (
    <aside className="border-b border-border bg-card lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:h-auto lg:justify-start lg:py-5">
        <Link href="/">
          <BrandLogo />
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
        {adminNavItems.map((item, index) => {
          const Icon = icons[index] ?? Home;

          return (
            <Link
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-primary"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
