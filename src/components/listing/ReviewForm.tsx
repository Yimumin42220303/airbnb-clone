"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Star } from "lucide-react";
import ReviewPhotoUploader from "./ReviewPhotoUploader";
import { trackEvent } from "@/lib/booking-analytics";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

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
  const { t } = useHostTranslations();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const handlePhotosChange = useCallback((urls: string[]) => setPhotos(urls), []);

  if (!isLoggedIn) {
    return (
      <div className="mt-8 p-6 border border-minbak-light-gray rounded-minbak bg-minbak-bg">
        <p className="text-minbak-body text-minbak-gray">
          {t("review.loginToReview")}
        </p>
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(`/listing/${listingId}`)}`}
          className="inline-block mt-3 text-minbak-body font-medium text-minbak-primary hover:underline"
        >
          {t("review.login")}
        </Link>
      </div>
    );
  }

  if (hasReviewed) {
    return (
      <div className="mt-8 p-6 border border-minbak-light-gray rounded-minbak bg-minbak-bg">
        <p className="text-minbak-body text-minbak-gray">
          {t("review.alreadyReviewed")}
        </p>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="mt-8 p-6 border border-minbak-light-gray rounded-minbak bg-minbak-bg">
        <p className="text-minbak-body text-minbak-gray">
          {t("review.onlyAfterStay")}
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (rating < 1 || rating > 5) {
      setError(t("review.ratingRange"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          body: body.trim() || undefined,
          imageUrls: photos.length > 0 ? photos : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("review.saveFailed"));
        return;
      }
      setSuccess(true);
      trackEvent("review_written", { listing_id: listingId });
      router.refresh();
    } catch {
      setError(t("review.networkError"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mt-8 p-6 border border-green-200 rounded-minbak bg-green-50">
        <p className="text-minbak-body font-medium text-green-800">
          &#10003; {t("review.thankYou")}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <h3 className="text-minbak-title font-semibold text-minbak-black mb-3">
        {t("review.writeReview")}
      </h3>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:rounded"
            aria-label={t("review.ratingAriaLabel", { value })}
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
        <span className="ml-2 text-minbak-body text-minbak-gray">
          {rating > 0 ? t("review.ratingPoints", { value: rating }) : t("review.ratingSelect")}
        </span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t("review.placeholder")}
        rows={4}
        className="w-full px-3 py-2 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-gray resize-y"
      />
      <div className="mt-3">
        <p className="text-[13px] text-[#717171] mb-2">{t("review.photoAttach")}</p>
        <ReviewPhotoUploader photos={photos} onChange={handlePhotosChange} />
      </div>
      {error && (
        <p className="mt-2 text-minbak-body text-minbak-primary" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="secondary"
        className="mt-3"
        disabled={loading || rating < 1}
      >
        {loading ? t("review.saving") : t("review.submit")}
      </Button>
    </form>
  );
}
