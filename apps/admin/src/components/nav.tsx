"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: "DB" },
  { href: "/products", label: "Products", icon: "PK" },
  { href: "/categories", label: "Categories", icon: "CT" },
  { href: "/banners", label: "Banners", icon: "BN" },
  { href: "/promotions", label: "Promo Codes", icon: "PC" },
  { href: "/inventory", label: "Inventory", icon: "IV" },
  { href: "/orders", label: "Orders", icon: "OR" },
  { href: "/financial-report", label: "Financial Report", icon: "RM" },
  { href: "/customers", label: "Customers", icon: "CU" },
  { href: "/cms", label: "Homepage", icon: "HP" },
  { href: "/payments", label: "Payments", icon: "PY" },
  { href: "/settings", label: "Settings", icon: "ST" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-5">
        <Link href="/" className="text-lg font-extrabold text-[#0e5c56]">
          Urbanix Admin
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {links.map((link) => {
            const isActive =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

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
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-[10px] font-black text-gray-500">
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 px-3 py-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-[10px] font-black text-gray-500">
              OUT
            </span>
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const current = links.find((link) =>
    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
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
