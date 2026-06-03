"use client";

import { useCurrency } from "@/components/currency/CurrencyProvider";
import type { ListingPriceSummary } from "@/lib/stay-price";

type Props = {
  loading: boolean;
  summary: ListingPriceSummary | null | undefined;
  className?: string;
};

function canShowPrice(summary: ListingPriceSummary | null | undefined): summary is ListingPriceSummary {
  if (!summary) return false;
  return (
    summary.allAvailable &&
    !summary.priceUnavailableReason &&
    summary.nights > 0 &&
    summary.totalPrice > 0
  );
}

export default function RecommendResultPrice({ loading, summary, className }: Props) {
  const { formatForGuest } = useCurrency();

  if (loading) {
    return (
      <div className={className} aria-live="polite" aria-busy="true">
        <p className="text-minbak-body text-minbak-gray">요금 계산 중…</p>
        <div className="mt-2 space-y-1.5" aria-hidden>
          <div className="h-4 w-3/4 max-w-[200px] rounded bg-minbak-light-gray animate-pulse" />
          <div className="h-3 w-2/3 max-w-[160px] rounded bg-minbak-light-gray/80 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!canShowPrice(summary)) {
    return (
      <div className={className}>
        <p className="text-minbak-body font-medium text-minbak-dark-gray">
          선택 일정 요금 확인이 필요해요
        </p>
        <p className="text-minbak-caption text-minbak-gray mt-0.5">
          날짜·인원은 상세에 반영됩니다
        </p>
      </div>
    );
  }

  const { nights, totalPrice, pricePerNight, guestCount } = summary;

  return (
    <div className={className}>
      <p className="text-minbak-body text-minbak-black leading-snug">
        <span className="text-minbak-caption text-minbak-dark-gray font-medium">
          {nights}박 총액{" "}
        </span>
        <span className="text-lg font-bold text-minbak-black">
          {formatForGuest(totalPrice)}
        </span>
      </p>
      <p className="text-minbak-caption text-minbak-gray mt-0.5">
        1박 평균 {formatForGuest(pricePerNight)} · 게스트 {guestCount}명 기준
      </p>
      <p className="text-minbak-caption text-minbak-gray/90 mt-1">상세에서 최종 확인</p>
    </div>
  );
}
