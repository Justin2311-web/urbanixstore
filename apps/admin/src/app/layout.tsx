import type { Metadata } from "next";
import { Sidebar, MobileNav } from "@/components/nav";
import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Urbanix Admin",
  description: "Admin dashboard for Urbanix Store.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-100">
        {/* Desktop sidebar layout */}
        <div className="flex h-full">
          <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col">
            <Sidebar />
          </div>

          {/* Main content */}
          <div className="flex min-h-screen flex-1 flex-col lg:pl-56">
            <MobileNav />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
