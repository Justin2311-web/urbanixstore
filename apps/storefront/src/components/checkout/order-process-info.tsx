"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle, Package, Search } from "lucide-react";
import type { StoreSettings } from "@ecommerce/shared";
import { createWhatsAppHref, getWhatsAppNumber } from "@/lib/order-links";
import { useLanguage } from "@/components/i18n/language-provider";

/**
 * Reassurance card shown on the checkout page below Payment Method.
 *
 * Communicates the manual-verification workflow so customers know what
 * to expect after submitting:
 *   1. Payment is manually verified within 24h
 *   2. We pack and ship after verification
 *   3. Customer can track from My Orders
 *
 * WhatsApp prompt is conditional on settings.whatsappNumber, identical
 * gate to FloatingWhatsAppButton / ProductTrustBadges — never surface
 * a CTA that goes nowhere.
 */
export function OrderProcessInfo({ settings }: { settings: StoreSettings }) {
  const { t } = useLanguage();

  const hasWhatsApp = Boolean(settings.whatsappNumber && settings.whatsappNumber.trim());
  const whatsappHref = hasWhatsApp
    ? createWhatsAppHref(
        getWhatsAppNumber(settings),
        t("orderProcess.supportMessage", "Hi Urbanix Store, I just placed an order and need help."),
      )
    : null;

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 text-sm dark:bg-[rgba(11,21,40,0.62)]"
      data-component="order-process-info"
    >
      <p className="mb-3 text-xs font-black uppercase tracking-widest text-primary">
        {t("orderProcess.title", "After You Submit")}
      </p>
      <ul className="flex flex-col gap-2.5">
        <Step
          icon={CheckCircle2}
          text={t("orderProcess.step1Verify", "Your payment is manually verified within 24 hours")}
        />
        <Step
          icon={Package}
          text={t("orderProcess.step2Ship", "We pack and ship after verification")}
        />
        <Step
          icon={Search}
          text={t("orderProcess.step3Track", "Track your order anytime from My Orders")}
        />
      </ul>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/track-order"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"
        >
          <Search className="size-3.5" />
          {t("orderProcess.trackCta", "Track My Order")}
        </Link>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer noopener"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100"
          >
            <MessageCircle className="size-3.5" />
            {t("orderProcess.helpPrompt", "Need help? WhatsApp us.")}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  text,
}: {
  icon: typeof CheckCircle2;
  text: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <Icon className="size-3.5" />
      </span>
      <span className="text-xs font-semibold text-foreground sm:text-sm">{text}</span>
    </li>
  );
}
