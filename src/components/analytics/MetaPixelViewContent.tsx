"use client";

import { useEffect, useRef } from "react";
import { trackMetaViewContent } from "@/lib/meta-pixel";

type Props = {
  listingId: string;
  contentName: string;
  /** 지역 (location) */
  contentCategory: string;
  /** 1박 기준 가격 (JPY) */
  pricePerNight: number;
  /** 예약 폼에서 계산된 총액 (JPY). 체크인·체크아웃 선택 시 동적 반영 */
  totalPrice?: number | null;
  /** URL에 체크인·체크아웃이 있으면 총액 계산 후 전송 */
  waitForTotalPrice?: boolean;
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
}: Props) {
  const trackedListingId = useRef<string | null>(null);

  useEffect(() => {
    if (waitForTotalPrice && totalPrice == null) return;
    if (trackedListingId.current === listingId) return;

    trackedListingId.current = listingId;
    trackMetaViewContent({
      content_ids: [listingId],
      content_name: contentName,
      content_category: contentCategory,
      value: totalPrice ?? pricePerNight,
    });
  }, [
    listingId,
    contentName,
    contentCategory,
    pricePerNight,
    totalPrice,
    waitForTotalPrice,
  ]);

  return null;
}
