"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/products", label: "Products", icon: "📦" },
  { href: "/categories", label: "Categories", icon: "🗂️" },
  { href: "/banners", label: "Banners", icon: "🖼️" },
  { href: "/inventory", label: "Inventory", icon: "🏷️" },
  { href: "/orders", label: "Orders", icon: "🛒" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/cms", label: "Homepage", icon: "🏠" },
  { href: "/payments", label: "Payments", icon: "💳" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-5">
        <Link href="/" className="text-lg font-extrabold text-[#0e5c56]">
          Urbanix Admin
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#e8f3ef] text-[#0e5c56]"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <span className="text-base">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="border-t border-gray-200 px-3 py-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <span>🚪</span>
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}

// Mobile top bar (shows current section name)
export function MobileNav() {
  const pathname = usePathname();
  const current = links.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
  );

  return (
    <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
      <span className="font-semibold text-gray-800">
        {current?.icon} {current?.label ?? "Admin"}
      </span>
      <Link href="/" className="text-sm font-bold text-[#0e5c56]">
        Urbanix
      </Link>
    </div>
  );
}
