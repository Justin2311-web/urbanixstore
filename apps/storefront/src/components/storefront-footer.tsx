import Link from "next/link";
import { AtSign, CirclePlay, MessageCircle, Music2, Send } from "lucide-react";
import { listStorefrontCategories, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { BrandLogo } from "@/components/brand-logo";
import { LocalizedText } from "@/components/i18n/localized-text";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

export async function StorefrontFooter() {
  const data = await readUrbanixStoreDataAsync();
  const { settings } = data;
  const categories = listStorefrontCategories(data);

  return (
    <footer className="mt-8 bg-primary pb-[calc(14rem+env(safe-area-inset-bottom))] text-primary-foreground md:pb-0">
      <div className="urbanix-container grid gap-8 py-8 md:grid-cols-[1.3fr_2fr_1.3fr]">
        <div className="flex flex-col gap-4">
          <BrandLogo inverse logoUrl={settings.logoUrl} storeName={settings.storeName} />
          <p className="max-w-xs text-sm text-white/75">
            <LocalizedValue fallback={settings.storeTagline} value={data.footer.store_tagline} />{" "}
            <LocalizedValue fallback="Curated essentials for small everyday wins." value={data.footer.tagline_extra} />
          </p>
          <div className="flex gap-2 text-white/80">
            {[
              { href: settings.contactEmail ? `mailto:${settings.contactEmail}` : "", icon: AtSign, label: "Email" },
              { href: settings.socialLinks.facebook, icon: Send, label: "Facebook" },
              { href: settings.socialLinks.tiktok, icon: Music2, label: "TikTok" },
              { href: settings.socialLinks.instagram, icon: CirclePlay, label: "Instagram" },
            ].filter((item) => item.href).map(({ href, icon: Icon, label }) => (
              <Link
                className="flex size-8 items-center justify-center rounded-full bg-white/10"
                href={href}
                key={label}
              >
                <span className="sr-only">{label}</span>
                <Icon className="size-4" />
              </Link>
            ))}
          </div>
        </div>

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
              { href: "/cart", label: "Shipping", key: "footer.shipping", localizedLabel: data.footer.shipping },
              { href: "/cart", label: "Returns", key: "footer.returns", localizedLabel: data.footer.returns },
              { href: "/cart", label: "Contact Us", key: "footer.contactUs", localizedLabel: data.footer.contact_us },
            ]}
            titleValue={data.footer.help_title}
            titleKey="footer.help"
            title="Help"
          />
          <FooterGroup
            links={[
              { href: "/", label: "Our Story", key: "footer.ourStory", localizedLabel: data.footer.our_story },
              { href: "/", label: "Blog", key: "footer.blog", localizedLabel: data.footer.blog },
              { href: "/", label: "Privacy Policy", key: "footer.privacy", localizedLabel: data.footer.privacy_policy },
            ]}
            titleValue={data.footer.about_title}
            titleKey="footer.about"
            title="About"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase text-white">
            <LocalizedValue fallback="Contact" value={data.footer.contact_title} />
          </h2>
          <p className="text-sm text-white/75">
            <LocalizedValue fallback="Need help choosing? Talk to us directly." value={data.footer.need_help} />
          </p>
          <div className="grid gap-1 text-xs font-semibold text-white/75">
            {settings.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : null}
            {settings.contactPhone ? <a href={`tel:${settings.contactPhone}`}>{settings.contactPhone}</a> : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className={buttonVariants({
                className: "bg-success text-white hover:bg-success/90",
              })}
              href={`https://wa.me/${settings.whatsappNumber}`}
            >
              <MessageCircle />
              <LocalizedText fallback="WhatsApp" k="common.whatsapp" />
            </Link>
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              className="border-white/20 bg-white text-foreground"
              placeholder="Enter your email"
            />
            <Link className={buttonVariants({ variant: "secondary" })} href="/">
              <LocalizedText fallback="Subscribe" k="common.subscribe" />
            </Link>
          </div>
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
      <h2 className="text-sm font-bold uppercase text-white">
        {titleValue ? <LocalizedValue fallback={title} value={titleValue} /> : <LocalizedText fallback={title} k={titleKey ?? title} />}
      </h2>
      {links.map((link) => (
        <Link className="text-xs text-white/75 hover:text-white" href={link.href} key={link.label}>
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
