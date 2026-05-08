import Link from "next/link";
import { AtSign, CirclePlay, MessageCircle, Music2, Send } from "lucide-react";
import { listStorefrontCategories, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { BrandLogo } from "@/components/brand-logo";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";

const socialLinks = [
  { icon: AtSign, label: "Email" },
  { icon: Send, label: "Telegram" },
  { icon: Music2, label: "TikTok" },
  { icon: CirclePlay, label: "Video" },
];

export async function StorefrontFooter() {
  const data = await readUrbanixStoreDataAsync();
  const { settings } = data;
  const categories = listStorefrontCategories(data);

  return (
    <footer className="mt-8 bg-primary text-primary-foreground">
      <div className="urbanix-container grid gap-8 py-8 md:grid-cols-[1.3fr_2fr_1.3fr]">
        <div className="flex flex-col gap-4">
          <BrandLogo inverse />
          <p className="max-w-xs text-sm text-white/75">
            {settings.storeTagline} Curated essentials for small everyday wins.
          </p>
          <div className="flex gap-2 text-white/80">
            {socialLinks.map(({ icon: Icon, label }) => (
              <span
                className="flex size-8 items-center justify-center rounded-full bg-white/10"
                key={label}
              >
                <span className="sr-only">{label}</span>
                <Icon className="size-4" />
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 text-sm">
          <FooterGroup
            links={categories.map((category) => ({
              href: category.href,
              label: category.name,
            }))}
            title="Shop"
          />
          <FooterGroup
            links={[
              { href: "/cart", label: "Shipping" },
              { href: "/cart", label: "Returns" },
              { href: "/cart", label: "Contact Us" },
            ]}
            title="Help"
          />
          <FooterGroup
            links={[
              { href: "/", label: "Our Story" },
              { href: "/", label: "Blog" },
              { href: "/", label: "Privacy Policy" },
            ]}
            title="About"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold uppercase text-white">Contact</h2>
          <p className="text-sm text-white/75">Need help choosing? Talk to us directly.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className={buttonVariants({
                className: "bg-success text-white hover:bg-success/90",
              })}
              href={`https://wa.me/${settings.whatsappNumber}`}
            >
              <MessageCircle />
              WhatsApp
            </Link>
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              className="border-white/20 bg-white text-foreground"
              placeholder="Enter your email"
            />
            <Link className={buttonVariants({ variant: "secondary" })} href="/">
              Subscribe
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
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase text-white">{title}</h2>
      {links.map((link) => (
        <Link className="text-xs text-white/75 hover:text-white" href={link.href} key={link.label}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}
