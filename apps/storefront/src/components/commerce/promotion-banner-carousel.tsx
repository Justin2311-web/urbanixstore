"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageContent, LocalizedTextValue, PromotionBanner } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function localizedBannerText(
  value: LocalizedTextValue | undefined,
  language: "en" | "zh" | "ms",
  legacy = ""
) {
  return value?.[language] || value?.en || legacy || "";
}

const buttonPositionClasses: Record<NonNullable<PromotionBanner["buttonPosition"]>, string> = {
  "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
  "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
  "top-left": "left-4 top-4 sm:left-6 sm:top-6",
  "top-right": "right-4 top-4 sm:right-6 sm:top-6",
};

export function PromotionBannerCarousel({
  banners,
  fallback,
  freeShippingText,
}: {
  banners: PromotionBanner[];
  fallback: HomepageContent;
  freeShippingText?: LocalizedTextValue;
}) {
  const { language } = useLanguage();
  const slides: PromotionBanner[] = banners.length > 0
    ? banners
    : [{
        buttonEnabled: true,
        buttonPosition: "bottom-left",
        buttonUrl: fallback.heroButtonLink,
        buttonText: {
          bm: fallback.localizedHeroButtonText?.ms || fallback.localizedHeroButtonText?.en || fallback.heroButtonText,
          en: fallback.localizedHeroButtonText?.en || fallback.heroButtonText,
          zh: fallback.localizedHeroButtonText?.zh || fallback.localizedHeroButtonText?.en || fallback.heroButtonText,
        },
        ctaText: fallback.heroButtonText,
        desktopImageUrl: fallback.heroImageUrl || "",
        id: "fallback",
        imageClickUrl: fallback.heroButtonLink,
        isActive: true,
        localizedCtaText: {
          en: fallback.localizedHeroButtonText?.en || fallback.heroButtonText,
          ms: fallback.localizedHeroButtonText?.ms || fallback.localizedHeroButtonText?.en || fallback.heroButtonText,
          zh: fallback.localizedHeroButtonText?.zh || fallback.localizedHeroButtonText?.en || fallback.heroButtonText,
        },
        localizedSubtitle: { en: "", ms: "", zh: "" },
        localizedTitle: { en: "", ms: "", zh: "" },
        localizedDesktopImageUrls: {
          en: fallback.heroImageUrl || "",
          ms: fallback.heroImageUrl || "",
          zh: fallback.heroImageUrl || "",
        },
        localizedMobileImageUrls: {
          en: fallback.heroImageUrl || "",
          ms: fallback.heroImageUrl || "",
          zh: fallback.heroImageUrl || "",
        },
        mobileImageUrl: fallback.heroImageUrl || "",
        sortOrder: 1,
        subtitle: "",
        targetUrl: fallback.heroButtonLink,
        title: "",
      }];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];
  const imageHref = activeSlide.imageClickUrl || activeSlide.targetUrl || "/products";
  const buttonHref = activeSlide.buttonUrl || imageHref;
  const titleText = localizedBannerText(activeSlide.localizedTitle, language, activeSlide.title);
  const subtitleText = localizedBannerText(activeSlide.localizedSubtitle, language, activeSlide.subtitle);
  const buttonText = localizedBannerText(
    activeSlide.localizedCtaText,
    language,
    activeSlide.buttonText?.[language === "ms" ? "bm" : language] || activeSlide.ctaText
  );
  const desktopImageUrl =
    activeSlide.localizedDesktopImageUrls?.[language] ||
    activeSlide.localizedDesktopImageUrls?.en ||
    activeSlide.desktopImageUrl ||
    "";
  const mobileImageUrl =
    activeSlide.localizedMobileImageUrls?.[language] ||
    activeSlide.localizedMobileImageUrls?.en ||
    activeSlide.mobileImageUrl ||
    "";
  const hasImage = Boolean(desktopImageUrl || mobileImageUrl);
  const showTextOverlay = Boolean(titleText || subtitleText);
  const showButton = activeSlide.buttonEnabled && Boolean(buttonText && buttonHref);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="urbanix-container pt-4 sm:pt-7 lg:pt-9">
      <div
        className="relative overflow-hidden rounded-[2rem] bg-card shadow-[0_24px_70px_rgba(12,36,68,0.16)] ring-1 ring-white/70 dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)] dark:ring-[rgba(59,158,255,0.14)]"
        data-banner-carousel
      >
        <Link
          aria-label={`Open promotion banner ${activeIndex + 1}`}
          className="block"
          data-banner-image-link
          href={imageHref}
        >
          <div
            className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/7] lg:aspect-[21/8]"
            key={activeSlide.id}
          >
            {hasImage ? (
              <>
                <img
                  alt=""
                  className="hidden size-full object-cover transition duration-700 md:block"
                  data-banner-desktop-image
                  src={desktopImageUrl || mobileImageUrl}
                />
                <img
                  alt=""
                  className="size-full object-cover transition duration-700 md:hidden"
                  data-banner-mobile-image
                  src={mobileImageUrl || desktopImageUrl}
                />
              </>
            ) : (
              <div className="relative flex size-full items-center justify-center overflow-hidden p-6 text-center">
                <div className="absolute inset-0 bg-linear-to-br from-[#0a2d6e] via-[#1255c9] to-[#0e6fd4] dark:from-[#030917] dark:via-[#0a1e45] dark:to-[#0d2860]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,rgba(59,158,255,0.28),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,rgba(59,158,255,0.2),transparent)]" />
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                <span className="relative max-w-md text-2xl font-extrabold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] sm:text-4xl">
                  {freeShippingText ? <LocalizedValue fallback={freeShippingText.en} value={freeShippingText} /> : fallback.heroTitle}
                </span>
              </div>
            )}
          </div>
        </Link>

        {showTextOverlay ? (
          <div className="pointer-events-none absolute left-4 top-4 z-20 max-w-[78%] rounded-3xl bg-black/28 p-4 text-white shadow-[0_18px_48px_rgba(0,0,0,0.22)] backdrop-blur-md sm:left-6 sm:top-6 sm:max-w-[48%] sm:p-5">
            {titleText ? (
              <h2 className="text-balance text-xl font-extrabold leading-tight drop-shadow sm:text-3xl lg:text-4xl">
                {titleText}
              </h2>
            ) : null}
            {subtitleText ? (
              <p className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-white/88 sm:text-base">
                {subtitleText}
              </p>
            ) : null}
          </div>
        ) : null}

        {showButton ? (
          <Link
            className={buttonVariants({
              className:
                cn(
                  "absolute z-20 rounded-full bg-linear-to-r from-primary via-[#14c8ff] to-[#7c3cff] px-6 text-white shadow-[0_12px_32px_rgba(26,86,219,0.38)] hover:scale-[1.02]",
                  buttonPositionClasses[(activeSlide.buttonPosition ?? "bottom-left") as NonNullable<PromotionBanner["buttonPosition"]>]
                ),
              size: "lg",
            })}
            data-banner-button
            href={buttonHref}
          >
            {buttonText}
          </Link>
        ) : null}

        {slides.length > 1 ? (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/20 p-1 backdrop-blur-md sm:bottom-6 sm:right-6">
            <CarouselButton label="Previous banner" onClick={() => setActiveIndex((index) => (index - 1 + slides.length) % slides.length)}>
              <ChevronLeft className="size-4" />
            </CarouselButton>
            <div className="flex gap-1.5 items-center">
              {slides.map((slide, index) => (
                <button
                  aria-label={`Show banner ${index + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    activeIndex === index
                      ? "w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      : "w-1.5 bg-white/45 hover:bg-white/65"
                  )}
                  key={slide.id || index}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                />
              ))}
            </div>
            <CarouselButton label="Next banner" onClick={() => setActiveIndex((index) => (index + 1) % slides.length)}>
              <ChevronRight className="size-4" />
            </CarouselButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CarouselButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="relative z-30 flex size-7 items-center justify-center rounded-full bg-white/18 text-white backdrop-blur transition hover:bg-white/32"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
