"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageContent, LocalizedTextValue, PromotionBanner } from "@ecommerce/shared";
import { ProductVisual } from "@/components/commerce/product-visual";
import { LocalizedText } from "@/components/i18n/localized-text";
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
        ctaText: fallback.heroButtonText,
        desktopImageUrl: "",
        id: "fallback",
        isActive: true,
        localizedTitle: freeShippingText,
        mobileImageUrl: "",
        sortOrder: 1,
        subtitle: fallback.heroSubtitle,
        targetUrl: fallback.heroButtonLink,
        title: freeShippingText?.en ?? fallback.heroTitle,
      }];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];

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
    <section className="urbanix-container pt-5 sm:pt-8 lg:pt-10">
      <div className="relative overflow-hidden rounded-[1.25rem] bg-primary text-white shadow-[0_24px_70px_rgba(11,107,99,0.22)]">
        <Link aria-label={activeSlide.title} className="absolute inset-0 z-10" href={activeSlide.targetUrl || "/products"} />
        {activeSlide.desktopImageUrl || activeSlide.mobileImageUrl ? (
          <>
            {activeSlide.desktopImageUrl ? (
              <img alt="" className="hidden min-h-[430px] w-full object-cover md:block md:min-h-[390px]" src={activeSlide.desktopImageUrl} />
            ) : null}
            <img
              alt=""
              className="min-h-[430px] w-full object-cover md:hidden"
              src={activeSlide.mobileImageUrl || activeSlide.desktopImageUrl}
            />
            <div className="absolute inset-0 bg-linear-to-r from-primary/90 via-primary/58 to-primary/10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-primary via-[#0d8073] to-[#103b39]" />
        )}
        <div className="relative grid min-h-[390px] gap-4 md:min-h-[380px] md:grid-cols-[1fr_0.95fr]">
          <div className="flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-12">
            <div className="w-fit rounded-full bg-white/12 px-3 py-1 text-xs font-bold tracking-wide text-white ring-1 ring-white/20">
              {freeShippingText ? <LocalizedValue fallback={freeShippingText.en} value={freeShippingText} /> : "Urbanix Deal"}
            </div>
            <h1 className="max-w-xl text-3xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              <LocalizedValue fallback={activeSlide.title} value={activeSlide.localizedTitle} />
            </h1>
            <p className="max-w-sm text-base font-medium leading-7 text-white/86 sm:text-lg">
              <LocalizedValue fallback={activeSlide.subtitle} value={activeSlide.localizedSubtitle} />
            </p>
            <span
              className={buttonVariants({
                className: "w-fit bg-accent text-white hover:bg-accent/90",
                size: "lg",
              })}
            >
              {activeSlide.localizedCtaText ? (
                <LocalizedValue fallback={activeSlide.ctaText} value={activeSlide.localizedCtaText} />
              ) : (
                <LocalizedText fallback={activeSlide.ctaText} k={activeSlide.ctaText === "Shop Now" ? "common.shopNow" : `hero.${activeSlide.ctaText}`} />
              )}
            </span>
          </div>
          {!activeSlide.desktopImageUrl && !activeSlide.mobileImageUrl ? (
            <div className="relative flex items-end justify-center px-8 pb-8 md:items-center md:p-10">
              <ProductVisual
                className="w-full max-w-[280px] border border-white/15 bg-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:max-w-[330px]"
                tone={(fallback.heroImage || "fan-green") as never}
              />
            </div>
          ) : null}
        </div>
        {slides.length > 1 ? (
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
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
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="relative z-30 flex size-9 items-center justify-center rounded-full bg-white/18 text-white backdrop-blur transition hover:bg-white/28"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
