"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  User,
  Home,
  Shield,
  CreditCard,
  Info,
} from "lucide-react";

const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "";
const PORTONE_CHANNEL_KEY =
  process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "";
const PORTONE_READY = !!(
  PORTONE_STORE_ID &&
  PORTONE_CHANNEL_KEY
);

type Props = {
  listingId: string;
  listingTitle: string;
  listingLocation: string;
  listingImageUrl: string;
  pricePerNight: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
  userEmail?: string | null;
  cancellationPolicy?: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\. /g, "-")
    .replace(".", "");
}

export default function BookingConfirmContent({
  listingId,
  listingTitle,
  listingLocation,
  listingImageUrl,
  pricePerNight,
  checkIn,
  checkOut,
  guests,
  nights,
  totalPrice,
  userEmail,
  cancellationPolicy = "flexible",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const defaultEmail = userEmail ?? "";
  const [form, setForm] = useState({
    fullName: "",
    email: defaultEmail,
    phone: "",
    specialRequests: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.fullName?.trim()) {
      setError("예약자 성함을 입력해 주세요.");
      return;
    }
    if (!form.email?.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    if (!form.phone?.trim()) {
      setError("긴급연락용 전화번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "예약 신청에 실패했습니다.");
        return;
      }
      const nightsNum =
        data.nights ??
        Math.floor(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (24 * 60 * 60 * 1000)
        );
      const completeParams = new URLSearchParams({
        id: data.id,
        title: encodeURIComponent(listingTitle),
        checkIn: data.checkIn ?? checkIn,
        checkOut: data.checkOut ?? checkOut,
        guests: String(data.guests ?? guests),
        total: String(data.totalPrice ?? totalPrice),
        nights: String(nightsNum),
      });

      if (PORTONE_READY) {
        let paymentSuccess = false;
        try {
          const PortOne = await import("@portone/browser-sdk/v2");
          const generatedPaymentId = `b${data.id}${Date.now()}`;
          const result = await PortOne.requestPayment({
            storeId: PORTONE_STORE_ID,
            channelKey: PORTONE_CHANNEL_KEY,
            paymentId: generatedPaymentId,
            orderName: listingTitle.slice(0, 50),
            totalAmount: totalPrice,
            currency: "CURRENCY_KRW",
            payMethod: "CARD",
            customer: {
              fullName: form.fullName.trim(),
              email: form.email.trim(),
              phoneNumber: form.phone.trim().replace(/-/g, "") || undefined,
            },
          });
          // SDK 에러 코드가 있으면 구체적 에러 표시
          if (result && result.code) {
            setError(result.message || "결제 요청에 실패했습니다. (" + result.code + ")");
            await fetch(`/api/bookings/${data.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "cancelled" }),
            });
            return;
          }
          // 결제창 X(닫기) 시 SDK는 reject가 아니라 undefined로 resolve함
          if (result && result.transactionType === "PAYMENT" && !result.code) {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: generatedPaymentId,
                bookingId: data.id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.ok) {
              paymentSuccess = true;
            } else {
              setError(verifyData.error || "결제 검증에 실패했습니다.");
              return;
            }
          }
        } catch (payErr) {
          // SDK가 reject한 경우 (일부 환경에서 취소 시 throw)
          paymentSuccess = false;
        }
        if (!paymentSuccess) {
          await fetch(`/api/bookings/${data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "cancelled" }),
          });
          setError("결제가 취소되었거나 완료되지 않았습니다. 예약은 진행되지 않았습니다.");
          return;
        }
      }

      router.push(`/booking/complete?${completeParams.toString()}`);
    } catch (err) {
      setError("예약 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1 text-[14px] text-[#717171] hover:text-[#222] mb-4 transition-colors"
        >
          &larr; 뒤로가기
        </button>
        <h1 className="text-[28px] md:text-[32px] font-bold text-[#222] mb-2">
          예약 확인 및 결제
        </h1>
        <p className="text-[15px] text-[#717171]">
          예약 정보를 확인하고 결제를 완료해주세요.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* 왼쪽 컬럼 (2/3) */}
        <div className="lg:col-span-2 space-y-6">
            {/* 숙소 정보 카드 */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="flex gap-4 p-6">
                <div className="relative w-[120px] h-[100px] rounded-xl overflow-hidden flex-shrink-0 bg-[#f7f7f7]">
                  <Image
                    src={listingImageUrl}
                    alt={listingTitle}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#222] leading-snug line-clamp-2">
                    {listingTitle}
                  </p>
                  <p className="mt-1 text-[14px] text-[#717171] flex items-center gap-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    {listingLocation}
                  </p>
                </div>
              </div>
            </div>

            {/* 예약 정보 카드 */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-6 border-b border-[#ebebeb]">
                <h2 className="text-[17px] font-semibold text-[#222] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#717171]" />
                  예약 정보
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[12px] text-[#717171] mb-0.5">체크인</p>
                  <p className="text-[15px] font-medium text-[#222]">
                    {formatDate(checkIn)}
                  </p>
                  <p className="text-[13px] text-[#717171]">오후 4:00시 이후</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#717171] mb-0.5">체크아웃</p>
                  <p className="text-[15px] font-medium text-[#222]">
                    {formatDate(checkOut)}
                  </p>
                  <p className="text-[13px] text-[#717171]">오전 10:00시 이전</p>
                </div>
                <div className="flex flex-wrap gap-4 pt-2">
                  <span className="text-[14px] text-[#222] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#717171]" />
                    게스트 {guests}명
                  </span>
                  <span className="text-[14px] text-[#222] flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-[#717171]" />
                    {nights}박
                  </span>
                </div>
              </div>
            </div>

            {/* 예약자 정보 카드 */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-6 border-b border-[#ebebeb]">
                <h2 className="text-[17px] font-semibold text-[#222]">
                  예약자 정보
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <label className="flex flex-col gap-1">
                  <span className="text-[14px] font-medium text-[#222]">
                    예약자 성함 *
                  </span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    className="px-3 py-2.5 border border-[#ebebeb] rounded-lg text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23]"
                    placeholder="홍길동"
                  />
                </label>
                <label className="block flex flex-col gap-1">
                  <span className="text-[14px] font-medium text-[#222]">
                    이메일 *
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="px-3 py-2.5 border border-[#ebebeb] rounded-lg text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23]"
                    placeholder="example@email.com"
                  />
                </label>
                <label className="block flex flex-col gap-1">
                  <span className="text-[14px] font-medium text-[#222]">
                    긴급연락용 전화번호 *
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className="px-3 py-2.5 border border-[#ebebeb] rounded-lg text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23]"
                    placeholder="010-1234-5678"
                  />
                </label>
                <label className="block flex flex-col gap-1">
                  <span className="text-[14px] font-medium text-[#222]">
                    특별 요청사항
                  </span>
                  <textarea
                    value={form.specialRequests}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        specialRequests: e.target.value,
                      }))
                    }
                    rows={3}
                    className="px-3 py-2.5 border border-[#ebebeb] rounded-lg text-[15px] text-[#222] resize-y focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23]"
                    placeholder="늦은 체크인 등"
                  />
                </label>
              </div>
            </div>

            {/* 취소 정책 카드 */}
            {(() => {
              // 체크인 날짜 기준으로 구체적인 환불 기한 날짜 계산
              function deadlineDate(daysBefore: number) {
                const d = new Date(checkIn + "T00:00:00");
                d.setDate(d.getDate() - daysBefore);
                const y = d.getFullYear();
                const m = d.getMonth() + 1;
                const day = d.getDate();
                return `${y}년 ${m}월 ${day}일`;
              }

              const policyMap: Record<string, { label: string; color: string; rules: string[] }> = {
                flexible: {
                  label: "유연",
                  color: "bg-green-100 text-green-800",
                  rules: [
                    `${deadlineDate(1)}까지 취소 시 100% 환불`,
                    "체크인 당일 이후 환불 불가",
                  ],
                },
                moderate: {
                  label: "보통",
                  color: "bg-amber-100 text-amber-800",
                  rules: [
                    `${deadlineDate(5)}까지 취소 시 100% 환불`,
                    `${deadlineDate(4)} ~ ${deadlineDate(1)} 취소 시 50% 환불`,
                    "체크인 당일 이후 환불 불가",
                  ],
                },
                strict: {
                  label: "엄격",
                  color: "bg-red-100 text-red-800",
                  rules: [
                    "예약 후 48시간 이내 취소 시 100% 환불 (체크인 14일 이상 남은 경우)",
                    `${deadlineDate(7)}까지 취소 시 50% 환불`,
                    "체크인 7일 이내 환불 불가",
                  ],
                },
              };
              const info = policyMap[cancellationPolicy] || policyMap.flexible;
              return (
                <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="p-6 border-b border-[#ebebeb]">
                    <h2 className="text-[17px] font-semibold text-[#222] flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#717171]" />
                      취소 정책
                      <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${info.color}`}>
                        {info.label}
                      </span>
                    </h2>
                  </div>
                  <ul className="p-6 space-y-2 text-[14px] text-[#222]">
                    {info.rules.map((rule, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#717171] flex-shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>

          {/* 오른쪽 컬럼 (1/3) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* 요금 세부사항 */}
              <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="p-6 border-b border-[#ebebeb]">
                  <h2 className="text-[17px] font-semibold text-[#222]">
                    요금 세부사항
                  </h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-[15px] text-[#222]">
                    <span>
                      ₩{pricePerNight.toLocaleString()} × {nights}박
                    </span>
                    <span>₩{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="pt-3 border-t border-[#ebebeb] flex justify-between items-center">
                    <span className="text-[15px] font-medium text-[#222]">
                      총 결제금액 (수수료,세금 전부포함)
                    </span>
                    <span className="text-[17px] font-bold text-[#222]">
                      ₩{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 결제 수단 (포트원 KG이니시스) */}
              <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                {/* 테스트 모드 안내는 관리자에게만 표시 (PG 심사 시 노출 방지) */}
                <div className="p-6 border-b border-[#ebebeb]">
                  <h2 className="text-[17px] font-semibold text-[#222] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#717171]" />
                    결제 수단
                  </h2>
                </div>
                <div className="p-6 text-[14px] text-[#222]">
                  <div className="flex items-start gap-3 p-4 rounded-xl border-2 border-[#E31C23] bg-[#fff8f8]">
                    <CreditCard className="w-5 h-5 text-[#E31C23] mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-[#222]">
                        신용카드 결제 (KG이니시스)
                      </span>
                      <p className="mt-1 text-[13px] text-[#717171]">
                        결제하기 버튼 클릭 시 KG이니시스 결제창이 열립니다.
                        신용카드, 간편결제 등 다양한 결제 수단을 이용할 수 있습니다.
                      </p>
                      {!PORTONE_READY && (
                        <p className="mt-1 text-[12px] text-amber-600">
                          현재 카드 결제를 이용할 수 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 결제 전 확인사항 */}
              <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="p-6 border-b border-[#ebebeb]">
                  <h2 className="text-[17px] font-semibold text-[#222] flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#717171]" />
                    결제 전 확인사항
                  </h2>
                </div>
                <ul className="p-6 space-y-2 text-[14px] text-[#222] list-disc list-inside">
                  <li>예약 확정 후 숙소 정보가 이메일로 발송됩니다</li>
                  <li>취소 정책을 반드시 확인해주세요</li>
                </ul>
              </div>

              {/* 결제하기 */}
              <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 space-y-4">
                {error && (
                  <p className="text-[14px] text-[#E31C23]" role="alert">
                    {error}
                  </p>
                )}
                <p className="text-[14px] text-[#222]">
                  아래 결제하기를 누르면 KG이니시스 결제창이 열립니다.
                </p>
                <button
                  type="submit"
                  disabled={loading || !PORTONE_READY}
                  className="w-full py-3.5 rounded-full text-[16px] font-semibold text-white bg-[#E31C23] hover:bg-[#c91820] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "처리 중..." : "₩" + totalPrice.toLocaleString() + " 결제하기"}
                </button>
                <p className="text-[13px] text-[#717171]">
                  결제 완료 후 예약이 확정됩니다. 취소 시 취소 정책에 따라
                  환불됩니다.
                </p>
              </div>
            </div>
          </div>
      </form>
    </div>
  );
}
