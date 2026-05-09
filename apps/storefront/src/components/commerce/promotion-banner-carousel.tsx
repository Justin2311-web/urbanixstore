"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageContent, PromotionBanner } from "@ecommerce/shared";
import { ProductVisual } from "@/components/commerce/product-visual";
import { LocalizedText } from "@/components/i18n/localized-text";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PromotionBannerCarousel({
  banners,
  fallback,
}: {
  banners: PromotionBanner[];
  fallback: HomepageContent;
}) {
  const slides = banners.length > 0
    ? banners
    : [{
        ctaText: fallback.heroButtonText,
        desktopImageUrl: "",
        id: "fallback",
        isActive: true,
        mobileImageUrl: "",
        sortOrder: 1,
        subtitle: fallback.heroSubtitle,
        targetUrl: fallback.heroButtonLink,
        title: fallback.heroTitle,
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
      <div className="relative overflow-hidden rounded-3xl bg-primary text-white shadow-[0_24px_70px_rgba(14,92,86,0.24)]">
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
            <div className="absolute inset-0 bg-linear-to-r from-primary/88 via-primary/48 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(23,165,137,0.75),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(255,107,74,0.25),transparent_25%)]" />
        )}
        <div className="relative grid min-h-[430px] gap-4 md:min-h-[390px] md:grid-cols-[1fr_0.95fr]">
          <div className="flex flex-col justify-center gap-5 p-6 sm:p-10 lg:p-14">
            <h1 className="max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              <LocalizedText fallback={activeSlide.title} k={`hero.${activeSlide.title}`} />
            </h1>
            <p className="max-w-sm text-base font-medium leading-7 text-white/86 sm:text-lg">
              <LocalizedText fallback={activeSlide.subtitle} k={`hero.${activeSlide.subtitle}`} />
            </p>
            <span
              className={buttonVariants({
                className: "w-fit bg-accent text-white hover:bg-accent/90",
                size: "lg",
              })}
            >
              <LocalizedText fallback={activeSlide.ctaText} k={activeSlide.ctaText === "Shop Now" ? "common.shopNow" : `hero.${activeSlide.ctaText}`} />
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
