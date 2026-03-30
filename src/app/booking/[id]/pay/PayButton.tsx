"use client";

import { useState } from "react";
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { STORED_CURRENCY, convertJpyToKrw } from "@/lib/currency";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { CONTACT_EMAIL } from "@/lib/constants";

const PORTONE_STORE_ID = (process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "").trim();
const PORTONE_CHANNEL_KEY = (process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "").trim();
const PORTONE_CHANNEL_KEY_MOBILE = (process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_MOBILE ?? "").trim();
const PORTONE_READY = !!(
  PORTONE_STORE_ID.startsWith("store-") &&
  PORTONE_CHANNEL_KEY.startsWith("channel-key-")
);
const MOCK_PAYMENT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENT === "1";
const BILLING_KEY_ENABLED = false;
const PORTONE_BILLING_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY ?? "";

function getIsMobile(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < 768) return true;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function getChannelKeyForDevice(): string {
  if (getIsMobile() && PORTONE_CHANNEL_KEY_MOBILE) {
    return PORTONE_CHANNEL_KEY_MOBILE;
  }
  return PORTONE_CHANNEL_KEY;
}

function isMobilePaymentError(msg: string): boolean {
  return /INIStdPay|해당기기|PC로 결제/i.test(msg);
}

/** 휴대폰 번호: 하이픈 제거 후 10~11자리만 허용 (이니시스 V2 필수) */
function normalizePhone(v: string | undefined): string | undefined {
  if (!v || typeof v !== "string") return undefined;
  const digits = v.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11) return digits;
  return undefined;
}

