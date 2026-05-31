"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { customerReviews, type CustomerReview } from "@/lib/customer-reviews";
import { useLanguage } from "@/components/i18n/language-provider";

/**
 * Homepage Review Wall — hand-curated soft-launch social proof.
 *
 * Renders the static `customerReviews` list. No API call, no DB, no
 * client state beyond language. Mobile is a single-column horizontal
 * snap scroll so users can flick through; tablet stacks to 2 cols;
 * desktop expands to 3 cols.
 */
export function ReviewWall() {
  const { language, t } = useLanguage();

  if (customerReviews.length === 0) return null;

  return (
    <section
      className="urbanix-container urbanix-section pt-0"
      data-component="review-wall"
    >
      <Header />
      {/* Mobile: single-column horizontal snap scroll.
          sm+: standard 2-up grid.
          lg+: 3-up grid. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {customerReviews.map((review) => (
          <ReviewCard key={review.id} language={language} review={review} t={t} />
        ))}
      </div>
    </section>
  );
}

function Header() {
  const { t } = useLanguage();
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-2xl font-black uppercase tracking-wide text-primary dark:text-[#8bdcff] sm:text-3xl">
          {t("home.customerReviewsTitle", "Customer Reviews")}
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          {t("home.customerReviewsSubtitle", "Hand-picked feedback from Urbanix buyers.")}
        </p>
        <div className="h-0.5 w-8 rounded-full bg-primary/40 dark:bg-[rgba(59,158,255,0.4)]" />
      </div>
      <Link
        className="flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/8 dark:border-[rgba(59,158,255,0.2)] dark:text-[#3b9eff] dark:hover:bg-[rgba(59,158,255,0.08)]"
        href="/contact-us"
      >
        {t("reviews.viewMore", "Share your experience")}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function ReviewCard({
  language,
  review,
  t,
}: {
  language: "en" | "zh" | "ms";
  review: CustomerReview;
  t: (key: string, fallback?: string) => string;
}) {
  const body = review.text[language] ?? review.text.en;
  const ariaRating = t("reviews.ratingLabel", "Rated XX out of 5").replace(
    "XX",
    String(review.rating),
  );

  return (
    <figure className="urbanix-surface flex w-[88%] shrink-0 snap-start flex-col gap-3 p-5 sm:w-auto sm:shrink">
      <div className="flex items-center justify-between gap-3">
        <Stars ariaLabel={ariaRating} rating={review.rating} />
        {review.verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-success">
            <BadgeCheck className="size-3" />
            {t("reviews.verifiedBuyer", "Verified Buyer")}
          </span>
        ) : null}
      </div>
      <blockquote className="text-sm leading-6 text-foreground">
        &ldquo;{body}&rdquo;
      </blockquote>
      <figcaption className="mt-auto flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
        <span className="font-extrabold text-foreground">
          {review.name}
          <span className="font-semibold text-muted-foreground">, {review.location}</span>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {review.productLabel}
        </span>
      </figcaption>
      {review.tag ? (
        <span className="inline-flex w-fit rounded-full bg-primary/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:bg-[rgba(59,158,255,0.12)] dark:text-[#8bdcff]">
          {review.tag}
        </span>
      ) : null}
    </figure>
  );
}

function Stars({ ariaLabel, rating }: { ariaLabel: string; rating: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div aria-label={ariaLabel} className="flex items-center gap-0.5" role="img">
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= rating;
        return (
          <Star
            aria-hidden="true"
            className={
              filled
                ? "size-4 fill-warning text-warning"
                : "size-4 text-muted-foreground/40"
            }
            key={value}
          />
        );
      })}
    </div>
  );
}
