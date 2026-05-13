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
    <footer className="mt-20 border-t border-border/50 bg-secondary/30 pb-[calc(12rem+env(safe-area-inset-bottom))] pt-16 md:pb-16 dark:bg-card/50">
      <div className="urbanix-container grid gap-12 md:grid-cols-[1.5fr_2fr_1.5fr]">
        <div className="flex flex-col gap-6">
          <BrandLogo logoUrl={settings.logoUrl} storeName={settings.storeName} />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            <LocalizedValue fallback={settings.storeTagline} value={data.footer.store_tagline} />{" "}
            <LocalizedValue fallback="Curated essentials for small everyday wins." value={data.footer.tagline_extra} />
          </p>
          <div className="flex gap-3">
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
                className={`flex size-10 items-center justify-center rounded-full border border-border bg-background transition hover:bg-secondary ${href ? "" : "pointer-events-none opacity-45"}`}
                href={href || "#"}
                key={label}
              >
                <span className="sr-only">{label}</span>
                <Icon className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
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

        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
              <LocalizedValue fallback="Newsletter" value={data.footer.contact_title} />
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              <LocalizedValue fallback="Join our community for the latest updates." value={data.footer.need_help} />
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                className="h-12 rounded-full border-border bg-white px-5"
                placeholder="Email address"
              />
              <Link className={buttonVariants({ className: "h-12 rounded-full px-6", variant: "default" })} href="/">
                <LocalizedText fallback="Join" k="common.subscribe" />
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-xs font-bold text-muted-foreground">
            {settings.contactEmail ? <a className="hover:text-primary" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : null}
            {settings.contactPhone ? <a className="hover:text-primary" href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a> : null}
          </div>
        </div>
      </div>
      <div className="urbanix-container mt-16 border-t border-border/50 pt-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        © {new Date().getFullYear()} {settings.storeName}. All rights reserved.
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
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">
        {titleValue ? <LocalizedValue fallback={title} value={titleValue} /> : <LocalizedText fallback={title} k={titleKey ?? title} />}
      </h2>
      <div className="flex flex-col gap-2.5">
        {links.map((link) => (
          <Link className="text-xs font-bold text-muted-foreground transition-colors hover:text-primary" href={link.href} key={link.label}>
            {link.localizedLabel ? (
              <LocalizedValue fallback={link.label} value={link.localizedLabel} />
            ) : (
              <LocalizedText fallback={link.label} k={link.key ?? `category.${link.label}`} />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

