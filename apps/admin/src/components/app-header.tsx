import Link from "next/link";
import {
  Boxes,
  CreditCard,
  LayoutDashboard,
  ListTree,
  LogOut,
  Monitor,
  Package,
  PackagePlus,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/auth-actions";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/products/new", label: "Add Product", icon: PackagePlus },
  { href: "/categories", label: "Categories", icon: ListTree },
  { href: "/cms", label: "Website CMS", icon: Monitor },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/inventory", label: "Inventory", icon: Package },
];

export function AppHeader() {
  return (
    <aside className="border-b border-border bg-card lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:h-auto lg:justify-start lg:py-5">
        <Link href="/">
          <BrandLogo />
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
        {navLinks.map((item) => {
          const Icon = item.icon;

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
      <div className="hidden px-3 pb-4 lg:block">
        <form action={signOut}>
          <button
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-destructive"
            type="submit"
          >
            <LogOut className="size-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
