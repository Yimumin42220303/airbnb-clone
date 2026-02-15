"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Star } from "lucide-react";

type ReviewFormProps = {
  listingId: string;
  hasReviewed: boolean;
  isLoggedIn: boolean;
  canReview: boolean;
};

export default function ReviewForm({
  listingId,
  hasReviewed,
  isLoggedIn,
  canReview,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="mt-8 p-6 border border-airbnb-light-gray rounded-airbnb bg-airbnb-bg">
        <p className="text-airbnb-body text-airbnb-gray">
          로그인 후 리뷰를 남길 수 있습니다.
        </p>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(`/listing/${listingId}`)}`}
          className="inline-block mt-3 text-airbnb-body font-medium text-airbnb-red hover:underline"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className="mt-8 p-6 border border-airbnb-light-gray rounded-airbnb bg-airbnb-bg">
        <p className="text-airbnb-body text-airbnb-gray">
          이미 이 숙소에 리뷰를 작성하셨습니다.
        </p>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="mt-8 p-6 border border-airbnb-light-gray rounded-airbnb bg-airbnb-bg">
        <p className="text-airbnb-body text-airbnb-gray">
          이 숙소의 숙박을 완료한 게스트만 리뷰를 작성할 수 있습니다.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (rating < 1 || rating > 5) {
      setError("평점을 1~5 사이로 선택해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body: body.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "리뷰 저장에 실패했습니다.");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-8 p-6 border border-green-200 rounded-airbnb bg-green-50">
        <p className="text-airbnb-body font-medium text-green-800">
          &#10003; 리뷰가 등록되었습니다. 감사합니다!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <h3 className="text-airbnb-title font-semibold text-airbnb-black mb-3">
        리뷰 작성
      </h3>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-airbnb-red focus-visible:rounded"
            aria-label={`${value}점`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                value <= (hoverRating || rating)
                  ? "text-airbnb-red"
                  : "text-airbnb-light-gray"
              }`}
              fill={
                value <= (hoverRating || rating)
                  ? "currentColor"
                  : "none"
              }
              stroke="currentColor"
              strokeWidth={1}
            />
          </button>
        ))}
        <span className="ml-2 text-airbnb-body text-airbnb-gray">
          {rating > 0 ? `${rating}점` : "평점 선택"}
        </span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="숙소 이용 경험을 자유롭게 남겨 주세요. (선택)"
        rows={4}
        className="w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body text-airbnb-black placeholder:text-airbnb-gray focus:outline-none focus:ring-2 focus:ring-airbnb-gray resize-y"
      />
      {error && (
        <p className="mt-2 text-airbnb-body text-airbnb-red" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="secondary"
        className="mt-3"
        disabled={loading || rating < 1}
      >
        {loading ? "저장 중..." : "리뷰 등록"}
      </Button>
    </form>
  );
}