export default function PayButton({
  bookingId,
  totalPrice,
  listingTitle,
  userName,
  userEmail,
  userPhoneNumber,
  checkIn,
}: {
  bookingId: string;
  totalPrice: number;
  listingTitle?: string;
  userName?: string;
  userEmail?: string;
  userPhoneNumber?: string;
  checkIn?: string;
}) {
  const { formatForGuest, jpyToKrw } = useCurrency();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mobilePaymentBlocked, setMobilePaymentBlocked] = useState(false);
  const [linkSending, setLinkSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  // 체크인까지 남은 일수 계산
  const daysBeforeCheckIn = checkIn
    ? Math.floor(
        (new Date(checkIn + "T00:00:00").getTime() - new Date().getTime()) /
          (24 * 60 * 60 * 1000)
      )
    : 0;
  const isDeferred = BILLING_KEY_ENABLED && daysBeforeCheckIn >= 7;

  async function handleMockPay() {
    if (!MOCK_PAYMENT_ENABLED) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/mock-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; conversationId?: string };
      if (res.ok && data.ok) {
        if (data.conversationId) {
          router.push(`/messages/${data.conversationId}`);
        } else {
          router.push("/my-bookings");
        }
        router.refresh();
      } else {
        setError(data.error || "모의 결제에 실패했습니다.");
      }
    } catch (e) {
      console.error("[PayButton] mock-verify error:", e);
      setError("모의 결제 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

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
              phoneNumber: normalizePhone(userPhoneNumber) || undefined,
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
            const phoneNumber = normalizePhone(userPhoneNumber);
            if (!phoneNumber) {
              setError(
                "이니시스 결제를 위해 휴대폰 번호가 필요합니다. 마이페이지에서 휴대폰 번호를 등록해 주세요."
              );
              return;
            }
            const fullName = (userName ?? "").trim() || "결제자";
            const amountKrw =
              STORED_CURRENCY === "JPY"
                ? convertJpyToKrw(totalPrice, jpyToKrw ?? undefined)
                : totalPrice;
            const channelKey = getChannelKeyForDevice().trim();
            const storeId = PORTONE_STORE_ID.trim();
            if (!storeId.startsWith("store-") || !channelKey.startsWith("channel-key-")) {
              setError(
                "결제 설정이 올바르지 않습니다. (Store ID 또는 채널 키 형식 오류) 관리자에게 문의해 주세요."
              );
              return;
            }
            const redirectUrl = `${window.location.origin}/booking/${bookingId}/pay/callback`;
            const paymentParams: Parameters<typeof PortOne.requestPayment>[0] = {
              storeId,
              channelKey,
              paymentId: generatedPaymentId,
              orderName: (listingTitle || "숙소 예약").slice(0, 50),
              totalAmount: amountKrw,
              currency: "CURRENCY_KRW",
              payMethod: "CARD",
              redirectUrl,
              customer: {
                fullName,
                email: userEmail || undefined,
                phoneNumber,
              },
            };
            if (typeof (paymentParams as Record<string, unknown>).bypass === "undefined") {
              (paymentParams as Record<string, unknown>).bypass = {
                inicis_v2: {
                  apprun_check: "Y",
                },
              };
            }
            result = await PortOne.requestPayment(paymentParams);
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
            const debugKeys = `[store len=${PORTONE_STORE_ID.length} ch len=${PORTONE_CHANNEL_KEY.length} | ${PORTONE_STORE_ID.slice(0,10)}…${PORTONE_STORE_ID.slice(-4)} / ${PORTONE_CHANNEL_KEY.slice(0,14)}…${PORTONE_CHANNEL_KEY.slice(-4)}]`;
            console.error("[PayButton] requestPayment 오류:", payErr, debugKeys);
            const combined = [msg, pgMsg, code].join(" ");
            if (isMobilePaymentError(combined)) {
              setMobilePaymentBlocked(true);
              setError(
                "모바일에서는 현재 카드 결제가 지원되지 않습니다. 아래에서 결제 링크를 이메일로 받아 PC에서 결제해 주세요."
              );
              return;
            }
            if (/cancel|취소|popup|closed|abort|사용자/i.test(msg || pgMsg)) {
              setError("결제가 취소되었습니다.");
            } else if (/fetch|network|Failed to fetch/i.test(msg)) {
              setError("네트워크 연결을 확인하고 다시 시도해 주세요.");
            } else if (/Failed to load window\.PortOne|window\.PortOne/i.test(msg || pgMsg)) {
              setError(
                "결제 창을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요. 계속되면 광고 차단을 해제하거나 다른 네트워크에서 시도해 보시고, 문의하기로 연락해 주세요."
              );
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
              setError(`${display} ${debugKeys}`);
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

            let verifyData: { ok?: boolean; error?: string; conversationId?: string };
            try {
              verifyData = await verifyRes.json();
            } catch {
              setError(
                "결제 검증 응답을 확인할 수 없습니다. 예약 목록에서 결제 상태를 확인해 주세요."
              );
              return;
            }
            if (verifyRes.ok && verifyData.ok) {
              // 결제 성공 시 호스트와의 메시지창으로 바로 이동 (대화방 있으면)
              if (verifyData.conversationId) {
                router.push(`/messages/${verifyData.conversationId}`);
              } else {
                router.push("/my-bookings");
              }
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
            const pgMsgResult = result && typeof (result as { pgMessage?: string }).pgMessage === "string"
              ? (result as { pgMessage: string }).pgMessage
              : "";
            const combinedResult = [resultMsg, pgMsgResult, code].filter(Boolean).join(" ");
            if (isMobilePaymentError(combinedResult)) {
              setMobilePaymentBlocked(true);
              setError(
                "모바일에서는 카드 결제가 지원되지 않습니다. 아래에서 결제 링크를 이메일로 받아 PC에서 결제해 주세요."
              );
              return;
            }
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
      const deepMsg = obj?.data != null && typeof (obj.data as { message?: string }).message === "string"
        ? String((obj.data as { message: string }).message)
        : "";
      const combinedCatch = [message, deepMsg, obj?.code].filter(Boolean).join(" ");
      if (isMobilePaymentError(combinedCatch)) {
        setMobilePaymentBlocked(true);
        setError(
          "모바일에서는 카드 결제가 지원되지 않습니다. 아래에서 결제 링크를 이메일로 받아 PC에서 결제해 주세요."
        );
      } else {
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
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSendPaymentLink() {
    if (linkSending || linkSent) return;
    setLinkSending(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payment-link`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setLinkSent(true);
      } else {
        setError(data.error || "이메일 발송에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch {
      setError("이메일 발송 요청에 실패했습니다. 네트워크를 확인해 주세요.");
    } finally {
      setLinkSending(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-3" role="alert">
          <p className="text-[14px] text-[#E31C23]">{error}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setError("")}
              className="text-[13px]"
            >
              다시 시도
            </Button>
            <a
              href={CONTACT_EMAIL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[36px] px-4 py-2 rounded-minbak border border-minbak-light-gray text-[13px] font-medium text-minbak-black hover:bg-minbak-bg transition-colors"
            >
              문의하기
            </a>
          </div>
        </div>
      )}
      {isDeferred && (
        <p className="text-[13px] text-[#717171]">
          지금은 요금이 청구되지 않습니다. 체크인 7일 전에 결제가 진행됩니다.
        </p>
      )}
      {mobilePaymentBlocked ? (
        <div className="space-y-3">
          {linkSent ? (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-[14px] text-green-800 text-center">
              결제 링크가 <strong>{userEmail || "등록된 이메일"}</strong>로 발송되었습니다. 이메일을 확인해 주세요.
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleSendPaymentLink}
              disabled={linkSending}
              variant="primary"
              className="w-full"
            >
              {linkSending ? "발송 중..." : "결제 링크 이메일로 받기"}
            </Button>
          )}
          <p className="text-[12px] text-[#717171]">
            카카오톡·네이버 앱 안에서 열었다면 Chrome, Safari 등 브라우저 앱에서 이 페이지를 열어 보세요.
          </p>
          <button
            type="button"
            onClick={() => {
              setMobilePaymentBlocked(false);
              setError("");
            }}
            className="w-full text-center text-[13px] text-[#717171] underline"
          >
            다시 결제 시도하기
          </button>
        </div>
      ) : (
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
              : `${formatForGuest(totalPrice)} 결제하기`}
        </Button>
      )}
      {MOCK_PAYMENT_ENABLED && !isDeferred && PORTONE_READY && !mobilePaymentBlocked && (
        <Button
          type="button"
          onClick={handleMockPay}
          disabled={loading}
          variant="secondary"
          className="mt-2 w-full border-dashed text-[13px] text-neutral-500"
        >
          테스트 결제 (모의 · 카드 없음)
        </Button>
      )}
    </div>
  );
}
