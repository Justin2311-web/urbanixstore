"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

/**
 * Fires a GA4 pageview on every App Router navigation.
 *
 * The App Router does not re-run the root layout's <Script> blocks
 * on client-side navigation, and we disabled GA4's auto-pageview
 * in <AnalyticsScripts /> to keep firing centralised here. So this
 * component is the single source of pageview events for the whole
 * site, including the initial mount.
 *
 * Renders nothing.
 */
export function RouteEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Reconstruct the path including search params so /search?q=fan
    // and /search?q=holder are tracked as distinct pageviews.
    const search = searchParams?.toString() ?? "";
    const fullPath = pathname + (search ? `?${search}` : "");
    trackPageView(fullPath);
  }, [pathname, searchParams]);

  return null;
}
