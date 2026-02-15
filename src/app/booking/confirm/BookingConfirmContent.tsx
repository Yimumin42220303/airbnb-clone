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
  Building2,
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
  userName?: string | null;
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
  userName,
  userEmail,
  cancellationPolicy = "flexible",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "virtual_account">(
    PORTONE_READY ? "card" : "virtual_account"
  );
  const defaultName = userName ?? "";
  const defaultEmail = userEmail ?? "";
  const [form, setForm] = useState({
    firstName: defaultName.split(" ").slice(1).join(" ") || defaultName || "",
    lastName: defaultName.split(" ")[0] || "",
    email: defaultEmail,
    phone: "",
    specialRequests: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.lastName?.trim() || !form.firstName?.trim()) {
      setError("이름과 성을 입력해 주세요.");
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

      if (
        paymentMethod === "card" &&
        PORTONE_READY
      ) {
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
              fullName: `${form.lastName} ${form.firstName}`.trim(),
              email: form.email.trim(),
              phoneNumber: form.phone.trim().replace(/-/g, "") || undefined,
            },
          });
          // 결제창 X(닫기) 시 SDK는 reject가 아니라 undefined로 resolve함
          if (result && result.transactionType === "PAYMENT" && !result.code) {
            // ✅ 서버 측 결제 검증 (포트원 API로 금액/상태 확인)
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
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-[14px] font-medium text-[#222]">
                      이름 *
                    </span>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      className="px-3 py-2.5 border border-[#ebebeb] rounded-lg text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23]"
                      placeholder="길동"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[14px] font-medium text-[#222]">
                      성 *
                    </span>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      className="px-3 py-2.5 border border-[#ebebeb] rounded-lg text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23]"
                      placeholder="홍"
                    />
                  </label>
                </div>
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
              const policyMap: Record<string, { label: string; color: string; rules: string[] }> = {
                flexible: {
                  label: "유연",
                  color: "bg-green-100 text-green-800",
                  rules: [
                    "체크인 1일 전까지 취소 시 100% 환불",
                    "체크인 당일 이후 환불 불가",
                  ],
                },
                moderate: {
                  label: "보통",
                  color: "bg-amber-100 text-amber-800",
                  rules: [
                    "체크인 5일 전까지 취소 시 100% 환불",
                    "체크인 1~4일 전 취소 시 50% 환불",
                    "체크인 당일 이후 환불 불가",
                  ],
                },
                strict: {
                  label: "엄격",
                  color: "bg-red-100 text-red-800",
                  rules: [
                    "예약 후 48시간 이내 취소 시 100% 환불 (체크인 14일 이상 남은 경우)",
                    "체크인 7일 전까지 취소 시 50% 환불",
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
                <div className="p-6 space-y-4 text-[14px] text-[#222]">
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors hover:bg-[#fafafa] border-[#ebebeb] has-[:checked]:border-[#E31C23] has-[:checked]:bg-[#fff8f8]">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="mt-0.5 w-4 h-4 text-[#E31C23]"
                      />
                      <div>
                        <span className="font-semibold text-[#222]">
                          신용카드 결제 (KG이니시스)
                        </span>
                        <p className="mt-1 text-[13px] text-[#717171]">
                          신용카드로 안전하게 결제합니다.
                          결제하기 버튼 클릭 시 KG이니시스 결제창이 열립니다.
                        </p>
                        {!PORTONE_READY && (
                          <p className="mt-1 text-[12px] text-amber-600">
                            현재 카드 결제를 이용할 수 없습니다.
                          </p>
                        )}
                      </div>
                    </label>
                    <label className="flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors hover:bg-[#fafafa] border-[#ebebeb] has-[:checked]:border-[#E31C23] has-[:checked]:bg-[#fff8f8]">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="virtual_account"
                        checked={paymentMethod === "virtual_account"}
                        onChange={() => setPaymentMethod("virtual_account")}
                        className="mt-0.5 w-4 h-4 text-[#E31C23]"
                      />
                      <div>
                        <span className="font-semibold text-[#222] flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-[#717171]" />
                          가상계좌 입금
                        </span>
                        <p className="mt-1 text-[13px] text-[#717171]">
                          예약 후 발급된 가상계좌로 입금하시면 확인 후 확정됩니다.
                        </p>
                      </div>
                    </label>
                  </div>

                  {paymentMethod === "virtual_account" && (
                    <div className="mt-4 pt-4 border-t border-[#ebebeb] space-y-3 text-[13px]">
                      <p className="text-[#717171]">
                        결제하기 클릭 후 예약이 생성되면, 아래 계좌로 입금해 주세요.
                      </p>
                      <div>
                        <p className="text-[12px] text-[#717171] mb-0.5">입금은행</p>
                        <p className="font-medium flex items-center gap-1.5">
                          카카오뱅크 3333-35-7006182
                          <button
                            type="button"
                            onClick={() =>
                              navigator.clipboard?.writeText(
                                "카카오뱅크 3333-35-7006182"
                              )
                            }
                            className="text-[#717171] hover:text-[#222]"
                            title="복사"
                          >
                            📋
                          </button>
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] text-[#717171] mb-0.5">예금주</p>
                        <p className="font-medium">한일익스프레스</p>
                      </div>
                      <div>
                        <p className="text-[12px] text-[#717171] mb-0.5">입금기한</p>
                        <p className="font-medium">
                          예약 후 2일 내 (미입금 시 예약 자동 취소)
                        </p>
                      </div>
                      <p className="text-[#717171]">
                        입금 시 예약자명과 다를 경우 메모란에 예약자 성명을 적어 주세요.
                      </p>
                      <div>
                        <p className="text-[12px] text-[#717171] mb-1.5">현금 영수증</p>
                        <div className="flex flex-wrap gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="cashReceipt" value="none" defaultChecked className="text-[#E31C23]" />
                            <span>안 함</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="cashReceipt" value="income" className="text-[#E31C23]" />
                            <span>소득공제</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="cashReceipt" value="business" className="text-[#E31C23]" />
                            <span>사업자지출증빙</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
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
                  {paymentMethod === "card" && PORTONE_READY
                    ? "아래 결제하기를 누르면 KG이니시스 결제창이 열립니다."
                    : "예약 정보를 확인했으며, 결제를 진행합니다."}
                </p>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (paymentMethod === "card" && !PORTONE_READY)
                  }
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
