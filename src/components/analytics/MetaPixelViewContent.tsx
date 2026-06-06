"use client";

import { useEffect, useRef } from "react";
import { trackMetaViewContent } from "@/lib/meta-pixel";

type Props = {
  listingId: string;
  contentName: string;
  /** 지역 (location) */
  contentCategory: string;
  /** 1박 기준 가격 (JPY). null이면 0으로 폴백 */
  pricePerNight: number | null | undefined;
  /** 예약 폼에서 계산된 총액 (JPY). 체크인·체크아웃 선택 시 동적 반영 */
  totalPrice?: number | null;
  /** URL에 체크인·체크아웃이 있으면 총액 계산 후 전송 */
  waitForTotalPrice?: boolean;
  /** CAPI와 동일한 eventId — Meta 중복 제거용 */
  eventId?: string;
};

/**
 * 숙소 상세 페이지 ViewContent 이벤트.
 * listingId 기준 1회 전송 (SPA에서 다른 숙소로 이동 시 재전송).
 */
export default function MetaPixelViewContent({
  listingId,
  contentName,
  contentCategory,
  pricePerNight,
  totalPrice,
  waitForTotalPrice = false,
  eventId,
}: Props) {
  const trackedListingId = useRef<string | null>(null);

  useEffect(() => {
    if (waitForTotalPrice && totalPrice == null) return;
    if (trackedListingId.current === listingId) return;

    trackedListingId.current = listingId;
    trackMetaViewContent({
      content_ids: [listingId],
      content_name: contentName || listingId,
      content_category: contentCategory || "Tokyo",
      // pricePerNight이 null/undefined인 경우 0으로 폴백 (fbq는 0 허용)
      value: Math.max(0, totalPrice ?? pricePerNight ?? 0),
      eventId,
    });
  }, [
    listingId,
    contentName,
    contentCategory,
    pricePerNight,
    totalPrice,
    waitForTotalPrice,
    eventId,
  ]);

  return null;
}
