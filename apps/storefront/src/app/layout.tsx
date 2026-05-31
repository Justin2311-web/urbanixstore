import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { AppHeader } from "@/components/app-header";
import { AddToCartToast } from "@/components/cart/add-to-cart-toast";
import { CartProvider } from "@/components/cart/cart-provider";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { StorefrontFooter } from "@/components/storefront-footer";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline blocking script: applies saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('urbanix-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
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
