import Link from "next/link";
import { AtSign } from "lucide-react";
import { listStorefrontCategories, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { BrandLogo } from "@/components/brand-logo";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { getWhatsAppNumber } from "@/lib/order-links";

// ── Branded SVG icon components ──────────────────────────────────────────────

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function ShopeeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C8.15 0 5.02 3.01 5.02 6.72c0 .37.03.73.08 1.09H2.4C1.08 7.81 0 8.9 0 10.21v10.83C0 22.35 1.08 23.43 2.4 23.43h19.2c1.32 0 2.4-1.08 2.4-2.39V10.21c0-1.31-1.08-2.4-2.4-2.4h-2.7c.05-.36.08-.72.08-1.09C18.98 3.01 15.85 0 12 0zm0 2.03c2.6 0 4.72 2.09 4.72 4.69 0 .37-.04.73-.12 1.09H7.4c-.08-.36-.12-.72-.12-1.09 0-2.6 2.12-4.69 4.72-4.69zm-4.44 10.3c.97 0 1.72.36 2.3 1.07.14.17.13.43-.04.57l-.78.67c-.17.15-.42.12-.57-.06-.35-.41-.74-.6-1.27-.6-.65 0-1.14.34-1.14.82 0 .44.32.67 1.5 1.02 1.61.46 2.35 1.1 2.35 2.35 0 1.38-1.14 2.29-2.84 2.29-1.13 0-2.03-.39-2.68-1.19-.14-.18-.1-.43.08-.57l.78-.64c.18-.15.43-.11.57.07.41.49.86.71 1.49.71.75 0 1.24-.35 1.24-.88 0-.48-.32-.72-1.58-1.09-1.51-.44-2.22-1.09-2.22-2.3 0-1.28 1.05-2.24 2.81-2.24zm5.06.11h1.11c.22 0 .4.18.4.4v5.61c0 .23-.18.4-.4.4h-1.11c-.22 0-.4-.17-.4-.4v-5.61c0-.22.18-.4.4-.4zm3.65 0h1.02c.22 0 .4.18.4.4v2.1l1.73-2.33c.07-.1.19-.17.32-.17h1.15c.3 0 .47.35.28.58l-1.83 2.3 1.96 2.87c.17.25 0 .59-.3.59h-1.18c-.14 0-.27-.07-.33-.19l-1.8-2.75v2.54c0 .23-.18.4-.4.4h-1.02c-.22 0-.4-.17-.4-.4v-5.54c0-.22.18-.4.4-.4z" />
    </svg>
  );
}

function LazadaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.74 0C5.25 0 0 5.25 0 11.74S5.25 23.48 11.74 23.48 23.48 18.23 23.48 11.74 18.23 0 11.74 0zm0 2.16c5.28 0 9.58 4.3 9.58 9.58s-4.3 9.58-9.58 9.58S2.16 17.02 2.16 11.74 6.46 2.16 11.74 2.16zM7.9 6.5v7.59h5.68v1.91H5.99V6.5zm5.79 0h1.91v9.5h-1.91zm3.43 0h1.91v9.5h-1.91z" />
    </svg>
  );
}

