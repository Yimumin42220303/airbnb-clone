"use client";

import MetaPixelPurchase from "@/components/analytics/MetaPixelPurchase";
import Ga4Purchase from "@/components/analytics/Ga4Purchase";

/** 예약 성공(결제 완료) — Meta Purchase + GA4 purchase */
export default function BookingCompletePurchaseTracker({
  bookingId,
  isPaid,
}: {
  bookingId: string;
  isPaid: boolean;
}) {
  if (!isPaid || !bookingId) return null;
  return (
    <>
      <Ga4Purchase bookingId={bookingId} />
      <MetaPixelPurchase bookingId={bookingId} />
    </>
  );
}
