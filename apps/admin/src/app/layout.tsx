import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { AppHeader } from "@/components/app-header";
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

export const metadata: Metadata = {
  title: "Urbanix Admin",
  description: "Business owner dashboard for Urbanix Store.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
        <AppHeader />
        <div className="lg:pl-64">
          <div className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b bg-card px-6 lg:flex">
            <p className="text-sm font-bold text-muted-foreground">Admin Dashboard</p>
            <p className="text-xs font-semibold text-muted-foreground">Urbanix Store</p>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
