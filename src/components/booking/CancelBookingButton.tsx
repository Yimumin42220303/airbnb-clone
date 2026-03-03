"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  calculateRefundAmount,
  POLICY_LABELS_KO,
  type CancellationPolicyType,
} from "@/lib/policies";
import { useCurrency } from "@/components/currency/CurrencyProvider";

type Props = {
  bookingId: string;
  listingTitle: string;
  paymentStatus?: string;
  checkIn?: string;
  totalPrice?: number;
  cancellationPolicy?: string;
  bookingCreatedAt?: string;
};

/**
 * 환불 비율 계산 (숙소의 취소 정책 기반)
 */
function getRefundInfo(
  checkIn: string,
  totalPrice: number,
  cancellationPolicy: CancellationPolicyType = "flexible",
  bookingCreatedAt?: string
) {
  const result = calculateRefundAmount({
    policy: cancellationPolicy,
    totalPrice,
    checkInDate: new Date(checkIn),
    cancellationDate: new Date(),
    bookingCreatedAt: bookingCreatedAt ? new Date(bookingCreatedAt) : undefined,
  });
  const policyLabel = POLICY_LABELS_KO[cancellationPolicy] || "유연";
  return {
    rate: Math.round(result.rate * 100),
    amount: result.amount,
    policy: `${policyLabel} 정책: ${result.description}`,
  };
}

export default function CancelBookingButton({
  bookingId,
  listingTitle,
  paymentStatus,
  checkIn,
  totalPrice,
  cancellationPolicy,
  bookingCreatedAt,
}: Props) {
  const { formatForGuest } = useCurrency();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    const isPaid = paymentStatus === "paid";
    let confirmMsg = `"${listingTitle}" 예약을 취소할까요?`;

    try {
      if (isPaid && checkIn && totalPrice) {
        const refund = getRefundInfo(
          checkIn,
          totalPrice,
          (cancellationPolicy || "flexible") as CancellationPolicyType,
          bookingCreatedAt
        );
        confirmMsg =
          `"${listingTitle}" 예약을 취소할까요?\n\n` +
          `취소 정책: ${refund.policy}\n` +
          `환불 금액: ${formatForGuest(refund.amount)} (${refund.rate}%)`;
        if (refund.rate === 0) {
          confirmMsg += "\n\n⚠️ 환불이 불가능합니다.";
        }
      }
    } catch (e) {
      console.error("[CancelBookingButton] refund calc error:", e);
    }

    if (!confirm(confirmMsg)) return;
    setLoading(true);
    try {
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

      let data: Record<string, unknown> | null = null;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        console.error("[CancelBookingButton] non-JSON response:", res.status, text.slice(0, 300));
        toast.error(`취소에 실패했습니다. (HTTP ${res.status})`);
        return;
      }

      if (!res.ok) {
        toast.error((data?.error as string) || `취소에 실패했습니다. (HTTP ${res.status})`);
        return;
      }

      if (isPaid && data?.refundAmount !== undefined) {
        if ((data.refundAmount as number) > 0) {
          toast.success(
            `예약이 취소되었습니다. 환불 금액: ${formatForGuest(data.refundAmount as number)} ${data.portoneRefund ? "카드 환불이 진행됩니다." : "환불이 처리됩니다."}`
          );
        } else {
          toast.success("예약이 취소되었습니다. (환불 불가 기간)");
        }
      } else {
        toast.success("예약이 취소되었습니다.");
      }

      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[CancelBookingButton] fetch error:", msg);
      toast.error(`취소 요청 중 오류가 발생했습니다. (${msg})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={loading}
      className="inline-block mt-2 text-minbak-body text-minbak-gray hover:text-minbak-primary hover:underline disabled:opacity-50"
    >
      {loading ? "취소 중..." : "예약 취소"}
    </button>
  );
}
