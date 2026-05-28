"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { stashMetaPurchasePending } from "@/lib/meta-purchase";
import { logMetaPurchaseFromVerifyResponse } from "@/lib/meta-pixel-debug";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const bookingId = params.id as string;

  const paymentId = searchParams.get("paymentId");
  const code = searchParams.get("code");
  const message = searchParams.get("message");

  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (code) {
      setError(message || "결제에 실패했습니다.");
      setVerifying(false);
      return;
    }

    if (!paymentId) {
      setError("결제 정보를 찾을 수 없습니다.");
      setVerifying(false);
      return;
    }

    let cancelled = false;

    fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, bookingId }),
    })
      .then((res) => res.json())
      .then((data: {
        ok?: boolean;
        error?: string;
        conversationId?: string;
        metaPurchaseEventId?: string;
        purchaseValue?: number;
        listingId?: string;
        capiStatus?: "success" | "skipped" | "failed";
        capiError?: string;
      }) => {
        if (cancelled) return;
        if (data.ok) {
          logMetaPurchaseFromVerifyResponse({
            bookingId,
            metaPurchaseEventId: data.metaPurchaseEventId,
            purchaseValue: data.purchaseValue,
            capiStatus: data.capiStatus,
            capiError: data.capiError,
          });
          if (
            data.metaPurchaseEventId &&
            typeof data.purchaseValue === "number"
          ) {
            stashMetaPurchasePending({
              eventId: data.metaPurchaseEventId,
              value: data.purchaseValue,
              currency: "JPY",
              bookingId,
              listingId: data.listingId,
            });
          }
          if (data.conversationId) {
            router.replace(`/messages/${data.conversationId}`);
          } else {
            router.replace("/my-bookings");
          }
        } else {
          setError(data.error || "결제 검증에 실패했습니다.");
        }
      })
      .catch(() => {
        if (!cancelled) setError("결제 검증 요청에 실패했습니다. 네트워크를 확인해 주세요.");
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paymentId, code, message, bookingId, router]);

  if (verifying) {
    return (
      <div className="max-w-[480px] mx-auto py-20 text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-6" />
        <p className="text-[16px] font-medium text-[#222]">결제 확인 중입니다...</p>
        <p className="text-[14px] text-[#717171] mt-2">잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[480px] mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl text-red-600" aria-hidden>✕</span>
        </div>
        <h1 className="text-[18px] font-semibold text-[#222] mb-2">결제에 실패했습니다</h1>
        <p className="text-[14px] text-[#717171] mb-6">{error}</p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/booking/${bookingId}/pay`}
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-[15px] font-medium rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors"
          >
            다시 결제하기
          </Link>
          <Link
            href="/my-bookings"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-[15px] font-medium rounded-full border border-gray-300 text-[#222] hover:bg-gray-50 transition-colors"
          >
            내 예약 보기
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function PaymentCallbackPage() {
  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6">
      <Suspense
        fallback={
          <div className="max-w-[480px] mx-auto py-20 text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-rose-500 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[16px] font-medium text-[#222]">결제 확인 중입니다...</p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </main>
  );
}
