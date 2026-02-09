"use client";

import { useState } from "react";

const PREVIEW_LENGTH = 150;

type ReviewItem = {
  rating: number;
  body: string | null;
  userName: string | null;
  createdAt: string;
  membershipYears?: number | null;
};

type Props = { review: ReviewItem };

function formatReviewDate(date: string) {
  return new Date(date).toLocaleDateString("ko-KR", {
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
  const [expanded, setExpanded] = useState(false);
  const body = review.body?.trim() ?? "";
  const showMore = body.length > PREVIEW_LENGTH;
  const displayBody =
    showMore && !expanded ? body.slice(0, PREVIEW_LENGTH) + "..." : body;

  return (
    <div className="space-y-2">
      <p className="text-[15px] font-semibold text-[#222]">
        {review.userName ?? "익명"}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-[14px]">
        <span className="flex text-[#222]" aria-label={`평점 ${review.rating}점`}>
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
          {formatReviewDate(review.createdAt)}
        </span>
      </div>
      {body && (
        <div className="text-[15px] text-[#222] leading-relaxed">
          <span className="whitespace-pre-wrap">{displayBody}</span>
          {showMore && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="ml-1 underline text-[#222] hover:no-underline"
            >
              더 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
