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
}: {
  bookingId: string;
  totalPrice: number;
  listingTitle?: string;
  userName?: string;
  userEmail?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    setLoading(true);
    setError("");
    try {
      if (PORTONE_READY) {
        // 포트원 결제 연동
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
          // 서버 측 결제 검증
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
      } else {
        // 포트원 미설정 시 - 가상계좌 등 수동 결제 안내
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
      <Button
        type="button"
        onClick={handlePay}
        disabled={loading}
        variant="primary"
        className="w-full"
      >
        {loading ? "처리 중..." : `₩${totalPrice.toLocaleString()} 결제하기`}
      </Button>
    </div>
  );
}
