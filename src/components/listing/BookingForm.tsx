"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
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
  maxGuests: number;
  listingTitle: string;
};

type PriceResult = {
  totalPrice: number;
  allAvailable: boolean;
  nights: { date: string; pricePerNight: number; available: boolean }[];
};

export default function BookingForm({
  listingId,
  pricePerNight,
  maxGuests,
  listingTitle,
}: BookingFormProps) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null);
  const [blockedDateKeys, setBlockedDateKeys] = useState<string[]>([]);
  const calendarWrapRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setMonth(to.getMonth() + 13);
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);
    fetch(
      `/api/listings/${listingId}/blocked-dates?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.error && Array.isArray(data.dateKeys)) setBlockedDateKeys(data.dateKeys);
      })
      .catch(() => {});
  }, [listingId]);

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setPriceResult(null);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/listings/${listingId}/price?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.error) setPriceResult(data);
        else if (!cancelled) setPriceResult(null);
      })
      .catch(() => {
        if (!cancelled) setPriceResult(null);
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, checkIn, checkOut]);

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
                  />
                </div>
              )}
            </>,
            document.body
          )}
      </div>

      <label className="flex flex-col gap-1 mb-4">
        <span className="text-airbnb-caption text-airbnb-gray">인원</span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="px-3 py-2 border border-minbak-light-gray rounded-airbnb text-airbnb-body text-minbak-black focus:outline-none focus-visible:ring-2 focus-visible:ring-minbak-primary focus-visible:border-minbak-primary"
        >
          {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}명
            </option>
          ))}
        </select>
      </label>

      {nights > 0 && priceResult && (
        <div className="border-t border-airbnb-light-gray pt-4 space-y-2 mb-4">
          {priceResult.nights.some((n) => n.pricePerNight !== pricePerNight) ? (
            <div className="flex justify-between text-airbnb-body text-airbnb-black">
              <span>날짜별 요금 적용 · {nights}박</span>
              <span>₩{totalPrice.toLocaleString()}</span>
            </div>
          ) : (
            <div className="flex justify-between text-airbnb-body text-airbnb-black">
              <span>₩{pricePerNight.toLocaleString()} x {nights}박</span>
              <span>₩{totalPrice.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-airbnb-body font-semibold text-airbnb-black pt-2 border-t border-airbnb-light-gray">
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
