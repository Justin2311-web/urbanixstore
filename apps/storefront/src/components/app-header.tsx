import Link from "next/link";
import { House, MapPin, Search, ShoppingCart, UserRound } from "lucide-react";
import { storefrontNavItems } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { BrandLogo } from "@/components/brand-logo";
import { CartCountBadge } from "@/components/cart/cart-count-badge";
import { SearchBar } from "@/components/commerce/search-bar";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export async function AppHeader() {
  const { homepage, settings } = await readUrbanixStoreDataAsync();

  return (
    <>
      <div className="hidden bg-secondary/60 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-foreground/80 md:block">
        <LocalizedValue fallback={homepage.promotionStripText} value={settings.freeShippingText} />
      </div>
      <header className="sticky top-0 z-40 border-b border-border/40 bg-white/70 shadow-sm backdrop-blur-2xl transition-all duration-300 dark:bg-black/60">
        <div className="urbanix-container flex h-20 items-center justify-between gap-8">
          <div className="flex items-center gap-12">
            <Link className="shrink-0 transition-transform hover:scale-105" href="/">
              <BrandLogo logoUrl={settings.logoUrl} storeName={settings.storeName} />
            </Link>
            <nav className="hidden items-center gap-2 md:flex">
              {storefrontNavItems.slice(1, 5).map((item) => (
                <Link
                  className={buttonVariants({
                    className: "rounded-full px-5 text-sm font-bold text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    size: "sm",
                    variant: "ghost",
                  })}
                  href={item.href}
                  key={item.label}
                >
                  <LocalizedText fallback={item.label} k={`nav.${item.label === "New Arrivals" ? "newArrivals" : item.label === "Best Sellers" ? "bestSellers" : item.label === "About Us" ? "aboutUs" : item.label.toLowerCase()}`} />
                </Link>
              ))}
              <Link
                className={buttonVariants({
                  className: "rounded-full px-5 text-sm font-bold text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  size: "sm",
                  variant: "ghost",
                })}
                href="/track-order"
              >
                Track Order
              </Link>
            </nav>
          </div>
          <div className="hidden w-full max-w-[280px] lg:block">
            <SearchBar />
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link
                className={buttonVariants({
                  className: "hidden rounded-full bg-primary px-5 font-bold text-white shadow-sm hover:bg-primary/90 lg:inline-flex",
                  size: "sm",
                })}
                href="/track-order"
              >
                <MapPin className="size-4" />
                Track Order
              </Link>
              <Link
                aria-label="Search"
                className={buttonVariants({ className: "rounded-full hover:bg-secondary/50", size: "icon-sm", variant: "ghost" })}
                href="/search"
              >
                <Search className="size-5" />
              </Link>
              <Link
                aria-label="Account"
                className={buttonVariants({ className: "rounded-full hover:bg-secondary/50", size: "icon-sm", variant: "ghost" })}
                href="/account"
              >
                <UserRound className="size-5" />
              </Link>
              <Link
                aria-label="Cart"
                className={buttonVariants({ className: "relative rounded-full hover:bg-secondary/50", size: "icon-sm", variant: "ghost" })}
                href="/cart"
              >
                <ShoppingCart className="size-5" />
                <CartCountBadge />
              </Link>
            </div>
          </div>
        </div>
      </header>
      <MobileBottomNav />
    </>
  );
}

function MobileBottomNav() {
  const items = [
    { href: "/", label: "Home", key: "home", icon: House },
    { href: "/products", label: "Shop", icon: ShoppingCart },
    { href: "/track-order", label: "Track", icon: MapPin },
    { href: "/search", label: "Search", icon: Search },
    { href: "/account", label: "Account", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border/40 bg-white/80 px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-2xl md:hidden">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className="flex flex-col items-center gap-1.5 text-muted-foreground transition hover:text-primary"
            href={item.href}
            key={item.label}
          >
            <span className="relative">
              <Icon className="size-5" />
              {item.label === "Shop" ? <CartCountBadge /> : null}
            </span>
            <span className="text-[10px] font-bold">
              <LocalizedText fallback={item.label} k={`nav.${item.key ?? item.label.toLowerCase()}`} />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
