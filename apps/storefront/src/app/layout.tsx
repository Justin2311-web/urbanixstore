import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { AppHeader } from "@/components/app-header";
import { CartProvider } from "@/components/cart/cart-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { StorefrontFooter } from "@/components/storefront-footer";
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
  try {
    const { settings } = await readUrbanixStoreDataAsync();

    return {
      description: settings.storeTagline || "Smart picks for urban life.",
      icons: settings.favicon || "/favicon.ico",
      title: settings.storeName || "Urbanix Store",
    };
  } catch {
    return {
      description: "Smart picks for urban life.",
      title: "Urbanix Store",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <LanguageProvider>
          <CartProvider>
            <AppHeader />
            {children}
            <StorefrontFooter />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
