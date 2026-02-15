"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  listingTitle: string;
  paymentStatus?: string;
  checkIn?: string;
  totalPrice?: number;
};

/**
 * 환불 비율 계산 (취소 정책과 동일)
 */
function getRefundInfo(checkIn: string, totalPrice: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkInDate = new Date(checkIn);
  checkInDate.setHours(0, 0, 0, 0);
  const daysUntil = Math.floor(
    (checkInDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (daysUntil >= 30) {
    return { rate: 100, amount: totalPrice, policy: "체크인 30일 전 이상: 100% 환불" };
  } else if (daysUntil >= 8) {
    return { rate: 50, amount: Math.floor(totalPrice * 0.5), policy: "체크인 29~8일 전: 50% 환불" };
  } else if (daysUntil >= 1) {
    return { rate: 30, amount: Math.floor(totalPrice * 0.3), policy: "체크인 7일 전: 30% 환불" };
  } else {
    return { rate: 0, amount: 0, policy: "체크인 당일: 환불 불가" };
  }
}

export default function CancelBookingButton({
  bookingId,
  listingTitle,
  paymentStatus,
  checkIn,
  totalPrice,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    // 결제 완료된 예약인 경우 환불 정보 표시
    const isPaid = paymentStatus === "paid";
    let confirmMsg = `"${listingTitle}" 예약을 취소할까요?`;

    if (isPaid && checkIn && totalPrice) {
      const refund = getRefundInfo(checkIn, totalPrice);
      confirmMsg =
        `"${listingTitle}" 예약을 취소할까요?\n\n` +
        `취소 정책: ${refund.policy}\n` +
        `환불 금액: ₩${refund.amount.toLocaleString()} (${refund.rate}%)`;
      if (refund.rate === 0) {
        confirmMsg += "\n\n⚠️ 환불이 불가능합니다.";
      }
    }

    if (!confirm(confirmMsg)) return;
    setLoading(true);
    try {
      // 결제된 예약은 refund API 사용, 미결제 예약은 기존 cancel API 사용
      const url = isPaid
        ? `/api/bookings/${bookingId}/refund`
        : `/api/bookings/${bookingId}`;
      const options = isPaid
        ? { method: "POST" as const }
        : {
            method: "PATCH" as const,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "cancelled" }),
          };

      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "취소에 실패했습니다.");
        return;
      }

      // 환불 결과 안내
      if (isPaid && data.refundAmount !== undefined) {
        if (data.refundAmount > 0) {
          alert(
            `예약이 취소되었습니다.\n\n` +
            `환불 금액: ₩${data.refundAmount.toLocaleString()}\n` +
            `${data.portoneRefund ? "카드 환불이 진행됩니다." : "환불이 처리됩니다."}`
          );
        } else {
          alert("예약이 취소되었습니다. (환불 불가 기간)");
        }
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={loading}
      className="inline-block mt-2 text-airbnb-body text-airbnb-gray hover:text-airbnb-red hover:underline disabled:opacity-50"
    >
      {loading ? "취소 중..." : "예약 취소"}
    </button>
  );
}
