"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "";
const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "";
const PORTONE_READY = !!(PORTONE_STORE_ID && PORTONE_CHANNEL_KEY);
// 빌링키(후불결제)는 정식 서비스 릴리스 시 도입 예정. 현재는 즉시결제만 지원
const BILLING_KEY_ENABLED = false;
const PORTONE_BILLING_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY ?? "";

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
  const isDeferred = BILLING_KEY_ENABLED && daysBeforeCheckIn >= 7;

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
            channelKey: PORTONE_BILLING_CHANNEL_KEY,
            billingKeyMethod: "CARD",
            customer: {
              fullName: userName || undefined,
              email: userEmail || undefined,
            },
          });
          if (issueResult && issueResult.code) {
            setError(issueResult.message || "결제 수단 확인에 실패했습니다. 다시 시도해 주세요.");
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
              setError(bkData.error || "예약 처리에 실패했습니다. 다시 시도해 주세요.");
              return;
            }
          }
          setError("예약이 완료되지 않았습니다. 다시 시도해 주세요.");
        } else {
          // === 즉시 결제 방식 ===
          let PortOne: typeof import("@portone/browser-sdk/v2");
          try {
            PortOne = await import("@portone/browser-sdk/v2");
          } catch (e) {
            console.error("[PayButton] Portone SDK 로드 실패:", e);
            setError(
              "결제 모듈을 불러올 수 없습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해 주세요."
            );
            return;
          }

          const generatedPaymentId = `b${bookingId}${Date.now()}`;
          let result: Awaited<ReturnType<typeof PortOne.requestPayment>>;
          try {
            result = await PortOne.requestPayment({
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
          } catch (payErr) {
            const obj = payErr && typeof payErr === "object" ? payErr as Record<string, unknown> : null;
            const raw =
              payErr instanceof Error
                ? payErr.message
                : obj?.message != null
                  ? String(obj.message)
                  : String(payErr);
            const msg = raw === "[object Object]" ? "" : raw;
            const pgMsg = obj?.pgMessage != null ? String(obj.pgMessage) : "";
            const code = obj?.code != null ? String(obj.code) : "";
            console.error("[PayButton] requestPayment 오류:", payErr);
            if (/cancel|취소|popup|closed|abort|사용자/i.test(msg || pgMsg)) {
              setError("결제가 취소되었습니다.");
            } else if (/fetch|network|Failed to fetch/i.test(msg)) {
              setError("네트워크 연결을 확인하고 다시 시도해 주세요.");
            } else {
              const part = (msg || pgMsg).trim();
              const display =
                part.length > 0
                  ? part.length <= 250
                    ? part
                    : part.slice(0, 247) + "…"
                  : code
                    ? `결제 오류 (코드: ${code})`
                    : "결제 창에서 오류가 발생했습니다. 결제 수단을 확인하거나 잠시 후 다시 시도해 주세요.";
              setError(display);
            }
            return;
          }

          if (result && result.transactionType === "PAYMENT" && !result.code) {
            const paymentIdToVerify = result.paymentId || generatedPaymentId;
            let verifyRes: Response;
            try {
              verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  paymentId: paymentIdToVerify,
                  bookingId,
                }),
              });
            } catch (fetchErr) {
              console.error("[PayButton] verify fetch 오류:", fetchErr);
              setError(
                "결제 검증 요청에 실패했습니다. 네트워크를 확인하고 다시 시도해 주세요."
              );
              return;
            }

            let verifyData: { ok?: boolean; error?: string };
            try {
              verifyData = await verifyRes.json();
            } catch {
              setError(
                "결제 검증 응답을 확인할 수 없습니다. 예약 목록에서 결제 상태를 확인해 주세요."
              );
              return;
            }
            if (verifyRes.ok && verifyData.ok) {
              router.push("/my-bookings");
              router.refresh();
              return;
            } else {
              setError(
                verifyData.error ||
                  "결제 검증에 실패했습니다. 예약 목록에서 결제 상태를 확인해 주세요."
              );
              return;
            }
          } else {
            const code = result?.code;
            const resultMsg =
              result && typeof (result as { message?: string }).message === "string"
                ? (result as { message: string }).message
                : "";
            if (code || resultMsg) {
              setError(
                resultMsg || (code ? `결제 오류 (${code})` : "결제가 완료되지 않았습니다.")
              );
            } else {
              setError("결제가 취소되었거나 완료되지 않았습니다.");
            }
            return;
          }
        }
      } else {
        setError("온라인 결제가 설정되지 않았습니다. 가상계좌 입금 후 관리자에게 문의해 주세요.");
      }
    } catch (err) {
      const obj = err && typeof err === "object" ? err as Record<string, unknown> : null;
      const raw =
        err instanceof Error
          ? err.message
          : obj?.message != null
            ? String(obj.message)
            : obj?.error != null
              ? String(obj.error)
              : String(err);
      const message = raw === "[object Object]" ? "" : raw;
      console.error("[PayButton] 결제 오류:", err);
      const display =
        message.length > 0
          ? message.length <= 250
            ? message
            : message.slice(0, 247) + "…"
          : obj?.code != null
            ? `결제 오류 (코드: ${String(obj.code)})`
            : "결제 처리 중 오류가 발생했습니다. 결제 수단을 확인하거나 잠시 후 다시 시도해 주세요.";
      setError(display);
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
        <p className="text-[13px] text-[#717171]">
          지금은 요금이 청구되지 않습니다. 체크인 7일 전에 결제가 진행됩니다.
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
            ? "예약 확정하기"
            : `₩${totalPrice.toLocaleString()} 결제하기`}
      </Button>
    </div>
  );
}
