"use client";

import { useEffect, useRef } from "react";
import { trackMetaPurchase } from "@/lib/meta-pixel";
import {
  clearMetaPurchasePending,
  readMetaPurchasePending,
} from "@/lib/meta-purchase";

type Props = {
  /** 현재 페이지의 예약 ID. sessionStorage pending과 일치할 때만 전송 */
  bookingId?: string;
};

/**
 * 결제 성공 직후(sessionStorage pending) 브라우저 Purchase Pixel 전송.
 * CAPI와 동일한 event_id로 Meta 중복 집계 방지.
 */
export default function MetaPixelPurchase({ bookingId }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;

    const pending = readMetaPurchasePending();
    if (!pending) return;
    if (bookingId && pending.bookingId !== bookingId) return;

    trackMetaPurchase({
      value: pending.value,
      currency: pending.currency,
      eventId: pending.eventId,
    });
    clearMetaPurchasePending();
    firedRef.current = true;
  }, [bookingId]);

  return null;
}
