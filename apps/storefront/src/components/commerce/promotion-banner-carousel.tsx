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
    <section className="urbanix-container pt-4 sm:pt-7 lg:pt-9">
      <div
        className="relative overflow-hidden rounded-[1.25rem] bg-white shadow-[0_18px_55px_rgba(12,36,68,0.16)] ring-1 ring-primary/10"
        data-banner-carousel
      >
        <Link
          aria-label={`Open promotion banner ${activeIndex + 1}`}
          className="block"
          data-banner-image-link
          href={imageHref}
        >
          <div
            className="relative aspect-[4/3] w-full overflow-hidden bg-linear-to-br from-[#f4f8ff] via-white to-[#e7f6ff] sm:aspect-[16/7] lg:aspect-[21/8]"
            key={activeSlide.id}
          >
            {hasImage ? (
              <>
                <img
                  alt=""
                  className="hidden size-full object-cover transition duration-500 md:block"
                  data-banner-desktop-image
                  src={activeSlide.desktopImageUrl || activeSlide.mobileImageUrl}
                />
                <img
                  alt=""
                  className="size-full object-cover transition duration-500 md:hidden"
                  data-banner-mobile-image
                  src={activeSlide.mobileImageUrl || activeSlide.desktopImageUrl}
                />
              </>
            ) : (
              <div className="flex size-full items-center justify-center bg-linear-to-br from-[#0b4faf] via-[#1687f2] to-[#42c5ff] p-6 text-center">
                <span className="max-w-md text-2xl font-extrabold leading-tight text-white sm:text-4xl">
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
                "absolute bottom-4 left-4 z-20 rounded-full bg-[#0d63ce] px-5 text-white shadow-[0_12px_28px_rgba(13,99,206,0.3)] hover:bg-[#084fa8] sm:bottom-6 sm:left-6",
              size: "lg",
            })}
            data-banner-button
            href={buttonHref}
          >
            {buttonText}
          </Link>
        ) : null}
        {slides.length > 1 ? (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/18 p-1 backdrop-blur-md sm:bottom-6 sm:right-6">
            <CarouselButton label="Previous banner" onClick={() => setActiveIndex((index) => (index - 1 + slides.length) % slides.length)}>
              <ChevronLeft className="size-4" />
            </CarouselButton>
            <div className="flex gap-1">
              {slides.map((slide, index) => (
                <button
                  aria-label={`Show banner ${index + 1}`}
                  className={cn("h-2 rounded-full bg-white/55 transition-all", activeIndex === index ? "w-6 bg-white" : "w-2")}
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
      className="relative z-30 flex size-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/34"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
