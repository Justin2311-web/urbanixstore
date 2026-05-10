import Link from "next/link";
import { House, MessageCircle, Search, ShoppingCart, UserRound } from "lucide-react";
import { storefrontNavItems } from "@ecommerce/shared";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { BrandLogo } from "@/components/brand-logo";
import { CartCountBadge } from "@/components/cart/cart-count-badge";
import { SearchBar } from "@/components/commerce/search-bar";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { buttonVariants } from "@/components/ui/button";
import { getWhatsAppNumber } from "@/lib/order-links";

export async function AppHeader() {
  const { homepage, settings } = await readUrbanixStoreDataAsync();

  return (
    <>
      <div className="hidden bg-primary py-2 text-center text-xs font-semibold text-white md:block">
        <LocalizedValue fallback={homepage.promotionStripText} value={settings.freeShippingText} /> &nbsp; - &nbsp; WhatsApp {settings.whatsappNumber}
      </div>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/92 shadow-[0_8px_24px_rgba(23,37,38,0.06)] backdrop-blur">
        <div className="urbanix-container flex h-16 items-center justify-between gap-4">
          <Link className="shrink-0" href="/">
            <BrandLogo logoUrl={settings.logoUrl} storeName={settings.storeName} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {storefrontNavItems.slice(1, 5).map((item) => (
              <Link
                className={buttonVariants({ size: "sm", variant: "ghost" })}
                href={item.href}
                key={item.label}
              >
                <LocalizedText fallback={item.label} k={`nav.${item.label === "New Arrivals" ? "newArrivals" : item.label === "Best Sellers" ? "bestSellers" : item.label === "About Us" ? "aboutUs" : item.label.toLowerCase()}`} />
              </Link>
            ))}
          </nav>
          <div className="hidden w-full max-w-xs md:block">
            <SearchBar />
          </div>
          <div className="flex items-center gap-1">
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <Link
              className={buttonVariants({
                className: "hidden bg-success text-white hover:bg-success/90 lg:inline-flex",
                size: "sm",
              })}
              href={`https://wa.me/${getWhatsAppNumber(settings)}`}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle />
              WhatsApp
            </Link>
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
              href="/account"
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
    { href: "/", label: "Home", key: "home", icon: House },
    { href: "/products", label: "Shop", icon: ShoppingCart },
    { href: "/search", label: "Search", icon: Search },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/account", label: "Account", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-card px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(23,37,38,0.1)] md:hidden">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[0.65rem] font-semibold text-muted-foreground transition hover:bg-secondary hover:text-primary"
            href={item.href}
            key={item.label}
          >
            <span className="relative">
              <Icon className="size-5 text-foreground" />
              {item.label === "Cart" ? <CartCountBadge /> : null}
            </span>
            <LocalizedText fallback={item.label} k={`nav.${item.key ?? item.label.toLowerCase()}`} />
          </Link>
        );
      })}
      <div className="absolute -top-12 right-2">
        <LanguageSelector compact />
      </div>
    </nav>
  );
}
