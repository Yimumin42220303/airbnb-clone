"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import ListingBookingCalendar from "@/components/listing/ListingBookingCalendar";

const CALENDAR_WIDTH = 560;
const CALENDAR_MARGIN = 8;
/** 캘린더 박스 대략 높이 (스크롤 없이 전체 표시용) */
const CALENDAR_APPROX_HEIGHT = 440;

type BookingFormProps = {
  listingId: string;
  pricePerNight: number;
  cleaningFee: number;
  maxGuests: number;
  listingTitle: string;
  /** 가격 미리보기 계산 시 (박수/총액) 정보를 상위 컴포넌트로 전달 */
  onPriceChange?: (summary: { nights: number; totalPrice: number } | null) => void;
  /** 검색에서 전달된 초기 체크인 날짜 (YYYY-MM-DD) */
  initialCheckIn?: string;
  /** 검색에서 전달된 초기 체크아웃 날짜 (YYYY-MM-DD) */
  initialCheckOut?: string;
  /** 검색에서 전달된 초기 게스트 수 */
  initialGuests?: number;
};

type PriceResult = {
  totalPrice: number;
  allAvailable: boolean;
  cleaningFee?: number;
  nights: { date: string; pricePerNight: number; available: boolean }[];
};

export default function BookingForm({
  listingId,
  pricePerNight,
  cleaningFee,
  maxGuests,
  listingTitle,
  onPriceChange,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: BookingFormProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const initAdults = Math.min(initialGuests ?? 1, maxGuests);
  const [guests, setGuests] = useState(initAdults);
  const [adults, setAdults] = useState(initAdults);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [guestSelectorOpen, setGuestSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [blockedDateKeys, setBlockedDateKeys] = useState<string[]>([]);
  const [checkoutOnlyDateKeys, setCheckoutOnlyDateKeys] = useState<string[]>([]);
  const [blockedDatesError, setBlockedDatesError] = useState(false);
  const calendarWrapRef = useRef<HTMLDivElement>(null);
  const guestSelectorRef = useRef<HTMLDivElement>(null);
  const [calendarPosition, setCalendarPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!calendarOpen || !calendarWrapRef.current) {
      setCalendarPosition(null);
      return;
    }
    const rect = calendarWrapRef.current.getBoundingClientRect();
    const width = Math.min(
      CALENDAR_WIDTH,
      typeof window !== "undefined" ? window.innerWidth - 32 : CALENDAR_WIDTH
    );
    const left = Math.max(
      16,
      typeof window !== "undefined" ? rect.right - width : rect.left
    );
    const win = typeof window !== "undefined" ? window : null;
    const spaceBelow = win ? win.innerHeight - rect.bottom - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;
    const spaceAbove = win ? rect.top - CALENDAR_MARGIN - 16 : CALENDAR_APPROX_HEIGHT;
    const top =
      win && spaceBelow < CALENDAR_APPROX_HEIGHT && spaceAbove >= CALENDAR_APPROX_HEIGHT
        ? rect.top - CALENDAR_APPROX_HEIGHT - CALENDAR_MARGIN
        : rect.bottom + CALENDAR_MARGIN;
    setCalendarPosition({ top, left, width });
  }, [calendarOpen]);

  useEffect(() => {
    if (!calendarOpen) return;
    function handleClickBackdrop(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.hasAttribute("data-calendar-backdrop")) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickBackdrop);
    return () => document.removeEventListener("mousedown", handleClickBackdrop);
  }, [calendarOpen]);

  const fetchBlockedDates = useCallback(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 13);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    setBlockedDatesError(false);
    fetch(
      `/api/listings/${listingId}/blocked-dates?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          if (Array.isArray(data.dateKeys)) setBlockedDateKeys(data.dateKeys);
          if (Array.isArray(data.checkoutOnlyDateKeys)) setCheckoutOnlyDateKeys(data.checkoutOnlyDateKeys);
          setBlockedDatesError(false);
        } else {
          setBlockedDatesError(true);
        }
      })
      .catch(() => {
        setBlockedDatesError(true);
      });
  }, [listingId]);

  useEffect(() => {
    fetchBlockedDates();
  }, [fetchBlockedDates]);

  useEffect(() => {
    if (calendarOpen) {
      fetchBlockedDates();
    }
  }, [calendarOpen, fetchBlockedDates]);

  // 인원 선택 패널 바깥 클릭 시 닫힘
  useEffect(() => {
    if (!guestSelectorOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!guestSelectorRef.current || !target) return;
      if (!guestSelectorRef.current.contains(target)) {
        setGuestSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [guestSelectorOpen]);

  // 인원 패널의 성인/어린이/유아 합계를 guests 상태와 동기화
  useEffect(() => {
    const total = adults + children + infants;
    setGuests(total > 0 ? total : 1);
  }, [adults, children, infants]);

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setPriceResult(null);
      onPriceChange?.(null);
      return;
    }
    let cancelled = false;
    setPriceLoading(true);
    fetch(
      `/api/listings/${listingId}/price?checkIn=${encodeURIComponent(
        checkIn
      )}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.error) {
          setPriceResult(data);
          const nightsCount = Array.isArray(data.nights) ? data.nights.length : 0;
          if (nightsCount > 0 && typeof data.totalPrice === "number") {
            onPriceChange?.({ nights: nightsCount, totalPrice: data.totalPrice });
          } else {
            onPriceChange?.(null);
          }
        } else if (!cancelled) {
          setPriceResult(null);
          onPriceChange?.(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriceResult(null);
          onPriceChange?.(null);
        }
      })
      .finally(() => {
        if (!cancelled) setPriceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, checkIn, checkOut, guests, onPriceChange]);

  const nights = priceResult?.nights?.length ?? 0;
  const totalPrice = priceResult?.totalPrice ?? 0;
  const allAvailable = priceResult?.allAvailable ?? true;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!checkIn || !checkOut) {
      setError("체크인·체크아웃 날짜를 선택해 주세요.");
      return;
    }
    if (checkOut <= checkIn) {
      setError("체크아웃은 체크인 다음 날 이후로 선택해 주세요.");
      return;
    }
    if (guests < 1 || guests > maxGuests) {
      setError(`인원은 1~${maxGuests}명으로 선택해 주세요.`);
      return;
    }
    if (nights < 1 || !allAvailable) {
      setError("선택한 날짜 중 예약 불가한 날이 있습니다.");
      return;
    }
    const params = new URLSearchParams({
      listingId,
      checkIn,
      checkOut,
      guests: String(guests),
    });
    router.push(`/booking/confirm?${params.toString()}`);
  }

  function formatDisplayDate(iso: string) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${y}년 ${Number(m)}월 ${Number(d)}일`;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-airbnb"
    >
      <div className="mb-4 relative" ref={calendarWrapRef}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="flex flex-col gap-1 text-left px-3 py-2 border border-[#ebebeb] rounded-airbnb hover:border-[#b0b0b0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31C23] focus-visible:border-[#E31C23]"
          >
            <span className="text-[12px] text-[#717171]">체크인</span>
            <span className="text-[14px] text-[#222]">
              {checkIn ? formatDisplayDate(checkIn) : "날짜 추가"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="flex flex-col gap-1 text-left px-3 py-2 border border-[#ebebeb] rounded-airbnb hover:border-[#b0b0b0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E31C23] focus-visible:border-[#E31C23]"
          >
            <span className="text-[12px] text-[#717171]">체크아웃</span>
            <span className="text-[14px] text-[#222]">
              {checkOut ? formatDisplayDate(checkOut) : "날짜 추가"}
            </span>
          </button>
        </div>
        {blockedDatesError && (
          <p className="text-[12px] text-amber-600 mt-1.5">
            예약 가능 날짜를 불러오지 못했습니다.{" "}
            <button type="button" onClick={fetchBlockedDates} className="underline hover:text-amber-800">다시 시도</button>
          </p>
        )}
        {calendarOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              <div
                data-calendar-backdrop
                className="fixed inset-0 z-[100] bg-black/30"
                role="dialog"
                aria-modal="true"
                aria-label="체크인·체크아웃 날짜 선택"
              />
              {calendarPosition && (
                <div
                  className="fixed z-[101] bg-white rounded-xl shadow-[0_6px_24px_rgba(0,0,0,0.15)]"
                  style={{
                    top: calendarPosition.top,
                    left: calendarPosition.left,
                    width: calendarPosition.width,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ListingBookingCalendar
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onCheckInChange={setCheckIn}
                    onCheckOutChange={setCheckOut}
                    onComplete={() => setCalendarOpen(false)}
                    blockedDateKeys={blockedDateKeys}
                    checkoutOnlyDateKeys={checkoutOnlyDateKeys}
                  />
                </div>
              )}
            </>,
            document.body
          )}
      </div>

      {/* 인원 선택: 에어비앤비 스타일 패널 */}
      <div className="mb-4 relative" ref={guestSelectorRef}>
        <button
          type="button"
          onClick={() => setGuestSelectorOpen((open) => !open)}
          className="w-full flex items-center justify-between px-3 py-2 border border-minbak-light-gray rounded-airbnb text-airbnb-body text-minbak-black focus:outline-none focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:border-minbak-primary"
        >
          <div className="flex flex-col text-left">
            <span className="text-[12px] text-[#717171]">인원</span>
            <span className="text-[14px] text-[#222]">
              게스트 {guests}명
            </span>
          </div>
          <span className="text-[20px] leading-none text-[#717171]">
            {guestSelectorOpen ? "▴" : "▾"}
          </span>
        </button>

        {guestSelectorOpen && (
          <div className="absolute z-[120] mt-2 w-full rounded-2xl border border-airbnb-light-gray bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-4 space-y-3">
            {[
              {
                label: "성인",
                desc: "13세 이상",
                value: adults,
                setValue: setAdults,
              },
              {
                label: "어린이",
                desc: "2~12세",
                value: children,
                setValue: setChildren,
              },
              {
                label: "유아",
                desc: "2세 미만",
                value: infants,
                setValue: setInfants,
              },
            ].map((row) => {
              const totalWithoutThis =
                guests - row.value; // 현재 값 제외한 합
              const canIncrement =
                totalWithoutThis + row.value + 1 <= maxGuests;
              const canDecrement =
                row.label === "성인"
                  ? row.value > 1 // 성인은 최소 1명
                  : row.value > 0;
              return (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-airbnb-body text-airbnb-black">
                      {row.label}
                    </span>
                    <span className="text-airbnb-caption text-airbnb-gray">
                      {row.desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        canDecrement &&
                        row.setValue((v) =>
                          row.label === "성인" ? Math.max(1, v - 1) : Math.max(0, v - 1)
                        )
                      }
                      disabled={!canDecrement}
                      className={`w-8 h-8 flex items-center justify-center rounded-full border text-[18px] ${
                        canDecrement
                          ? "border-airbnb-light-gray text-airbnb-black hover:bg-airbnb-bg"
                          : "border-airbnb-light-gray text-airbnb-light-gray cursor-not-allowed"
                      }`}
                      aria-label={`${row.label} 감소`}
                    >
                      −
                    </button>
                    <span className="min-w-[20px] text-center text-airbnb-body">
                      {row.value}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        canIncrement &&
                        row.setValue((v) => v + 1)
                      }
                      disabled={!canIncrement}
                      className={`w-8 h-8 flex items-center justify-center rounded-full border text-[18px] ${
                        canIncrement
                          ? "border-airbnb-light-gray text-airbnb-black hover:bg-airbnb-bg"
                          : "border-airbnb-light-gray text-airbnb-light-gray cursor-not-allowed"
                      }`}
                      aria-label={`${row.label} 증가`}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setGuestSelectorOpen(false)}
              className="mt-2 ml-auto px-3 py-1.5 text-airbnb-caption text-airbnb-black hover:underline"
            >
              닫기
            </button>
          </div>
        )}
      </div>

      {priceLoading && checkIn && checkOut && (
        <div className="border-t border-airbnb-light-gray pt-4 mb-4">
          <div className="flex items-center gap-2 text-airbnb-body text-airbnb-gray">
            <span className="inline-block w-4 h-4 border-2 border-airbnb-gray border-t-transparent rounded-full animate-spin" />
            요금 계산 중...
          </div>
        </div>
      )}

      {!priceLoading && nights > 0 && priceResult && (
        <div className="border-t border-airbnb-light-gray pt-4 space-y-2 mb-4">
          {(() => {
            const perNight = nights > 0 ? Math.floor(totalPrice / nights) : 0;
            return (
              <div className="flex justify-between text-airbnb-body text-airbnb-black">
                <span>
                  ₩{perNight.toLocaleString()} x {nights}박
                </span>
                <span>₩{totalPrice.toLocaleString()}</span>
              </div>
            );
          })()}
          <div className="flex justify-between text-lg font-semibold text-neutral-900 pt-3 border-t border-neutral-200">
            <span>총 합계</span>
            <span>₩{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-airbnb-body text-airbnb-red mb-3" role="alert">
          {error}
        </p>
      )}

      {nights > 0 && !allAvailable && (
        <p className="text-airbnb-body text-airbnb-red mb-3" role="alert">
          선택한 날짜 중 예약 불가한 날이 있습니다.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        rounded="full"
        className="w-full mt-1"
        disabled={nights < 1 || !allAvailable}
      >
        예약하기
      </Button>
    </form>
  );
}
