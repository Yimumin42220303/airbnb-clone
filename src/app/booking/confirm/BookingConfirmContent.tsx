"use client";

import { useState, useRef, useCallback } from "react";
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
import { useCurrency } from "@/components/currency/CurrencyProvider";
import { FormFieldWithError, FormFieldGroupWithError } from "@/components/ui/FormFieldWithError";
import { cloudinaryLoader } from "@/lib/cloudinary-loader";
import { trackMetaSchedule } from "@/lib/meta-pixel";
import Ga4BeginCheckout from "@/components/analytics/Ga4BeginCheckout";
import RefundSchedule from "@/components/booking/RefundSchedule";
import SafePaymentMarks from "@/components/booking/SafePaymentMarks";
import BookingAftercareTimeline from "@/components/booking/BookingAftercareTimeline";

/** HH:mm → "오전 10:00시" / "오후 3:00시" 형태로 표시 (예약 정보 문구용) */
function formatTimeLabel(timeStr: string): string {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  const hour = parseInt(match[1], 10);
  const min = match[2];
  if (hour >= 12) {
    const h = hour === 12 ? 12 : hour - 12;
    return `오후 ${h}:${min}시`;
  }
  return `오전 ${hour}:${min}시`;
}

type Props = {
  listingId: string;
  listingTitle: string;
  listingLocation: string;
  listingImageUrl: string;
  pricePerNight: number;
  checkIn: string;
  checkOut: string;
  /** 숙소에 설정된 체크인 시간 (HH:mm). 없으면 기본 문구 표시 */
  checkInTime?: string | null;
  /** 숙소에 설정된 체크아웃 시간 (HH:mm). 없으면 기본 문구 표시 */
  checkOutTime?: string | null;
  guests: number;
  nights: number;
  totalPrice: number;
  userEmail?: string | null;
  cancellationPolicy?: string;
  instantBooking?: boolean;
};

