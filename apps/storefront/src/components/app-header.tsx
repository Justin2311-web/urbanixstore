import Link from "next/link";
import { House, MessageCircle, PackageSearch, Search, ShoppingCart, UserRound } from "lucide-react";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { BrandLogo } from "@/components/brand-logo";
import { CartCountBadge } from "@/components/cart/cart-count-badge";
import { SearchBar } from "@/components/commerce/search-bar";
import { LanguageSelector } from "@/components/i18n/language-selector";
import { LocalizedText } from "@/components/i18n/localized-text";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getWhatsAppNumber } from "@/lib/order-links";

export async function AppHeader() {
  const { homepage, settings } = await readUrbanixStoreDataAsync();

  // Show announcement bar only if enabled (defaults to true)
  const announcementEnabled = homepage.announcementEnabled !== false;
  const announcementBg = homepage.announcementBgColor ?? "#1a1a1a";
  const announcementColor = homepage.announcementTextColor ?? "#ffffff";
  const announcementText = homepage.promotionStripText;
  const announcementLink = homepage.announcementLink;

  return (
    <>
      {/* Announcement bar — text comes from admin CMS → banners.promo_strip_text → homepage.promotionStripText */}
      {announcementEnabled && announcementText ? (
        announcementLink ? (
          <Link
            className="block py-2 text-center text-xs font-semibold transition-opacity hover:opacity-90"
            href={announcementLink}
            style={{ backgroundColor: announcementBg, color: announcementColor }}
          >
            {announcementText}
          </Link>
        ) : (
          <div
            className="py-2 text-center text-xs font-semibold"
            style={{ backgroundColor: announcementBg, color: announcementColor }}
          >
            {announcementText}
          </div>
        )
      ) : null}

      {/* Sticky header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/90 shadow-[0_4px_20px_rgba(17,37,68,0.07)] backdrop-blur-lg dark:border-[rgba(59,158,255,0.1)] dark:bg-[rgba(11,21,40,0.88)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)]">
        <div className="urbanix-container flex h-16 items-center justify-between gap-4">
          <Link className="shrink-0" href="/">
            <BrandLogo logoUrl={settings.logoUrl} storeName={settings.storeName} />
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            <Link
              className={buttonVariants({ size: "sm", variant: "ghost" })}
              href="/track-order"
            >
              <PackageSearch className="size-4" />
              <LocalizedText fallback="Track Order" k="nav.trackOrder" />
            </Link>
          </nav>

          <div className="hidden w-full max-w-xs md:block">
            <SearchBar />
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <ThemeToggle />
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
    { href: "/track-order", label: "Track", key: "trackOrder", icon: PackageSearch },
    { href: "/search", label: "Search", icon: Search },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/account", label: "Account", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border/60 bg-card/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_rgba(17,37,68,0.1)] backdrop-blur-lg dark:border-[rgba(59,158,255,0.1)] dark:bg-[rgba(11,21,40,0.95)] dark:shadow-[0_-8px_28px_rgba(0,0,0,0.4)] md:hidden">
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
      <div className="absolute -top-12 right-2 flex items-center gap-1">
        <ThemeToggle compact />
        <LanguageSelector compact />
      </div>
    </nav>
  );
}
