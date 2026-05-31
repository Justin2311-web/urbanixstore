"use client";

import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import { createWhatsAppHref, getWhatsAppNumber } from "@/lib/order-links";

// Language-specific prefilled messages for the support WhatsApp button.
// Kept here (not in i18n) so the message string travels with the link and stays
// stable even if i18n keys are renamed later.
const PREFILL_MESSAGE: Record<"en" | "zh" | "ms", string> = {
  en: "Hi Urbanix Store, I need help with my order.",
  zh: "你好 Urbanix Store，我想咨询订单/产品。",
  ms: "Hai Urbanix Store, saya perlukan bantuan tentang pesanan/produk.",
};

const ARIA_LABEL: Record<"en" | "zh" | "ms", string> = {
  en: "Chat with us on WhatsApp",
  zh: "在 WhatsApp 上联系我们",
  ms: "Sembang dengan kami di WhatsApp",
};

export function FloatingWhatsAppButton({
  whatsappNumber,
}: {
  // Plain string from server-side settings — empty/undefined hides the button.
  whatsappNumber?: string | null;
}) {
  const { language } = useLanguage();

  // Honour admin-configured number only. Do not fall back to a hard-coded
  // default here; if the store has not set a WhatsApp number, we should not
  // surface a floating CTA that goes nowhere useful.
  if (!whatsappNumber || !whatsappNumber.trim()) {
    return null;
  }

  // Normalise via the existing helper so we always get a digits-only wa.me
  // target (handles "+60", spaces, dashes uniformly).
  const number = getWhatsAppNumber({ whatsappNumber });
  const message = PREFILL_MESSAGE[language] ?? PREFILL_MESSAGE.en;
  const href = createWhatsAppHref(number, message);
  const ariaLabel = ARIA_LABEL[language] ?? ARIA_LABEL.en;

  return (
    <a
      aria-label={ariaLabel}
      className={[
        // Position: keep clear of the mobile bottom nav (fixed bottom-0, ~64px tall + safe-area).
        // On desktop there is no nav, so we can sit lower.
        "fixed right-4 z-40",
        "bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 md:right-6",
        // Button styling — solid WhatsApp green, large enough to tap, slight shadow.
        "flex size-14 items-center justify-center rounded-full",
        "bg-[#25D366] text-white shadow-[0_12px_32px_rgba(37,211,102,0.45)]",
        "transition-transform duration-200 hover:scale-[1.05] active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2",
      ].join(" ")}
      href={href}
      rel="noreferrer noopener"
      target="_blank"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
