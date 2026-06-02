import Script from "next/script";
import { ANALYTICS_CONFIG } from "@/lib/analytics";

/**
 * Loads third-party analytics scripts via next/script.
 *
 * Phase 3C PR 1: GA4 only. Each provider is independently gated on
 * its env var — if NEXT_PUBLIC_GA4_ID is not set, this component
 * renders nothing, no script tag is emitted, no network request is
 * made.
 *
 * Strategy: "afterInteractive" loads after hydration so we never
 * block FCP / LCP. SEO is unaffected.
 *
 * GA4 auto-pageview is disabled (`send_page_view: false`) so that
 * <RouteEvents /> is the single source of truth for pageviews —
 * this avoids double-firing on initial mount in the App Router.
 */
export function AnalyticsScripts() {
  const ga4Id = ANALYTICS_CONFIG.ga4Id;

  if (!ga4Id) return null;

  return (
    <>
      {/* gtag.js loader — async, non-blocking */}
      <Script
        id="ga4-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
        strategy="afterInteractive"
      />
      {/* gtag stub + config. Installed before gtag.js finishes so any
          calls to window.gtag(...) between this script and the loader
          finishing are safely queued onto dataLayer. */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ window.dataLayer.push(arguments); }
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${ga4Id}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
