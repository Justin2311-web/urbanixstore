"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";

/**
 * Custom DOM event dispatched by callers AFTER a successful addItem.
 * Kept as a string constant so the panel + button can import it and
 * stay in sync with the listener here.
 */
export const ADD_TO_CART_EVENT = "urbanix-cart:added";

/**
 * Lightweight, no-dependency add-to-cart toast.
 *
 * Listens to a window CustomEvent so neither the cart provider nor the
 * callers need to know about the toast — we only fire it from places
 * we know are *successful* adds (post-validation), which means an
 * unselected variant on the product page never reaches us.
 *
 * Mounted once at the root layout. Auto-dismisses after 3.5s.
 */
export function AddToCartToast() {
  const { t } = useLanguage();
  // We key on a counter so consecutive adds restart the dismiss timer
  // even when the visible message is identical.
  const [visibleKey, setVisibleKey] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onAdded() {
      setVisibleKey((current) => (current ?? 0) + 1);
    }
    window.addEventListener(ADD_TO_CART_EVENT, onAdded);
    return () => {
      window.removeEventListener(ADD_TO_CART_EVENT, onAdded);
    };
  }, []);

  useEffect(() => {
    if (visibleKey === null) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisibleKey(null), 3500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visibleKey]);

  if (visibleKey === null) return null;

  // Position note:
  // - Sits above the mobile sticky CTA (which is bottom-0, ~4rem tall +
  //   safe-area) so it never gets covered on the product detail page.
  // - On desktop sits bottom-6 / right-6, clear of the WhatsApp FAB on
  //   the left? No — WhatsApp is bottom-right. We anchor the toast
  //   centered on mobile and bottom-left-ish on desktop to avoid
  //   overlapping the WhatsApp circle.
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:left-6 md:right-auto md:bottom-6 md:justify-start md:px-0"
      data-component="add-to-cart-toast"
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-card p-3 pr-2 shadow-[0_18px_44px_rgba(15,23,42,0.18)] dark:bg-[rgba(11,21,40,0.96)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.45)]">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-5" />
        </span>
        <div className="flex-1 text-sm font-bold text-foreground">
          {t("cart.toast.added", "Added to cart")}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-secondary/70 hover:text-foreground"
            onClick={() => setVisibleKey(null)}
            type="button"
          >
            {t("cart.toast.continue", "Continue Shopping")}
          </button>
          <Link
            className="rounded-xl bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
            href="/cart"
            onClick={() => setVisibleKey(null)}
          >
            {t("cart.toast.view", "View Cart")}
          </Link>
          <button
            aria-label="Close"
            className="ml-0.5 rounded-lg p-1 text-muted-foreground transition hover:bg-secondary/70 hover:text-foreground"
            onClick={() => setVisibleKey(null)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
