"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toISODateString } from "@/lib/date-utils";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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

type Props = {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (iso: string) => void;
  onCheckOutChange: (iso: string) => void;
  /** 캘린더를 팝오버로 쓸 때, 완료/닫기 버튼 클릭 시 호출 */
  onComplete?: () => void;
  /** 예약 불가 날짜 (YYYY-MM-DD). */
  blockedDateKeys?: string[];
  /** 체크아웃만 가능한 날짜 (YYYY-MM-DD). */
  checkoutOnlyDateKeys?: string[];
};

function formatDisplayDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}

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

  return (
    <div className="flex-1 min-w-0">
      <p className="text-left mb-2 text-[15px] font-semibold text-[#222]">
        {year}년 {monthIndex + 1}월
      </p>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className="py-1 text-center text-[12px] font-medium"
            style={{
              color: i === 0 ? "#D74132" : i === 6 ? "#4A90E2" : "#717171",
            }}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[14px]">
        {days.map((day, i) => {
          if (!day)
            return <div key={`e-${i}`} style={{ height: CELL_SIZE }} />;
          const disabled = isDisabled(day);
          const checkoutOnly = isCheckoutOnly(day);
          const isStart = start && isSameDay(day, start);
          const isEnd = end && isSameDay(day, end);
          const inRange =
            start &&
            end &&
            isWithinInterval(day, start, end) &&
            !isStart &&
            !isEnd;

          // 체크아웃 선택 시: 체크인 이전/당일은 선택 불가 (현실적으로 체크아웃은 체크인 이후여야 함)
          const isBeforeOrSameAsCheckIn =
            selectingCheckout && start && (isBefore(day, start) || isSameDay(day, start));

          const canClick =
            !isBeforeOrSameAsCheckIn &&
            (!disabled || (selectingCheckout && checkoutOnly));
          const isCheckoutOnlySelectable = selectingCheckout && checkoutOnly;
          const isFullyDisabled =
            (disabled || (isBeforeOrSameAsCheckIn && !isStart)) && !canClick;
          // 체크아웃 전용 날짜는 선택 전/후 모두 은은한 회색 유지 (체크인 선택 시 갑자기 검은색으로 변하는 위화감 방지)
          const isCheckoutOnlySubdued = disabled && isCheckoutOnlySelectable;

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
                height: CELL_SIZE,
                opacity: isStart || isEnd ? 1 : isFullyDisabled ? 0.35 : isCheckoutOnlySubdued ? 0.75 : 1,
                cursor: canClick ? "pointer" : "not-allowed",
                color: isStart || isEnd ? "#fff" : isFullyDisabled ? "#B0B0B0" : isCheckoutOnlySubdued ? "#717171" : "#222",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {checkoutOnly && !isStart && !isEnd && (
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1.5 text-[12px] font-medium text-[#222] bg-white border border-[#ebebeb] rounded-lg shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                  style={{ borderBottom: "2px solid #E31C23" }}
                >
                  체크아웃만 가능
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
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  background: isStart
                    ? "#E31C23"
                    : isEnd
                      ? "#fff"
                      : "transparent",
                  border: isEnd ? "2px solid #E31C23" : "none",
                  color: isStart ? "#fff" : isEnd ? "#E31C23" : undefined,
                }}
              >
                {day.getDate()}
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
  onComplete,
  blockedDateKeys = [],
  checkoutOnlyDateKeys = [],
}: Props) {
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
      onCheckOutChange(toISODateString(day));
    }
  };

  const handleClearDates = () => {
    onCheckInChange("");
    onCheckOutChange("");
    setCheckoutOnlyMessage(false);
  };

  const goToToday = () => setMonthOffset(0);

  return (
    <div className="border border-[#ebebeb] rounded-xl bg-white overflow-hidden">
      {/* 헤더: 날짜 선택 + 메시지 + 체크인/체크아웃 입력 필드 */}
      <div className="p-4 pb-0">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] font-semibold text-[#222] mb-1">날짜 선택</h2>
            {checkoutOnlyMessage && (
              <p className="text-[14px] text-[#222] font-medium" style={{ borderBottom: "2px solid #E31C23" }}>
                이 날짜에는 체크인할 수 없습니다.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div
              className={`flex flex-col gap-1 px-3 py-2 border rounded-lg min-w-[140px] ${
                selectingCheckIn ? "border-[#222]" : "border-[#ebebeb]"
              }`}
            >
              <span className="text-[12px] text-[#717171]">체크인</span>
              <span className="text-[14px] text-[#222]">
                {checkIn ? formatDisplayDate(checkIn) : "날짜 추가"}
              </span>
            </div>
            <div
              className={`flex flex-col gap-1 px-3 py-2 border rounded-lg min-w-[140px] ${
                !selectingCheckIn && start ? "border-[#222]" : "border-[#ebebeb]"
              }`}
            >
              <span className="text-[12px] text-[#717171]">체크아웃</span>
              <span className="text-[14px] text-[#222]">
                {checkOut ? formatDisplayDate(checkOut) : "날짜 추가"}
              </span>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex justify-between items-center mb-3">
          <button
            type="button"
            onClick={goToToday}
            className="text-[13px] font-medium text-[#E31C23] hover:underline"
          >
            오늘
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
              disabled={monthOffset === 0}
              className="p-1.5 rounded-full hover:bg-[#f7f7f7] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-5 h-5 text-[#222]" />
            </button>
            <button
              type="button"
              onClick={() => {
                const nextMonth = addMonths(today, monthOffset + 1);
                if (isAfter(startOfMonth(nextMonth), maxDate)) return;
                setMonthOffset((o) => o + 1);
              }}
              className="p-1.5 rounded-full hover:bg-[#f7f7f7]"
              aria-label="다음 달"
            >
              <ChevronRight className="w-5 h-5 text-[#222]" />
            </button>
          </div>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="px-4 pb-4 flex gap-6 min-w-[480px]">
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
          />
        ))}
      </div>

      {/* 하단 버튼: 날짜 지우기, 닫기 */}
      {onComplete && (
        <div className="px-4 py-4 pt-2 border-t border-[#ebebeb] flex justify-end items-center gap-4">
          <button
            type="button"
            onClick={handleClearDates}
            className="text-[14px] font-medium text-[#222] hover:underline"
          >
            날짜 지우기
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2 rounded-lg text-[14px] font-medium text-white bg-[#222] hover:bg-[#333]"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
