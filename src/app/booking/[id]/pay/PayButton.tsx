"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "";
const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "";
const PORTONE_READY = !!(PORTONE_STORE_ID && PORTONE_CHANNEL_KEY);

export default function PayButton({
  bookingId,
  totalPrice,
  listingTitle,
  userName,
  userEmail,
  checkIn,
}: {
  bookingId: string;
  totalPrice: number;
  listingTitle?: string;
  userName?: string;
  userEmail?: string;
  checkIn?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 체크인까지 남은 일수 계산
  const daysBeforeCheckIn = checkIn
    ? Math.floor(
        (new Date(checkIn + "T00:00:00").getTime() - new Date().getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : 0;
  const isDeferred = daysBeforeCheckIn >= 7;

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      if (PORTONE_READY) {
        if (isDeferred) {
          // === 빌링키(카드 등록만) 방식 ===
          const PortOne = await import("@portone/browser-sdk/v2");
          const issueResult = await PortOne.requestIssueBillingKey({
            storeId: PORTONE_STORE_ID,
            channelKey: PORTONE_CHANNEL_KEY,
            billingKeyMethod: "CARD",
            customer: {
              fullName: userName || undefined,
              email: userEmail || undefined,
            },
          });
          if (issueResult && issueResult.code) {
            setError(issueResult.message || "카드 등록에 실패했습니다.");
            return;
          }
          if (issueResult && issueResult.billingKey) {
            const bkRes = await fetch("/api/bookings/billing-key", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId,
                billingKey: issueResult.billingKey,
              }),
            });
            const bkData = await bkRes.json();
            if (bkRes.ok && bkData.ok) {
              router.push("/my-bookings");
              router.refresh();
              return;
            } else {
              setError(bkData.error || "카드 등록 처리에 실패했습니다.");
              return;
            }
          }
          setError("카드 등록이 취소되었거나 완료되지 않았습니다.");
        } else {
          // === 즉시 결제 방식 (기존 로직) ===
          const PortOne = await import("@portone/browser-sdk/v2");
          const generatedPaymentId = `b${bookingId}${Date.now()}`;
          const result = await PortOne.requestPayment({
            storeId: PORTONE_STORE_ID,
            channelKey: PORTONE_CHANNEL_KEY,
            paymentId: generatedPaymentId,
            orderName: (listingTitle || "숙소 예약").slice(0, 50),
            totalAmount: totalPrice,
            currency: "CURRENCY_KRW",
            payMethod: "CARD",
            customer: {
              fullName: userName || undefined,
              email: userEmail || undefined,
            },
          });

          if (result && result.transactionType === "PAYMENT" && !result.code) {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: generatedPaymentId,
                bookingId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.ok) {
              router.push("/my-bookings");
              router.refresh();
              return;
            } else {
              setError(verifyData.error || "결제 검증에 실패했습니다.");
              return;
            }
          } else {
            setError("결제가 취소되었거나 완료되지 않았습니다.");
            return;
          }
        }
      } else {
        setError("온라인 결제가 설정되지 않았습니다. 가상계좌 입금 후 관리자에게 문의해 주세요.");
      }
    } catch {
      setError("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-[14px] text-[#E31C23]" role="alert">
          {error}
        </p>
      )}
      {isDeferred && (
        <p className="text-[13px] text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
          체크인 7일 전에 자동 결제됩니다. 카드만 등록하시면 예약이 확정됩니다.
        </p>
      )}
      <Button
        type="button"
        onClick={handlePay}
        disabled={loading}
        variant="primary"
        className="w-full"
      >
        {loading
          ? "처리 중..."
          : isDeferred
            ? "카드 등록하기"
            : `₩${totalPrice.toLocaleString()} 결제하기`}
      </Button>
    </div>
  );
}