export async function StorefrontFooter() {
  const data = await readUrbanixStoreDataAsync();
  const { settings } = data;
  const categories = listStorefrontCategories(data);

  return (
    <footer className="relative mt-8 overflow-hidden bg-[#06101f] pb-[calc(14rem+env(safe-area-inset-bottom))] text-[#c8d8ef] dark:bg-[#030913] md:pb-0">
      {/* Subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[rgba(59,158,255,0.3)] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[rgba(59,158,255,0.04)] to-transparent" />

      <div className="urbanix-container relative grid gap-8 py-10 md:grid-cols-[1.3fr_2fr_1.3fr]">
        {/* Brand column */}
        <div className="flex flex-col gap-4">
          <BrandLogo inverse logoUrl={settings.logoUrl} storeName={settings.storeName} />
          <p className="max-w-xs text-sm text-[#7a95b5]">
            <LocalizedValue fallback={settings.storeTagline} value={data.footer.store_tagline} />{" "}
            <LocalizedValue fallback="Curated essentials for small everyday wins." value={data.footer.tagline_extra} />
          </p>
          {/* Social & marketplace icons — always rendered; greyed when URL not configured */}
          <div className="flex flex-wrap gap-2">
            {settings.contactEmail ? (
              <a
                aria-label="Email"
                className="flex size-8 items-center justify-center rounded-full border border-[rgba(59,158,255,0.15)] bg-[rgba(59,158,255,0.07)] text-[#7a95b5] transition hover:border-[rgba(59,158,255,0.35)] hover:bg-[rgba(59,158,255,0.15)] hover:text-[#3b9eff]"
                href={`mailto:${settings.contactEmail}`}
              >
                <AtSign className="size-3.5" />
              </a>
            ) : null}
            {[
              { href: settings.socialLinks?.facebook ?? "", icon: FacebookIcon, label: "Facebook" },
              { href: settings.socialLinks?.instagram ?? "", icon: InstagramIcon, label: "Instagram" },
              { href: settings.socialLinks?.tiktok ?? "", icon: TikTokIcon, label: "TikTok" },
              { href: settings.platformLinks?.shopee ?? "", icon: ShopeeIcon, label: "Shopee" },
              { href: settings.platformLinks?.lazada ?? "", icon: LazadaIcon, label: "Lazada" },
            ].map(({ href, icon: Icon, label }) =>
              href ? (
                <a
                  aria-label={label}
                  className="flex size-8 items-center justify-center rounded-full border border-[rgba(59,158,255,0.15)] bg-[rgba(59,158,255,0.07)] text-[#7a95b5] transition hover:border-[rgba(59,158,255,0.35)] hover:bg-[rgba(59,158,255,0.15)] hover:text-[#3b9eff]"
                  href={href}
                  key={label}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon className="size-3.5" />
                </a>
              ) : null
            )}
          </div>
        </div>

        {/* Links column */}
        <div className="grid grid-cols-3 gap-5 text-sm">
          <FooterGroup
            links={categories.map((category) => ({
              href: category.href,
              label: category.name,
              localizedLabel: category.localizedName,
            }))}
            titleValue={data.footer.shop_title}
            titleKey="footer.shop"
            title="Shop"
          />
          <FooterGroup
            links={[
              { href: "/track-order", label: "Track Order", localizedLabel: { en: "Track Order", ms: "Jejak Pesanan", zh: "追踪订单" } },
              { href: "/shipping", label: "Shipping", key: "footer.shipping", localizedLabel: data.footer.shipping },
              { href: "/contact-us", label: "Contact Us", key: "footer.contactUs", localizedLabel: data.footer.contact_us },
            ]}
            titleValue={data.footer.help_title}
            titleKey="footer.help"
            title="Help"
          />
          <FooterGroup
            links={[
              { href: "/our-story", label: "Our Story", key: "footer.ourStory", localizedLabel: data.footer.our_story },
              { href: "/privacy-policy", label: "Privacy Policy", key: "footer.privacy", localizedLabel: data.footer.privacy_policy },
            ]}
            titleValue={data.footer.about_title}
            titleKey="footer.about"
            title="About"
          />
        </div>

        {/* Contact column */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#dde6f5]">
            <LocalizedValue fallback="Contact" value={data.footer.contact_title} />
          </h2>
          <p className="text-sm text-[#7a95b5]">
            <LocalizedValue fallback="Need help choosing? Talk to us directly." value={data.footer.need_help} />
          </p>
          <div className="grid gap-1 text-xs font-semibold text-[#6b8db5]">
            {settings.contactEmail ? <a className="hover:text-[#3b9eff] transition-colors" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : null}
            {settings.contactPhone ? <a className="hover:text-[#3b9eff] transition-colors" href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a> : null}
          </div>
          {settings.whatsappNumber && (
            <a
              className="text-xs font-semibold text-[#6b8db5] hover:text-[#3b9eff] transition-colors"
              href={`https://wa.me/${getWhatsAppNumber(settings)}`}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp: {settings.whatsappNumber}
            </a>
          )}
          <div className="mt-2 flex gap-2">
            <Input
              className="border-[rgba(59,158,255,0.2)] bg-[rgba(59,158,255,0.06)] text-[#c8d8ef] placeholder:text-[#4a6a8a] focus:border-[rgba(59,158,255,0.4)]"
              placeholder="Enter your email"
            />
            <Link className={buttonVariants({ variant: "secondary" })} href="/">
              <LocalizedText fallback="Subscribe" k="common.subscribe" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[rgba(59,158,255,0.1)]">
        <div className="urbanix-container flex flex-col items-center justify-between gap-2 py-4 text-xs text-[#4a6a8a] sm:flex-row">
          <span>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</span>
          <span>Powered by Urbanix Commerce</span>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({
  links,
  title,
  titleKey,
  titleValue,
}: {
  title: string;
  titleKey?: string;
  titleValue?: { en: string; zh?: string; ms?: string };
  links: Array<{ href: string; label: string; key?: string; localizedLabel?: { en: string; zh?: string; ms?: string } }>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[#dde6f5]">
        {titleValue ? <LocalizedValue fallback={title} value={titleValue} /> : <LocalizedText fallback={title} k={titleKey ?? title} />}
      </h2>
      {links.map((link) => (
        <Link className="text-xs text-[#7a95b5] transition-colors hover:text-[#3b9eff]" href={link.href} key={link.label}>
          {link.localizedLabel ? (
            <LocalizedValue fallback={link.label} value={link.localizedLabel} />
          ) : (
            <LocalizedText fallback={link.label} k={link.key ?? `category.${link.label}`} />
          )}
        </Link>
      ))}
    </div>
  );
}