export default function BookingConfirmContent({
  listingId,
  listingTitle,
  listingLocation,
  listingImageUrl,
  pricePerNight,
  checkIn,
  checkOut,
  checkInTime,
  checkOutTime,
  guests,
  nights,
  totalPrice,
  userEmail,
  cancellationPolicy = "flexible",
  instantBooking = false,
}: Props) {
  const checkInTimeLabel = checkInTime?.trim()
    ? `${formatTimeLabel(checkInTime)} 이후`
    : "오후 4:00시 이후";
  const checkOutTimeLabel = checkOutTime?.trim()
    ? `${formatTimeLabel(checkOutTime)} 이전`
    : "오전 10:00시 이전";
  const { formatForGuest } = useCurrency();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formAlert, setFormAlert] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const submitSectionRef = useRef<HTMLDivElement>(null);
  const defaultEmail = userEmail ?? "";
  const [form, setForm] = useState({
    fullName: "",
    email: defaultEmail,
    phonePart1: "",
    phonePart2: "",
    phonePart3: "",
    specialRequests: "",
  });
  const phoneRef1 = useRef<HTMLInputElement>(null);
  const phoneRef2 = useRef<HTMLInputElement>(null);
  const phoneRef3 = useRef<HTMLInputElement>(null);

  const digitsOnly = useCallback((v: string) => v.replace(/\D/g, ""), []);

  function scrollToFirstInvalidField() {
    const first =
      document.getElementById("booking-fullName") ??
      document.getElementById("booking-email") ??
      document.getElementById("booking-phone");
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (first instanceof HTMLInputElement) {
      first.focus({ preventScroll: true });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFormAlert("");
    setFullNameError("");
    setEmailError("");
    setPhoneError("");
    let hasClientError = false;
    if (!form.fullName?.trim()) {
      setFullNameError("예약자 성함을 입력해 주세요.");
      hasClientError = true;
    }
    if (!form.email?.trim()) {
      setEmailError("이메일을 입력해 주세요.");
      hasClientError = true;
    }
    if (
      form.phonePart1.length !== 3 ||
      form.phonePart2.length !== 4 ||
      form.phonePart3.length !== 4
    ) {
      setPhoneError("긴급연락용 전화번호를 올바르게 입력해 주세요. (010-1234-5678)");
      hasClientError = true;
    }
    if (hasClientError) {
      setFormAlert("예약자 정보를 모두 입력해 주세요.");
      scrollToFirstInvalidField();
      submitSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    const phone = [form.phonePart1, form.phonePart2, form.phonePart3].join("-");
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
          guestName: form.fullName?.trim() || undefined,
          guestPhone: phone,
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

      trackMetaSchedule({
        content_ids: [listingId],
        value: totalPrice,
        currency: "JPY",
      });

      if (instantBooking) {
        router.push(`/booking/${data.id}/pay`);
        return;
      }
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
        return;
      }
      router.push("/booking/requested");
    } catch {
      setError("예약 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Ga4BeginCheckout
        listingId={listingId}
        itemName={listingTitle}
        itemCategory={listingLocation}
        totalPriceJpy={totalPrice}
        nights={nights}
      />
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
          {instantBooking ? "예약 및 결제" : "예약 확인"}
        </h1>
        <p className="text-[15px] text-[#717171]">
          {instantBooking
            ? "예약 정보를 확인하고 결제를 진행해 주세요."
            : "예약 정보를 확인하고 요청을 보내주세요."}
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
                    loader={cloudinaryLoader}
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
                  <p className="text-[13px] text-[#717171]">{checkInTimeLabel}</p>
                </div>
                <div>
                  <p className="text-[12px] text-[#717171] mb-0.5">체크아웃</p>
                  <p className="text-[15px] font-medium text-[#222]">
                    {formatDateKR(checkOut)}
                  </p>
                  <p className="text-[13px] text-[#717171]">{checkOutTimeLabel}</p>
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
                <FormFieldWithError
                  id="booking-fullName"
                  label="예약자 성함 *"
                  error={fullNameError}
                >
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, fullName: e.target.value }));
                      setFullNameError("");
                    }}
                    className="px-3 py-2.5 border border-[#ebebeb] rounded-lg text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23]"
                    placeholder="홍길동"
                  />
                </FormFieldWithError>
                <FormFieldWithError
                  id="booking-email"
                  label="이메일 *"
                  error={emailError}
                >
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, email: e.target.value }));
                      setEmailError("");
                    }}
                    className="px-3 py-2.5 border border-[#ebebeb] rounded-lg text-[15px] text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23]"
                    placeholder="example@email.com"
                  />
                </FormFieldWithError>
                <FormFieldGroupWithError
                  id="booking-phone"
                  label="휴대폰번호(예약자본인의 번호를 입력해주세요)*"
                  error={phoneError}
                >
                  <div className="flex items-center gap-1">
                    <input
                      ref={phoneRef1}
                      type="tel"
                      inputMode="numeric"
                      maxLength={3}
                      value={form.phonePart1}
                      aria-invalid={!!phoneError}
                      aria-describedby={phoneError ? "booking-phone-error" : undefined}
                      onChange={(e) => {
                        const v = digitsOnly(e.target.value).slice(0, 3);
                        setForm((f) => ({ ...f, phonePart1: v }));
                        setPhoneError("");
                        if (v.length === 3) phoneRef2.current?.focus();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const raw = digitsOnly(
                          e.clipboardData?.getData("text") ?? ""
                        );
                        const p1 = raw.slice(0, 3);
                        const p2 = raw.slice(3, 7);
                        const p3 = raw.slice(7, 11);
                        setForm((f) => ({
                          ...f,
                          phonePart1: p1,
                          phonePart2: p2,
                          phonePart3: p3,
                        }));
                        setPhoneError("");
                        if (p3.length === 4) phoneRef3.current?.focus();
                        else if (p2.length === 4) phoneRef3.current?.focus();
                        else if (p1.length === 3) phoneRef2.current?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          form.phonePart1.length === 0
                        ) {
                          e.preventDefault();
                          phoneRef1.current?.focus();
                        }
                      }}
                      className={`w-[72px] px-2 py-2.5 border rounded-lg text-[15px] text-center text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23] ${phoneError ? "border-[#D74132]" : "border-[#ebebeb]"}`}
                      placeholder="010"
                      aria-label="전화번호 앞 3자리"
                    />
                    <span className="text-[#717171] text-[15px]">-</span>
                    <input
                      ref={phoneRef2}
                      type="tel"
                      inputMode="numeric"
                      maxLength={4}
                      value={form.phonePart2}
                      onChange={(e) => {
                        const v = digitsOnly(e.target.value).slice(0, 4);
                        setForm((f) => ({ ...f, phonePart2: v }));
                        setPhoneError("");
                        if (v.length === 4) phoneRef3.current?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          form.phonePart2.length === 0
                        ) {
                          e.preventDefault();
                          phoneRef1.current?.focus();
                        }
                      }}
                      className={`w-[72px] px-2 py-2.5 border rounded-lg text-[15px] text-center text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23] ${phoneError ? "border-[#D74132]" : "border-[#ebebeb]"}`}
                      placeholder="1234"
                      aria-label="전화번호 중간 4자리"
                    />
                    <span className="text-[#717171] text-[15px]">-</span>
                    <input
                      ref={phoneRef3}
                      type="tel"
                      inputMode="numeric"
                      maxLength={4}
                      value={form.phonePart3}
                      onChange={(e) => {
                        const v = digitsOnly(e.target.value).slice(0, 4);
                        setForm((f) => ({ ...f, phonePart3: v }));
                        setPhoneError("");
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Backspace" &&
                          form.phonePart3.length === 0
                        ) {
                          e.preventDefault();
                          phoneRef2.current?.focus();
                        }
                      }}
                      className={`w-[72px] px-2 py-2.5 border rounded-lg text-[15px] text-center text-[#222] focus:outline-none focus:ring-2 focus:ring-[#E31C23] focus:border-[#E31C23] ${phoneError ? "border-[#D74132]" : "border-[#ebebeb]"}`}
                      placeholder="5678"
                      aria-label="전화번호 뒤 4자리"
                    />
                  </div>
                </FormFieldGroupWithError>
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

            {/* 취소·환불 일정 (구체 날짜) */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-6 border-b border-[#ebebeb]">
                <h2 className="text-[17px] font-semibold text-[#222] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#717171]" />
                  취소·환불 정책
                </h2>
              </div>
              <div className="p-6">
                <RefundSchedule
                  policy={cancellationPolicy}
                  checkIn={checkIn}
                  variant="full"
                />
              </div>
            </div>

            {/* 결제 후 안내 흐름 */}
            <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
              <BookingAftercareTimeline phase="pre_payment" />
            </div>
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
                      {formatForGuest(pricePerNight)} × {nights}박
                    </span>
                    <span>{formatForGuest(totalPrice)}</span>
                  </div>
                  <div className="pt-3 border-t border-[#ebebeb] flex justify-between items-center">
                    <span className="text-[15px] font-medium text-[#222]">
                      총 요금 (수수료,세금 전부포함)
                    </span>
                    <span className="text-[17px] font-bold text-[#222]">
                      {formatForGuest(totalPrice)}
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
                  {instantBooking ? (
                    <>
                      <p className="text-[13px] font-medium text-[#E31C23] mb-2">
                        이 숙소는 자동확정 숙소입니다
                      </p>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E31C23] text-white flex items-center justify-center text-[13px] font-bold">1</div>
                        <div>
                          <p className="text-[14px] font-medium text-[#222]">예약 및 결제</p>
                          <p className="text-[13px] text-[#717171]">예약 정보 확인 후 결제를 진행합니다</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E31C23] text-white flex items-center justify-center text-[13px] font-bold">2</div>
                        <div>
                          <p className="text-[14px] font-medium text-[#222]">예약 확정</p>
                          <p className="text-[13px] text-[#717171]">
                            결제 완료 즉시 예약이 확정됩니다. 체크인 안내는 확정 후 순차 발송됩니다.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[13px] font-medium text-[#E31C23] mb-2">
                        이 숙소는 승인형 예약입니다
                      </p>
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
                          <p className="text-[13px] text-[#717171]">
                            호스트가 24시간 이내 승인/거절합니다. 승인 시 도쿄민박이 이메일로 결제 안내를 보냅니다.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E31C23] text-white flex items-center justify-center text-[13px] font-bold">3</div>
                        <div>
                          <p className="text-[14px] font-medium text-[#222]">결제 완료</p>
                          <p className="text-[13px] text-[#717171]">
                            승인 후 24시간 이내 결제 시 예약 확정. 기한 내 미결제 시 자동 취소됩니다.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
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
                  {instantBooking ? (
                    <>
                      <li>예약 요청 후 결제 페이지로 이동합니다</li>
                      <li>결제 완료 시 예약이 즉시 확정됩니다</li>
                      <li>취소·환불 정책에 따라 취소 및 환불이 가능합니다</li>
                    </>
                  ) : (
                    <>
                      <li>지금은 결제가 진행되지 않습니다</li>
                      <li>호스트 승인 후 결제 안내 이메일이 발송됩니다</li>
                      <li>승인 전까지 무료 취소가 가능합니다</li>
                    </>
                  )}
                </ul>
              </div>

              {/* 안전결제 */}
              <div className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                <SafePaymentMarks size="sm" />
              </div>

              {/* 예약 요청하기 */}
              <div
                ref={submitSectionRef}
                className="bg-white rounded-2xl border border-[#ebebeb] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 space-y-4 scroll-mt-28"
              >
                {(formAlert || error) && (
                  <p className="text-[14px] text-[#E31C23] font-medium" role="alert">
                    {formAlert || error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full text-[16px] font-semibold text-white bg-[#E31C23] hover:bg-[#c91820] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "처리 중..." : instantBooking ? "예약하기" : "예약 요청하기"}
                </button>
                <div className="text-[13px] text-[#717171] text-center space-y-1">
                  {instantBooking ? (
                    <>
                      <p className="mb-0">결제가 완료되면 예약이 즉시 확정됩니다.</p>
                    </>
                  ) : (
                    <>
                      <p className="mb-0">호스트가 승인하기 전까지 요금이 청구되지 않습니다.</p>
                      <p className="mb-0">승인 후 이메일로 받은 결제 링크에서 결제하면 예약이 확정됩니다.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
      </form>
    </div>
    </>
  );
}
