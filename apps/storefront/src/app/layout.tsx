import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";
import { RouteEvents } from "@/components/analytics/route-events";
import { AppHeader } from "@/components/app-header";
import { AddToCartToast } from "@/components/cart/add-to-cart-toast";
import { CartProvider } from "@/components/cart/cart-provider";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { StorefrontFooter } from "@/components/storefront-footer";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

// Inter — primary sans for EN / MS (full Latin + extended set for MS diacritics)
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// JetBrains Mono — opt-in via .urbanix-tabular / font-mono utility only.
// Used for prices, SKUs, order IDs, countdowns. NOT a body-text font.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  let storeName = "Urbanix Store";
  let description = "Smart picks for urban life.";
  let logoUrl: string | undefined;
  let favicon: string | undefined;

  try {
    const { settings } = await readUrbanixStoreDataAsync();
    storeName = settings.storeName || storeName;
    description = settings.storeTagline || description;
    logoUrl = settings.logoUrl || undefined;
    favicon = settings.favicon || undefined;
  } catch {
    // fall through to defaults
  }

  const ogImage = logoUrl || "/urbanix-logo.png";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: storeName,
      template: `%s | ${storeName}`,
    },
    description,
    icons: favicon || "/favicon.ico",
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: storeName,
      title: storeName,
      description,
      url: siteUrl,
      images: [{ url: ogImage, width: 1200, height: 630, alt: storeName }],
      locale: "en_MY",
    },
    twitter: {
      card: "summary_large_image",
      title: storeName,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read settings once at the layout level so the floating WhatsApp button
  // can render with the admin-configured number on every route, without each
  // page having to thread it through.
  let whatsappNumber: string | null = null;
  try {
    const { settings } = await readUrbanixStoreDataAsync();
    whatsappNumber = settings.whatsappNumber ?? null;
  } catch {
    // settings unavailable — floating button stays hidden, no crash.
  }

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline blocking script: applies saved theme before first paint to prevent flash.
            Phase A: dark-mode default switch is intentionally NOT enabled here —
            ThemeProvider's React state must change in lockstep to avoid hydration
            mismatch. Both will flip together in Phase B. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('urbanix-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        {/* Noto Sans SC — loaded via <link> so the browser can use CSS
            unicode-range to only download CJK glyphs when actually rendered.
            EN / MS users incur zero CJK font weight. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700;800&display=swap"
        />
        {/* Phase 3C PR 1: GA4 base script. No-op when NEXT_PUBLIC_GA4_ID
            is unset — no script tag, no network request, no errors. */}
        <AnalyticsScripts />
      </head>
      <body className="min-h-full bg-background text-foreground">
        {/* Suspense wrap: useSearchParams inside RouteEvents requires it.
            Renders nothing, so an empty fallback is fine. */}
        <Suspense fallback={null}>
          <RouteEvents />
        </Suspense>
        <ThemeProvider>
          <LanguageProvider>
            <CartProvider>
              <AppHeader />
              {children}
              <StorefrontFooter />
              <FloatingWhatsAppButton whatsappNumber={whatsappNumber} />
              <AddToCartToast />
            </CartProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
