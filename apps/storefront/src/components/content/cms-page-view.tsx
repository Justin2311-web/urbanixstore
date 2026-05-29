"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import type { StorefrontPage, StoreSettings } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";
import { LocalizedText } from "@/components/i18n/localized-text";
import { buttonVariants } from "@/components/ui/button";
import { getWhatsAppNumber } from "@/lib/order-links";
import { cn } from "@/lib/utils";

type CmsPageViewProps = {
  page: StorefrontPage;
  settings: Pick<StoreSettings, "whatsappNumber">;
};

export function CmsPageView({ page, settings }: CmsPageViewProps) {
  const { language } = useLanguage();
  const title = page.localizedTitle?.[language] || page.localizedTitle?.en || page.title;
  const content = page.localizedContent?.[language] || page.localizedContent?.en || page.content;
  const blocks = parseContent(content);

  return (
    <main className="pb-20 md:pb-0">
      <section className="border-b border-primary/10 bg-linear-to-br from-[#eaf3ff] via-white to-[#fff4e7] dark:border-white/10 dark:from-[#0a1530] dark:via-[#06101f] dark:to-[#0a1426]">
        <div className="urbanix-container py-8 sm:py-12">
          <Link className="mb-5 inline-flex items-center gap-2 text-xs font-bold uppercase text-primary dark:text-[#7cc0ff]" href="/">
            <ArrowLeft className="size-4" />
            <LocalizedText fallback="Back to Store" k="common.backToStore" />
          </Link>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Urbanix Store</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold text-primary sm:text-5xl dark:text-slate-50">{title}</h1>
        </div>
      </section>

      <section className="urbanix-container py-8 sm:py-12">
        <article className="max-w-3xl text-base leading-8 text-slate-700 sm:text-lg dark:text-slate-200">
          {blocks.map((block, index) => {
            if (block.type === "list") {
              return (
                <ul className="my-5 grid gap-2 pl-5" key={`list-${index}`}>
                  {block.items.map((item) => (
                    <li
                      className="list-disc marker:text-accent text-slate-700 dark:text-slate-200 dark:marker:text-[#ffd166]"
                      key={item}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }

            return (
              <p
                className={cn(
                  "mb-5",
                  index === 0 && block.text.length < 40
                    ? "text-xl font-extrabold text-primary dark:text-slate-50"
                    : "dark:text-slate-200"
                )}
                key={`p-${index}`}
              >
                {block.text}
              </p>
            );
          })}
        </article>

        {page.key === "contact_us" ? (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className={buttonVariants({ className: "bg-success text-white hover:bg-success/90" })} href={`https://wa.me/${getWhatsAppNumber(settings)}`}>
              <MessageCircle />
              <LocalizedText fallback="WhatsApp" k="common.whatsapp" />
            </Link>
            <Link className={buttonVariants({ variant: "secondary" })} href="/products">
              <LocalizedText fallback="Shop Now" k="common.shopNow" />
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

type ContentBlock = { type: "paragraph"; text: string } | { type: "list"; items: string[] };

function parseContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const paragraphLines: string[] = [];
  const listItems: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({ text: paragraphLines.join(" "), type: "paragraph" });
      paragraphLines.length = 0;
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ items: [...listItems], type: "list" });
      listItems.length = 0;
    }
  }

  for (const rawLine of `${content.replace(/\r\n/g, "\n")}\n`.split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }

    flushList();
    paragraphLines.push(line);
  }

  return blocks;
}
