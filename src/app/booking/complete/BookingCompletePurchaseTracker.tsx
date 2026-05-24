"use client";

import MetaPixelPurchase from "@/components/analytics/MetaPixelPurchase";

/** 예약 성공(결제 완료) 페이지에서 브라우저 Purchase Pixel 전송 */
export default function BookingCompletePurchaseTracker({
  bookingId,
  isPaid,
}: {
  bookingId: string;
  isPaid: boolean;
}) {
  if (!isPaid || !bookingId) return null;
  return <MetaPixelPurchase bookingId={bookingId} />;
}
