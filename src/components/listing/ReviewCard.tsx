"use client";

import { useState } from "react";
import ReviewPhotoGallery from "./ReviewPhotoGallery";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

const PREVIEW_LENGTH = 150;

export type ReviewItem = {
  rating: number;
  body: string | null;
  userName: string | null;
  createdAt: string;
  membershipYears?: number | null;
  images?: string[];
  /** 리뷰 출처. null이면 표시 안 함 */
  reviewSource?: string | null;
};

const REVIEW_SOURCE_LABELS: Record<string, string> = {
  TOKYOMINBAK_REVIEW: "도쿄민박 예약 후기",
  EXTERNAL_PLATFORM_REVIEW: "외부 플랫폼 후기 기준",
  INFLUENCER_REVIEW: "체험단 후기",
  HOST_PROVIDED_REVIEW: "호스트 제공 후기",
};

type Props = { review: ReviewItem };

function formatReviewDate(date: string, locale: "ko" | "ja") {
  return new Date(date).toLocaleDateString(locale === "ja" ? "ja-JP" : "ko-KR", {
    year: "numeric",
    month: "long",
  });
}

function getInitial(name: string | null) {
  if (!name?.trim()) return "?";
  const first = name.trim()[0];
  return first.toUpperCase();
}

export default function ReviewCard({ review }: Props) {
  const { t, locale } = useHostTranslations();
  const [expanded, setExpanded] = useState(false);
  const body = review.body?.trim() ?? "";
  const showMore = body.length > PREVIEW_LENGTH;
  const displayBody =
    showMore && !expanded ? body.slice(0, PREVIEW_LENGTH) + "..." : body;
  const hasImages = review.images && review.images.length > 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f0f0f0] to-[#e0e0e0] flex items-center justify-center flex-shrink-0 text-[15px] font-semibold text-[#484848]">
          {getInitial(review.userName)}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#222] truncate">
            {review.userName ?? t("review.anonymous")}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="flex text-[#222]" aria-label={t("review.ratingAriaLabel", { value: review.rating })}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= Math.round(review.rating)
                      ? "text-[#222]"
                      : "text-[#ebebeb]"
                  }
                >
                  ★
                </span>
              ))}
            </span>
            <span className="text-[#717171]">
              {formatReviewDate(review.createdAt, locale)}
            </span>
            {review.membershipYears != null && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                ✓ {t("review.verifiedStay")}
              </span>
            )}
            {review.reviewSource && REVIEW_SOURCE_LABELS[review.reviewSource] && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[#717171] text-[11px] border border-[#ebebeb]">
                후기 출처