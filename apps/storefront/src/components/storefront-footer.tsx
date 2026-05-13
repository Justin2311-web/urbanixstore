import Link from "next/link";
import { AtSign, CirclePlay, MessageCircle, Music2, Send, ShoppingBag, Store } from "lucide-react";
import { listStorefrontCategories, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { BrandLogo } from "@/components/brand-logo";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { getWhatsAppNumber } from "@/lib/order-links";

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
          <div className="flex gap-2">
            {[
              { href: settings.contactEmail ? `mailto:${settings.contactEmail}` : "", icon: AtSign, label: "Email" },
              { href: settings.socialLinks.facebook, icon: Send, label: "Facebook" },
              { href: settings.socialLinks.instagram, icon: CirclePlay, label: "Instagram" },
              { href: settings.socialLinks.tiktok, icon: Music2, label: "TikTok" },
              { href: settings.platformLinks?.shopee ?? "", icon: ShoppingBag, label: "Shopee" },
              { href: settings.platformLinks?.lazada ?? "", icon: Store, label: "Lazada" },
            ].map(({ href, icon: Icon, label }) => (
              <Link
                aria-disabled={!href}
                className={`flex size-8 items-center justify-center rounded-full border border-[rgba(59,158,255,0.15)] bg-[rgba(59,158,255,0.07)] text-[#7a95b5] transition hover:border-[rgba(59,158,255,0.35)] hover:bg-[rgba(59,158,255,0.15)] hover:text-[#3b9eff] ${href ? "" : "pointer-events-none opacity-35"}`}
                href={href || "#"}
                key={label}
              >
                <span className="sr-only">{label}</span>
                <Icon className="size-3.5" />
              </Link>
            ))}
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
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className={buttonVariants({
                className: "bg-success text-white hover:bg-success/90",
              })}
              href={`https://wa.me/${getWhatsAppNumber(settings)}`}
            >
              <MessageCircle />
              <LocalizedText fallback="WhatsApp" k="common.whatsapp" />
            </Link>
          </div>
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
