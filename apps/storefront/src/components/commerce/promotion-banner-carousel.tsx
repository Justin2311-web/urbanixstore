"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageContent, LocalizedTextValue, PromotionBanner } from "@ecommerce/shared";
import { LocalizedValue } from "@/components/i18n/localized-value";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PromotionBannerCarousel({
  banners,
  fallback,
  freeShippingText,
}: {
  banners: PromotionBanner[];
  fallback: HomepageContent;
  freeShippingText?: LocalizedTextValue;
}) {
  const slides = banners.length > 0
    ? banners
    : [{
        buttonEnabled: true,
        buttonUrl: fallback.heroButtonLink,
        ctaText: fallback.heroButtonText,
        desktopImageUrl: fallback.heroImageUrl || "",
        id: "fallback",
        imageClickUrl: fallback.heroButtonLink,
        isActive: true,
        localizedCtaText: {
          en: fallback.heroButtonText,
          ms: fallback.heroButtonText,
          zh: fallback.heroButtonText,
        },
        localizedSubtitle: {
          en: "",
          ms: "",
          zh: "",
        },
        localizedTitle: {
          en: "",
          ms: "",
          zh: "",
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
  const buttonText = activeSlide.localizedCtaText ? (
    <LocalizedValue fallback={activeSlide.ctaText} value={activeSlide.localizedCtaText} />
  ) : activeSlide.ctaText;
  const hasImage = Boolean(activeSlide.desktopImageUrl || activeSlide.mobileImageUrl);
  const showButton = activeSlide.buttonEnabled && Boolean(activeSlide.ctaText && buttonHref);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="urbanix-container pt-8 sm:pt-10 lg:pt-12">
      <div
        className="relative overflow-hidden rounded-[2.5rem] bg-card shadow-[0_40px_100px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.3)]"
        data-banner-carousel
      >
        <Link
          aria-label={`Open promotion banner ${activeIndex + 1}`}
          className="block"
          data-banner-image-link
          href={imageHref}
        >
          <div
            className="relative aspect-[4/3] w-full overflow-hidden bg-linear-to-br from-background via-card to-secondary sm:aspect-[16/7] lg:aspect-[21/8]"
            key={activeSlide.id}
          >
            {hasImage ? (
              <>
                <img
                  alt=""
                  className="hidden size-full object-cover transition duration-700 md:block dark:opacity-80"
                  data-banner-desktop-image
                  src={activeSlide.desktopImageUrl || activeSlide.mobileImageUrl}
                />
                <img
                  alt=""
                  className="size-full object-cover transition duration-700 md:hidden dark:opacity-80"
                  data-banner-mobile-image
                  src={activeSlide.mobileImageUrl || activeSlide.desktopImageUrl}
                />
              </>
            ) : (
              <div className="flex size-full items-center justify-center p-6 text-center">
                <span className="max-w-xl text-3xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  {freeShippingText ? <LocalizedValue fallback={freeShippingText.en} value={freeShippingText} /> : fallback.heroTitle}
                </span>
              </div>
            )}
          </div>
        </Link>
        {showButton ? (
          <Link
            className={buttonVariants({
              className:
                "absolute bottom-6 left-6 z-20 h-14 rounded-full bg-primary px-10 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-xl hover:bg-primary/90 sm:bottom-10 sm:left-10",
              size: "lg",
            })}
            data-banner-button
            href={buttonHref}
          >
            {buttonText}
          </Link>
        ) : null}
        {slides.length > 1 ? (
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 rounded-full bg-background/40 p-1.5 backdrop-blur-md sm:bottom-10 sm:right-10">
            <CarouselButton label="Previous banner" onClick={() => setActiveIndex((index) => (index - 1 + slides.length) % slides.length)}>
              <ChevronLeft className="size-5" />
            </CarouselButton>
            <div className="flex gap-1.5">
              {slides.map((slide, index) => (
                <button
                  aria-label={`Show banner ${index + 1}`}
                  className={cn("h-1.5 rounded-full bg-primary/20 transition-all", activeIndex === index ? "w-8 bg-primary" : "w-1.5")}
                  key={slide.id || index}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                />
              ))}
            </div>
            <CarouselButton label="Next banner" onClick={() => setActiveIndex((index) => (index + 1) % slides.length)}>
              <ChevronRight className="size-5" />
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
      className="relative z-30 flex size-10 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur transition hover:bg-background"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}


