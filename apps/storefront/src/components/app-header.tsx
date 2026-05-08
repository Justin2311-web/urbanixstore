import Link from "next/link";
import { Menu, Search, ShoppingCart, UserRound } from "lucide-react";
import { storefrontNavItems } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { BrandLogo } from "@/components/brand-logo";
import { CartCountBadge } from "@/components/cart/cart-count-badge";
import { SearchBar } from "@/components/commerce/search-bar";
import { buttonVariants } from "@/components/ui/button";

export async function AppHeader() {
  const { homepage, settings } = await readUrbanixStoreDataAsync();

  return (
    <>
      <div className="hidden bg-primary py-2 text-center text-xs font-semibold text-white md:block">
        {homepage.promotionStripText} &nbsp; - &nbsp; WhatsApp {settings.whatsappNumber}
      </div>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur">
        <div className="urbanix-container flex h-16 items-center justify-between gap-4">
          <button className="flex size-10 items-center justify-center rounded-xl text-foreground md:hidden">
            <Menu className="size-5" />
          </button>
          <Link href="/">
            <BrandLogo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {storefrontNavItems.slice(1, 5).map((item) => (
              <Link
                className={buttonVariants({ size: "sm", variant: "ghost" })}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden w-full max-w-xs md:block">
            <SearchBar />
          </div>
          <div className="flex items-center gap-1">
            <Link
              aria-label="Search"
              className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
              href="/search"
            >
              <Search />
            </Link>
            <Link
              aria-label="Account"
              className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
              href="/"
            >
              <UserRound />
            </Link>
            <Link
              aria-label="Cart"
              className={buttonVariants({ className: "relative", size: "icon-sm", variant: "ghost" })}
              href="/cart"
            >
              <ShoppingCart />
              <CartCountBadge />
            </Link>
          </div>
        </div>
      </header>
      <MobileBottomNav />
    </>
  );
}

function MobileBottomNav() {
  const items = [
    { href: "/", label: "Home", icon: Menu },
    { href: "/products", label: "Shop", icon: ShoppingCart },
    { href: "/search", label: "Search", icon: Search },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/", label: "Account", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-card px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] md:hidden">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[0.65rem] font-semibold text-muted-foreground"
            href={item.href}
            key={item.label}
          >
            <span className="relative">
              <Icon className="size-5 text-foreground" />
              {item.label === "Cart" ? <CartCountBadge /> : null}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
