"use client";

import { useEffect, useRef } from "react";
import { trackGa4Purchase, sendGa4Event } from "@/lib/ga4-events";
import { readMetaPurchasePending } from "@/lib/meta-purchase";

type Props = {
  bookingId?: string;
};

/**
 * 결제 성공 직후(sessionStorage pending) purchase 전송.
 * Meta Pixel과 동일 pending 사용, transaction_id = bookingId.
 */
export default function Ga4Purchase({ bookingId }: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;

    const pending = readMetaPurchasePending();
    if (!pending) return;
    if (bookingId && pending.bookingId !== bookingId) return;

    trackGa4Purchase({
      bookingId: pending.bookingId,
      listingId: pending.listingId,
      value: pending.value,
    });
    // booking_complete: GA4 목표/탐색 설정용 커스텀 이벤트
    sendGa4Event("booking_complete", {
      transaction_id: pending.bookingId,
      currency: "JPY",
      value: pending.value,
      ...(pending.listingId ? { listing_id: pending.listingId } : {}),
    });
    firedRef.current = true;
  }, [bookingId]);

  return null;
}
