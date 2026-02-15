"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { Star } from "lucide-react";

type Props = { listingId: string };

export default function AdminReviewForm({ listingId }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-[17px] font-semibold text-[#222] mb-1">
        리뷰 등록 (관리자)
      </h3>
      <p className="text-[13px] text-[#717171] mb-3">
        관리자만 이 숙소에 리뷰를 등록할 수 있습니다.
      </p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 focus:outline-none"
            aria-label={`${value}점`}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                value <= (hoverRating || rating)
                  ? "text-minbak-primary"
                  : "text-minbak-light-gray"
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
        <span className="ml-2 text-[14px] text-[#717171]">
          {rating > 0 ? `${rating}점` : "평점 선택"}
        </span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="리뷰 내용 (선택)"
        rows={4}
        className="w-full px-3 py-2 border border-[#ebebeb] rounded-xl text-[15px] text-[#222] placeholder:text-[#717171] focus:outline-none focus:ring-2 focus:ring-[#222] resize-y"
      />
      {error && (
        <p className="mt-2 text-[14px] text-red-600" role="alert">
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
