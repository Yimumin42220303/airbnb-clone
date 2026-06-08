"use client";

import { useEffect, useRef } from "react";
import { trackGa4AddPaymentInfo } from "@/lib/ga4-events";

type Props = {
  listingId: string;
  totalPriceJpy: number;
  bookingId?: string;
};

/** 결제 페이지 add_payment_info 1회 */
export default function Ga4AddPaymentInfo({
  listingId,
  totalPriceJpy,
  bookingId,
}: Props) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !listingId || totalPriceJpy < 0) return;
    firedRef.current = true;
    trackGa4AddPaymentInfo({
      listingId,
      value: totalPriceJpy,
      bookingId,
    });
  }, [listingId, totalPriceJpy, bookingId]);

  return null;
}
