/**
 * Analytics config + helpers.
 *
 * Phase 3C PR 1 scope: GA4 base + pageview only.
 *
 * IDs are NEVER hardcoded — they are read from public env vars at
 * bundle time. If the env var for a provider is missing, that
 * provider is silently disabled: no script tag rendered, helpers
 * no-op.
 *
 * Future PRs will add Meta Pixel, TikTok Pixel, and e-commerce
 * events (ViewContent, AddToCart, InitiateCheckout, Purchase).
 */

/**
 * Returns the trimmed env value, or null when missing/empty. Reads at
 * module load so the bundler can tree-shake unused branches in code
 * that gates on these constants.
 */
function readPublicEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export const ANALYTICS_CONFIG = {
  /** GA4 Measurement ID, e.g. "G-XXXXXXXXXX". Null when unset. */
  ga4Id: readPublicEnv(process.env.NEXT_PUBLIC_GA4_ID),
} as const;

/**
 * Minimal gtag typing — we only call `(command, ...args)`. Avoid
 * pulling in @types/gtag.js (not a deployed dependency).
 */
type GtagFn = (command: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    /** GA4 dataLayer queue, populated before gtag.js loads. */
    dataLayer?: unknown[];
    /** GA4 gtag function — undefined until the GA4 script has loaded. */
    gtag?: GtagFn;
  }
}

/**
 * Fire a GA4 pageview for the given path.
 *
 * Called by RouteEvents on every App Router navigation. Safe to call
 * before the GA4 script finishes loading: gtag.js queues onto
 * window.dataLayer until it's ready.
 *
 * No-op when:
 * - Running on the server (typeof window === "undefined")
 * - GA4 not configured (no env)
 * - GA4 stub not yet installed (window.gtag undefined)
 *
 * Errors are swallowed so analytics can never crash a customer flow.
 */
export function trackPageView(path: string): void {
  try {
    if (typeof window === "undefined") return;
    if (!ANALYTICS_CONFIG.ga4Id) return;
    if (typeof window.gtag !== "function") return;

    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    });
  } catch (err) {
    // Never let analytics throw into customer flow.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[analytics] trackPageView failed:", err);
    }
  }
}
