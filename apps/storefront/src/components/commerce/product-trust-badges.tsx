"use client";

import Link from "next/link";
import { LockKeyhole, MessageCircle, Search, Truck } from "lucide-react";
import type { StoreSettings } from "@ecommerce/shared";
import { createWhatsAppHref, getWhatsAppNumber } from "@/lib/order-links";
import { useLanguage } from "@/components/i18n/language-provider";

/**
 * Site-wide trust badges shown on every product detail page.
 *
 * Distinct from ProductHighlights (which is admin-defined per-product
 * marketing copy). These four badges are fixed and reinforce purchase
 * confidence: secure checkout, MY delivery, support, order tracking.
 *
 * The WhatsApp badge is only rendered when settings.whatsappNumber is
 * configured, mirroring FloatingWhatsAppButton's behaviour so we never
 * surface a CTA that goes nowhere.
 */
export function ProductTrustBadges({ settings }: { settings: StoreSettings }) {
  const { t } = useLanguage();
  const hasWhatsApp = Boolean(settings.whatsappNumber && settings.whatsappNumber.trim());
  const whatsappHref = hasWhatsApp
    ? createWhatsAppHref(getWhatsAppNumber(settings), "Hi Urbanix Store, I have a question about a product.")
    : null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4" data-component="product-trust-badges">
      <Badge icon={LockKeyhole} label={t("trustBadges.secureCheckout", "Secure Checkout")} />
      <Badge icon={Truck} label={t("trustBadges.malaysiaDelivery", "Malaysia Delivery")} />
      {whatsappHref ? (
        <Badge
          icon={MessageCircle}
          label={t("trustBadges.whatsappSupport", "WhatsApp Support")}
          href={whatsappHref}
          external
        />
      ) : null}
      <Badge
        icon={Search}
        label={t("trustBadges.orderTracking", "Easy Order Tracking")}
        href="/track-order"
      />
    </div>
  );
}

function Badge({
  icon: Icon,
  label,
  href,
  external = false,
}: {
  icon: typeof LockKeyhole;
  label: string;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <div className="urbanix-surface flex h-full items-center gap-3 p-3 transition-transform hover:scale-[1.02]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon className="size-4" />
      </span>
      <span className="text-xs font-extrabold text-foreground sm:text-sm">{label}</span>
    </div>
  );

  if (!href) return body;
  if (external) {
    return (
      <a href={href} rel="noreferrer noopener" target="_blank" className="block">
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className="block">
      {body}
    </Link>
  );
}
