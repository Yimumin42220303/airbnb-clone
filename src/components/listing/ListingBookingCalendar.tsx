"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toISODateString } from "@/lib/date-utils";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";
import type { HostTranslationKey } from "@/lib/host-i18n";

const WEEKDAY_KEYS: HostTranslationKey[] = [
  "calendar.weekday.sun",
  "calendar.weekday.mon",
  "calendar.weekday.tue",
  "calendar.weekday.wed",
  "calendar.weekday.thu",
  "calendar.weekday.fri",
  "calendar.weekday.sat",
];

function toDateOnly(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

function isBefore(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() < toDateOnly(b).getTime();
}
function isAfter(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() > toDateOnly(b).getTime();
}
function isSameDay(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() === toDateOnly(b).getTime();
}
function isWithinInterval(day: Date, start: Date, end: Date): boolean {
  const t = toDateOnly(day).getTime();
  const s = toDateOnly(start).getTime();
  const e = toDateOnly(end).getTime();
  return t > s && t < e;
}

/** 체크인(start) ~ 해당일(day)까지 숙박 수. 27→28 = 1박, 27→29 = 2박 */
function nightsBetween(start: Date, day: Date): number {
  const ms = toDateOnly(day).getTime() - toDateOnly(start).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function eachDayOfMonth(month: Date): (Date | null)[] {
  const start = startOfMonth(month);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const firstDay = start.getDay();
  const paddingStart = Array.from({ length: firstDay }, () => null);
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  const totalSlots = Math.ceil((paddingStart.length + days.length) / 7) * 7;
  const paddingEnd = Array.from(
    { length: totalSlots - paddingStart.length - days.length },
    () => null
  );
  return [...paddingStart, ...days, ...paddingEnd];
}

const CELL_SIZE = 36;
const CIRCLE_SIZE = 32;
const CELL_SIZE_MOBILE = 26;
const CIRCLE_SIZE_MOBILE = 24;

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

type Props = {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (iso: string) => void;
  onCheckOutChange: (iso: string) => void;
  /** 팝오버(모바일 포털)일 때 본문 스크롤 + 하단 버튼 고정 */
  variant?: "inline" | "modal";
  /** 캘린더를 팝오버로 쓸 때, 완료/닫기 버튼 클릭 시 호출 */
  onComplete?: () => void;
  /** 예약 불가 날짜 (YYYY-MM-DD). */
  blockedDateKeys?: string[];
  /** 체크아웃만 가능한 날짜 (YYYY-MM-DD). */
  checkoutOnlyDateKeys?: string[];
  /** 최소 숙박 일수. 2 이상일 때 체크인 선택 후 "최소 N박" 표시 */
  minStayNights?: number | null;
};

function MonthBlock({
  month,
  today,
  maxDate,
  start,
  end,
  onDayClick,
  blockedDateKeys = [],
  checkoutOnlyDateKeys = [],
  selectingCheckout = false,
  minStayNights,
  weekdays,
  t,
  dateLocale,
  cellSize = CELL_SIZE,
  circleSize = CIRCLE_SIZE,
}: {
  month: Date;
  today: Date;
  maxDate: Date;
  start: Date | null;
  end: Date | null;
  onDayClick: (day: Date) => void;
  blockedDateKeys?: string[];
  checkoutOnlyDateKeys?: string[];
  selectingCheckout?: boolean;
  minStayNights?: number | null;
  weekdays: string[];
  t: (key: HostTranslationKey, params?: Record<string, string | number>) => string;
  dateLocale: string;
  cellSize?: number;
  circleSize?: number;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = useMemo(
    () => eachDayOfMonth(new Date(year, monthIndex, 1)),
    [year, monthIndex]
  );
  const blockedSet = useMemo(() => new Set(blockedDateKeys), [blockedDateKeys]);
  const checkoutOnlySet = useMemo(() => new Set(checkoutOnlyDateKeys), [checkoutOnlyDateKeys]);

  const isDisabled = (day: Date) =>
    isBefore(day, today) ||
    isAfter(day, maxDate) ||
    blockedSet.has(toISODateString(day));

  const isCheckoutOnly = (day: Date) => checkoutOnlySet.has(toISODateString(day));

  const monthLabel = month.toLocaleDateString(dateLocale, { year: "numeric", month: "long" });

  return (
    <div className="w-full md:flex-1 md:min-w-[264px] md:shrink-0">
      <p className="text-left mb-1 md:mb-2 text-[13px] md:text-[15px] font-semibold text-[#222]">
        {monthLabel}
      </p>
      <div className="grid gap-0.5 mb-0.5 md:mb-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {weekdays.map((day, i) => (
          <div
            key={day}
            className="py-0.5 md:py-1 text-center text-[11px] md:text-[12px] font-medium min-w-0"
            style={{
              color: i === 0 ? "#D74132" : i === 6 ? "#4A90E2" : "#717171",
            }}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid gap-0.5 text-[12px] md:text-[14px]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {days.map((day, i) => {
          if (!day)
            return <div key={`e-${i}`} style={{ height: cellSize }} />;
          const disabled = isDisabled(day);
          const checkoutOnly = isCheckoutOnly(day);
          const isStart = start && isSameDay(day, start);
          const isEnd = end && isSameDay(day, end);
          const showMinStayOnCheckIn = selectingCheckout && isStart && minStayNights != null && minStayNights > 1;
          const inRange =
            start &&
            end &&
            isWithinInterval(day, start, end) &&
            !isStart &&
            !isEnd;

          // 체크아웃 선택 시: 체크인 이전/당일은 선택 불가 (현실적으로 체크아웃은 체크인 이후여야 함)
          const isBeforeOrSameAsCheckIn =
            selectingCheckout && start && (isBefore(day, start) || isSameDay(day, start));

          // 체크아웃 선택 시: 최소 숙박 일수 미만이 되는 날은 선택 불가 (예: 2박이면 체크인+1일은 선택 불가)
          const isFewerThanMinNights =
            selectingCheckout &&
            start &&
            minStayNights != null &&
            minStayNights > 1 &&
            nightsBetween(start, day) < minStayNights;

          const canClick =
            !isBeforeOrSameAsCheckIn &&
            !isFewerThanMinNights &&
            (!disabled || (selectingCheckout && checkoutOnly));
          const isCheckoutOnlySelectable = selectingCheckout && checkoutOnly;
          const isFullyDisabled =
            (disabled || (isBeforeOrSameAsCheckIn && !isStart) || isFewerThanMinNights) && !canClick;
          // 체크아웃 전용 날짜는 선택 전/후 모두 은은한 회색 유지 (체크인 선택 시 갑자기 검은색으로 변하는 위화감 방지)
          const isCheckoutOnlySubdued = disabled && isCheckoutOnlySelectable;
          // 체크인 미선택 상태에서도 체크아웃만 가능한 날짜는 숫자색 #3d3d3d 로 통일
          const isCheckoutOnlyDay = checkoutOnly && !isStart && !isEnd;

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={!canClick ? -1 : 0}
              onClick={() => canClick && onDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (canClick) onDayClick(day);
                }
              }}
              className="relative flex items-center justify-center cursor-pointer select-none box-border rounded-full group"
              style={{
                height: cellSize,
                opacity: isStart || isEnd ? 1 : isFullyDisabled ? 0.35 : isCheckoutOnlySubdued ? 0.75 : 1,
                cursor: canClick ? "pointer" : "not-allowed",
                color: isStart || isEnd ? "#fff" : isFullyDisabled ? "#B0B0B0" : isCheckoutOnlyDay ? "#3d3d3d" : "#222",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {showMinStayOnCheckIn && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[12px] font-medium text-[#222] bg-white border border-[#ebebeb] rounded-lg shadow-sm whitespace-nowrap z-10">
                  {t("calendar.minNightsOnly", { nights: minStayNights! })}
                </span>
              )}
              {checkoutOnly && !isStart && !isEnd && (
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1.5 text-[12px] font-medium text-[#222] bg-white border border-[#ebebeb] rounded-lg shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                  style={{ borderBottom: "2px solid #E31C23" }}
                >
                  {t("calendar.checkoutOnly")}
                </span>
              )}
              {(inRange || isStart || isEnd) && (
                <div
                  className="absolute top-0 bottom-0 bg-[#F7F7F7] z-0 rounded-none"
                  style={{
                    left: isStart ? "50%" : 0,
                    right: isEnd ? "50%" : 0,
                  }}
                />
              )}
              <div
                className="absolute rounded-full flex items-center justify-center z-[1]"
                style={{
                  width: circleSize,
                  height: circleSize,
                  background: isStart
                    ? "#E31C23"
                    : isEnd
                      ? "#fff"
                      : "transparent",
                  border: isEnd ? "2px solid #E31C23" : "none",
                  color: isStart ? "#fff" : isEnd ? "#E31C23" : isCheckoutOnlyDay ? "#3d3d3d" : undefined,
                }}
              >
                <span style={isCheckoutOnlyDay ? { color: "#3d3d3d" } : undefined}>
                  {day.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ListingBookingCalendar({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  variant = "inline",
  onComplete,
  blockedDateKeys = [],
  checkoutOnlyDateKeys = [],
  minStayNights,
}: Props) {
  const isModal = variant === "modal";
  const isMobile = useIsMobile();
  const { t, locale } = useHostTranslations();
  const dateLocale = locale === "ja" ? "ja-JP" : "ko-KR";
  const weekdays = useMemo(
    () => WEEKDAY_KEYS.map((key) => t(key)),
    [t]
  );
  function formatDisplayDate(iso: string) {
    if (!iso) return "";
    return new Date(iso + "T12:00:00").toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  const today = useMemo(() => toDateOnly(new Date()), []);
  const maxDate = useMemo(() => addMonths(today, 12), [today]);

  const [monthOffset, setMonthOffset] = useState(0);
  const [checkoutOnlyMessage, setCheckoutOnlyMessage] = useState(false);

  const start = checkIn
    ? toDateOnly(new Date(checkIn + "T12:00:00"))
    : null;
  const end = checkOut
    ? toDateOnly(new Date(checkOut + "T12:00:00"))
    : null;

  const months: Date[] = [
    addMonths(today, monthOffset),
    addMonths(today, monthOffset + 1),
  ];

  const blockedSet = useMemo(() => new Set(blockedDateKeys ?? []), [blockedDateKeys]);
  const checkoutOnlySet = useMemo(() => new Set(checkoutOnlyDateKeys ?? []), [checkoutOnlyDateKeys]);

  /** 다음 달 보기 가능 여부 — 클릭 핸들러와 동일 조건 */
  const canGoNext = useMemo(
    () => !isAfter(startOfMonth(addMonths(today, monthOffset + 1)), maxDate),
    [today, monthOffset, maxDate]
  );

  const selectingCheckIn = !start || (start && end);
  const selectingCheckout = !!start && !end;

  const handleDayClick = (day: Date) => {
    const dayIsCheckoutOnly = checkoutOnlySet.has(toISODateString(day));
    const isBlocked = blockedSet.has(toISODateString(day));

    if (isBefore(day, today) || isAfter(day, maxDate)) return;
    if (isBlocked && !(selectingCheckout && dayIsCheckoutOnly)) return;

    if (selectingCheckIn && dayIsCheckoutOnly) {
      setCheckoutOnlyMessage(true);
      return;
    }
    setCheckoutOnlyMessage(false);

    if (selectingCheckIn) {
      onCheckInChange(toISODateString(day));
      onCheckOutChange("");
    } else {
      if (!start || isSameDay(day, start) || isBefore(day, start)) return;
      if (
        minStayNights != null &&
        minStayNights > 1 &&
        nightsBetween(start, day) < minStayNights
      )
        return;
      onCheckOutChange(toISODateString(day));
      // 체크인·체크아웃 모두 선택됐으므로 캘린더 자동 닫기
      onComplete?.();
    }
  };

  const handleClearDates = () => {
    onCheckInChange("");
    onCheckOutChange("");
    setCheckoutOnlyMessage(false);
  };

  const goToToday = () => setMonthOffset(0);

  return (
    <div
      className={
        isModal
          ? "flex flex-col h-full min-h-0 bg-white md:pr-6"
          : "border border-[#ebebeb] rounded-xl bg-white overflow-hidden md:pr-6"
      }
    >
      {/* 헤더: 날짜 선택 + 메시지 + 체크인/체크아웃 입력 필드 */}
      <div className="flex-shrink-0 p-3 md:p-4 pb-0">
        <div className="flex justify-between items-start gap-2 md:gap-4 mb-3 md:mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] md:text-[22px] font-semibold text-[#222] mb-1">{t("calendar.title")}</h2>
            {minStayNights != null && minStayNights > 1 && (
              <p className="text-[14px] text-[#222] mb-1">{t("calendar.minNights", { nights: minStayNights })}</p>
            )}
            {checkoutOnlyMessage && (
              <p className="text-[14px] text-[#222] font-medium" style={{ borderBottom: "2px solid #E31C23" }}>
                {t("calendar.cannotCheckIn")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0 min-w-0">
            <div
              className={`flex flex-col gap-1 px-2 sm:px-3 py-2 border rounded-lg min-w-0 ${
                selectingCheckIn ? "border-[#222]" : "border-[#ebebeb]"
              }`}
            >
              <span className="text-[11px] sm:text-[12px] text-[#717171]">{t("guest.checkIn")}</span>
              <span className="text-[13px] sm:text-[14px] text-[#222] truncate">
                {checkIn ? formatDisplayDate(checkIn) : t("bookingForm.addDate")}
              </span>
            </div>
            <div
              className={`flex flex-col gap-1 px-2 sm:px-3 py-2 border rounded-lg min-w-0 ${
                !selectingCheckIn && start ? "border-[#222]" : "border-[#ebebeb]"
              }`}
            >
              <span className="text-[11px] sm:text-[12px] text-[#717171]">{t("guest.checkOut")}</span>
              <span className="text-[13px] sm:text-[14px] text-[#222] truncate">
                {checkOut ? formatDisplayDate(checkOut) : t("bookingForm.addDate")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-2 md:mb-3">
          <button
            type="button"
            onClick={goToToday}
            className="text-[12px] md:text-[13px] font-medium text-[#E31C23] hover:underline min-h-[36px] md:min-h-[44px] flex items-center md:min-h-0"
          >
            {t("calendar.today")}
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
              disabled={monthOffset === 0}
              className={`flex items-center justify-center rounded-xl min-h-[44px] min-w-[44px] shrink-0 transition-colors active:scale-[0.98] ${
                monthOffset === 0
                  ? "bg-[#e8e8e8] text-[#bdbdbd] cursor-not-allowed hover:bg-[#e8e8e8]"
                  : "bg-[#E31C23] text-white shadow-sm hover:bg-[#c91820] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31C23]"
              }`}
              aria-label={locale === "ja" ? "前月" : "이전 달"}
            >
              <ChevronLeft className="w-7 h-7" strokeWidth={2.75} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMonth = addMonths(today, monthOffset + 1);
                if (isAfter(startOfMonth(nextMonth), maxDate)) return;
                setMonthOffset((o) => o + 1);
              }}
              disabled={!canGoNext}
              className={`flex items-center justify-center rounded-xl min-h-[44px] min-w-[44px] shrink-0 transition-colors active:scale-[0.98] ${
                !canGoNext
                  ? "bg-[#e8e8e8] text-[#bdbdbd] cursor-not-allowed hover:bg-[#e8e8e8]"
                  : "bg-[#E31C23] text-white shadow-sm hover:bg-[#c91820] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E31C23]"
              }`}
              aria-label={locale === "ja" ? "翌月" : "다음 달"}
            >
              <ChevronRight className="w-7 h-7" strokeWidth={2.75} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* 캘린더: 모바일은 두 달 세로 스택, modal일 때만 본문 스크롤 */}
      <div
        className={`px-4 pb-4 -mx-4 sm:mx-0 md:overflow-x-auto scrollbar-hide ${
          isModal ? "flex-1 min-h-0 overflow-y-auto overscroll-contain" : ""
        }`}
      >
        <div className="flex flex-col gap-4 md:gap-6 md:flex-row md:min-w-max md:w-max">
          {months.map((mon, idx) => (
            <MonthBlock
              key={idx}
              month={mon}
              today={today}
              maxDate={maxDate}
              start={start}
              end={end}
              onDayClick={handleDayClick}
              blockedDateKeys={blockedDateKeys}
              checkoutOnlyDateKeys={checkoutOnlyDateKeys}
              selectingCheckout={!!start && !end}
              minStayNights={minStayNights}
              weekdays={weekdays}
              t={t}
              dateLocale={dateLocale}
              cellSize={isMobile ? CELL_SIZE_MOBILE : CELL_SIZE}
              circleSize={isMobile ? CIRCLE_SIZE_MOBILE : CIRCLE_SIZE}
            />
          ))}
        </div>
      </div>

      {/* 하단 버튼: 날짜 지우기, 닫기 */}
      {onComplete && (
        <div
          className={`flex-shrink-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] border-t border-[#ebebeb] flex justify-end items-center gap-4 bg-white ${
            isModal ? "shadow-[0_-4px_12px_rgba(0,0,0,0.06)]" : "py-4"
          }`}
        >
          <button
            type="button"
            onClick={handleClearDates}
            className="min-h-[44px] px-1 text-[14px] font-medium text-[#222] hover:underline"
          >
            {t("calendar.clearDates")}
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="min-h-[44px] px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-[#222] hover:bg-[#333]"
          >
            {t("calendar.close")}
          </button>
        </div>
      )}
    </div>
  );
}
