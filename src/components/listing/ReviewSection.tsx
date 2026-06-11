"use client";

import { useState, useEffect, useRef } from "react";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import ReviewSummaryAI from "./ReviewSummaryAI";
import { trackEvent } from "@/lib/booking-analytics";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

type ReviewItem = {
  rating: number;
  body: string | null;
  userName: string | null;
  createdAt: string;
  membershipYears?: number | null;
  images?: string[];
  reviewSource?: string | null;
};

type SortMode = "newest" | "highest" | "lowest";

type Props = {
  listingId: string;
  reviews: ReviewItem[];
  rating: number | null;
  reviewCount: number;
  canReview: boolean;
  hasReviewed: boolean;
  isLoggedIn: boolean;
};

const SORT_OPTIONS = [
  { key: "newest" as const, labelKey: "review.sortNewest" as const },
  { key: "highest" as const, labelKey: "review.sortHighest" as const },
  { key: "lowest" as const, labelKey: "review.sortLowest" as const },
];

function StarBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="w-4 text-right text-[#222] font-medium">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[#ebebeb] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#222] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-[#717171]">{count}</span>
    </div>
  );
}

const REVIEWS_PER_PAGE = 6;

export default function ReviewSection({
  listingId,
  reviews,
  rating,
  reviewCount,
  canReview,
  hasReviewed,
  isLoggedIn,
}: Props) {
  const { t } = useHostTranslations();
  const [sort, setSort] = useState<SortMode>("newest");
  const [showAll, setShowAll] = useState(false);
  const tracked = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tracked.current || !sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          trackEvent("review_section_viewed", {
            listing_id: listingId,
            rating_average: rating ?? undefined,
            review_count: reviewCount,
          });
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [listingId, rating, reviewCount]);

  const sorted = [...reviews].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating;
    if (sort === "lowest") return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const displayed = showAll ? sorted : sorted.slice(0, REVIEWS_PER_PAGE);
  const hasMore = sorted.length > REVIEWS_PER_PAGE;
  const remaining = sorted.length - REVIEWS_PER_PAGE;

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <div
      ref={sectionRef}
      id="review"
      className="mt-6 bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden scroll-mt-28"
    >
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[#ebebeb]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold text-[#222]">{t("review.sectionTitle")}</h2>
              {rating != null && reviewCount > 0 && (
                <span className="text-[15px] text-[#222]">
                  ★ {rating.toFixed(1)} · {t("review.count", { count: reviewCount })}
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-[#717171]">
              {t("review.fromOtherPlatforms")}
            </p>
          </div>
          {reviews.length > 1 && (
            <div className="flex gap-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSort(opt.key)}
                  className={`px-3 py-1.5 text-[13px] rounded-full border transition-colors ${
                    sort === opt.key
                      ? "bg-[#222] text-white border-[#222]"
                      : "bg-white text-[#717171] border-[#dddddd] hover:border-[#999]"
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Star distribution */}
        {reviewCount > 0 && (
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-[36px] font-bold text-[#222] leading-none">
                  {rating != null ? rating.toFixed(1) : "–"}
                </p>
                <div className="flex mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`text-[14px] ${s <= Math.round(rating ?? 0) ? "text-[#222]" : "text-[#ebebeb]"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-[12px] text-[#717171] mt-1">{t("review.reviewsCount", { count: reviewCount })}</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {dist.map((d) => (
                  <StarBar
                    key={d.star}
                    label={String(d.star)}
                    count={d.count}
                    total={reviewCount}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Summary */}
      {reviews.length > 0 && <ReviewSummaryAI listingId={listingId} />}

      {/* Review List */}
      {reviews.length > 0 ? (
        <>
          <ul className="divide-y divide-[#ebebeb]">
            {displayed.map((r, i) => (
              <li key={i} className="p-4 md:p-6">
                <ReviewCard review={r} />
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="p-4 md:p-6 border-t border-[#ebebeb] flex justify-center">
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="min-h-[44px] px-6 py-2.5 text-[15px] font-medium text-[#222] border border-[#dddddd] rounded-full hover:bg-[#f7f7f7] transition-colors"
              >
                {showAll ? t("review.showLess") : t("review.showMore", { count: remaining })}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="p-4 md:p-6 text-center py-10">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl" aria-hidden>💬</span>
          </div>
          <p className="text-[15px] text-[#717171] mb-1">{t("review.empty")}</p>
          <p className="text-[13px] text-[#b0b0b0]">
            {t("review.emptyCta")}
          </p>
        </div>
      )}

      {/* Review Form */}
      <div className="p-4 md:p-6 border-t border-[#ebebeb]">
        <ReviewForm
          listingId={listingId}
          hasReviewed={hasReviewed}
          isLoggedIn={isLoggedIn}
          canReview={canReview}
        />