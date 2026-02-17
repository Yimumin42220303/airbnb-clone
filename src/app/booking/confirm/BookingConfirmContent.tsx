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
  Info,
  Clock,
} from "lucide-react";
import { formatDateKR } from "@/lib/date-utils";

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
        setError(data.error || "예약 요청에 실패했습니다.");
        return;
      }
      if (!data?.id) {
        setError("예약 요청에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      // 완료 페이지 대신 내 예약으로 이동 (완료 페이지에서 발생하던 전역 에러 회피)
      router.push("/my-bookings?requested=1");
    } catch {
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
          예약 확인
        </h1>
        <p className="text-[15px] text-[#717171]">
          예약 정보를 확인하고 요청을 보내주세요.
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
                    {formatDateKR(checkIn)}
                  </p>
                  <p className="text-[13px] text-[#717171]">오후 4:00시 이후</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#717171] mb-0.5">체크아웃</p>
                  <p className="text-[15px] font-medium text-[#222]">
                    {formatDateKR(checkOut)}
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
                    `${deadlineDate(7)}까지 취소 시 100% 환불`,
                    `${deadlineDate(6)} ~ ${deadlineDate(1)} 취소 시 50% 환불`,
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
                      총 요금 (수수료,세금 전부포함)
                    </span>
                    <span className="text-[17px] font-bold text-[#222]">
                      ₩{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 예약 진행 방식 안내 */}
              <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="p-6 border-b border-[#ebebeb]">
                  <h2 className="text-[17px] font-semibold text-[#222] flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#717171]" />
                    예약 진행 방식
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E31C23] text-white flex items-center justify-center text-[13px] font-bold">1</div>
                    <div>
                      <p className="text-[14px] font-medium text-[#222]">예약 요청</p>
                      <p className="text-[13px] text-[#717171]">지금 예약을 요청합니다 (결제 없음)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E31C23] text-white flex items-center justify-center text-[13px] font-bold">2</div>
                    <div>
                      <p className="text-[14px] font-medium text-[#222]">호스트 승인</p>
                      <p className="text-[13px] text-[#717171]">호스트가 24시간 이내에 승인/거절합니다</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E31C23] text-white flex items-center justify-center text-[13px] font-bold">3</div>
                    <div>
                      <p className="text-[14px] font-medium text-[#222]">결제 완료</p>
                      <p className="text-[13px] text-[#717171]">승인 후 24시간 이내에 결제하면 예약 확정!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 예약 전 확인사항 */}
              <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="p-6 border-b border-[#ebebeb]">
                  <h2 className="text-[17px] font-semibold text-[#222] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#717171]" />
                    예약 전 확인사항
                  </h2>
                </div>
                <ul className="p-6 space-y-2 text-[14px] text-[#222] list-disc list-inside">
                  <li>지금은 결제가 진행되지 않습니다</li>
                  <li>호스트 승인 후 결제 안내 이메일이 발송됩니다</li>
                  <li>승인 전까지 무료 취소가 가능합니다</li>
                </ul>
              </div>

              {/* 예약 요청하기 */}
              <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 space-y-4">
                {error && (
                  <p className="text-[14px] text-[#E31C23]" role="alert">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full text-[16px] font-semibold text-white bg-[#E31C23] hover:bg-[#c91820] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "처리 중..." : "예약 요청하기"}
                </button>
                <div className="text-[13px] text-[#717171] text-center space-y-1">
                  <p className="mb-0">호스트가 승인하기 전까지 요금이 청구되지 않습니다.</p>
                  <p className="mb-0">승인 후 이메일로 받은 결제 링크에서 결제하면 예약이 확정됩니다.</p>
                </div>
              </div>
            </div>
          </div>
      </form>
    </div>
  );
}
