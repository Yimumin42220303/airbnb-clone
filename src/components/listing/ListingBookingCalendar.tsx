"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateOnly(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
  /** 캘린더를 팝오버로 쓸 때, 완료 버튼 클릭 시 호출 (체크인·체크아웃 모두 선택된 경우만 활성화) */
  onComplete?: () => void;
  /** 예약 불가 날짜 (YYYY-MM-DD). 우리 예약 + 설정 + 외부 ICS(에어비앤비 등) */
  blockedDateKeys?: string[];
};

function MonthBlock({
  month,
  today,
  maxDate,
  start,
  end,
  onDayClick,
  blockedDateKeys = [],
}: {
  month: Date;
  today: Date;
  maxDate: Date;
  start: Date | null;
  end: Date | null;
  onDayClick: (day: Date) => void;
  blockedDateKeys?: string[];
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = useMemo(
    () => eachDayOfMonth(new Date(year, monthIndex, 1)),
    [year, monthIndex]
  );
  const blockedSet = useMemo(() => new Set(blockedDateKeys), [blockedDateKeys]);

  const isDisabled = (day: Date) =>
    isBefore(day, today) ||
    isAfter(day, maxDate) ||
    blockedSet.has(toISO(day));

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
      <div className="grid grid-cols-7 gap-0.5 text-[14px] text-[#222]">
        {days.map((day, i) => {
          if (!day)
            return <div key={`e-${i}`} style={{ height: CELL_SIZE }} />;
          const disabled = isDisabled(day);
          const isStart = start && isSameDay(day, start);
          const isEnd = end && isSameDay(day, end);
          const inRange =
            start &&
            end &&
            isWithinInterval(day, start, end) &&
            !isStart &&
            !isEnd;

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onClick={() => !disabled && onDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!disabled) onDayClick(day);
                }
              }}
              className="relative flex items-center justify-center cursor-pointer select-none box-border rounded-full"
              style={{
                height: CELL_SIZE,
                opacity: disabled ? 0.35 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
                color: isStart || isEnd ? "#fff" : "inherit",
                WebkitTapHighlightColor: "transparent",
              }}
            >
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
                  background: isStart ? "#E31C23" : isEnd ? "#fff" : "transparent",
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
}: Props) {
  const today = useMemo(() => toDateOnly(new Date()), []);
  const maxDate = useMemo(() => addMonths(today, 12), [today]);

  const [monthOffset, setMonthOffset] = useState(0);

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

  const handleDayClick = (day: Date) => {
    if (isBefore(day, today) || isAfter(day, maxDate) || blockedSet.has(toISO(day))) return;
    if (!start || (start && end)) {
      onCheckInChange(toISO(day));
      onCheckOutChange("");
    } else {
      if (isSameDay(day, start)) return;
      if (isBefore(day, start)) {
        onCheckInChange(toISO(day));
        onCheckOutChange("");
      } else {
        onCheckOutChange(toISO(day));
      }
    }
  };

  const canComplete =
    !!checkIn &&
    !!checkOut &&
    checkOut > checkIn;

  const goToToday = () => setMonthOffset(0);

  return (
    <div className="border border-[#ebebeb] rounded-xl bg-white p-4">
      <div className="flex justify-between items-center mb-3 min-w-0">
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
      <div className="flex gap-6 min-w-[480px]">
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
          />
        ))}
      </div>
      {onComplete && (
        <div className="mt-4 pt-3 border-t border-[#ebebeb] flex justify-end">
          <button
            type="button"
            onClick={onComplete}
            disabled={!canComplete}
            className="px-4 py-2 rounded-full text-[14px] font-medium text-white bg-[#E31C23] hover:bg-[#c91820] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#E31C23]"
          >
            완료
          </button>
        </div>
      )}
    </div>
  );
}
