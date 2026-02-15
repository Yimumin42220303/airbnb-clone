"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Framer CustomRangePicker 스타일: 2달 나란히, 오늘 버튼, 체크인=빨간 원, 체크아웃=흰 원+빨간 테두리, 구간=#F7F7F7 */
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

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
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
  const end = endOfMonth(month);
  const firstDay = start.getDay();
  const paddingStart = Array.from({ length: firstDay }, () => null);
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  const totalSlots = Math.ceil((paddingStart.length + days.length) / 7) * 7;
  const paddingEnd = Array.from({ length: totalSlots - paddingStart.length - days.length }, () => null);
  return [...paddingStart, ...days, ...paddingEnd];
}

export interface FramerDateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (iso: string) => void;
  onCheckOutChange: (iso: string) => void;
  onClose?: () => void;
  /** 모바일에서는 세로 스크롤 2달 + 상하 화살표 */
  compact?: boolean;
}

const CELL_SIZE = 40;
const CIRCLE_SIZE = 36;

function MonthBlock({
  month,
  today,
  maxDate,
  start,
  end,
  onDayClick,
  isMobile,
  onPrev,
  onNext,
  showPrev,
  showNext,
}: {
  month: Date;
  today: Date;
  maxDate: Date;
  start: Date | null;
  end: Date | null;
  onDayClick: (day: Date) => void;
  isMobile: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const days = useMemo(
    () => eachDayOfMonth(new Date(year, monthIndex, 1)),
    [year, monthIndex]
  );

  const isDisabled = (day: Date) => isBefore(day, today) || isAfter(day, maxDate);

  return (
    <div className={isMobile ? "flex-shrink-0" : "flex-1 min-w-0"}>
      <div className="flex items-center justify-between mb-3">
        {/* 왼쪽: 이전 달 버튼 또는 빈 공간 */}
        {showPrev && onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f0] transition-colors cursor-pointer"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-5 h-5 text-minbak-black" />
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
        <p
          className="font-bold text-[18px] text-minbak-black"
          style={{ fontFamily: "var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif" }}
        >
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </p>
        {/* 오른쪽: 다음 달 버튼 또는 빈 공간 */}
        {showNext && onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f0] transition-colors cursor-pointer"
            aria-label="다음 달"
          >
            <ChevronRight className="w-5 h-5 text-minbak-black" />
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className="py-1.5 text-center font-bold text-[13px]"
            style={{
              fontFamily: "var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif",
              color: i === 0 ? "#D74132" : i === 6 ? "#4A90E2" : "#666",
            }}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[14px]" style={{ fontFamily: "var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif" }}>
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} style={{ height: CELL_SIZE }} />;
          const disabled = isDisabled(day);
          const isStart = start && isSameDay(day, start);
          const isEnd = end && isSameDay(day, end);
          const inRange = start && end && isWithinInterval(day, start, end) && !isStart && !isEnd;

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
              className="relative flex items-center justify-center cursor-pointer select-none box-border"
              style={{
                height: CELL_SIZE,
                opacity: disabled ? 0.3 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
                color: isStart ? "#fff" : "inherit",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* 구간 배경 */}
              {(inRange || isStart || isEnd) && (
                <div
                  className="absolute top-0 bottom-0 bg-[#F7F7F7] z-0"
                  style={{
                    left: isStart ? "50%" : 0,
                    right: isEnd ? "50%" : 0,
                  }}
                />
              )}
              {/* 체크아웃일: 흰 원 배경 */}
              {isEnd && (
                <div
                  className="absolute rounded-full bg-white z-[1]"
                  style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
                />
              )}
              {/* 날짜 원: 체크인=빨간 채움, 체크아웃=빨간 테두리 */}
              <div
                className="absolute rounded-full flex items-center justify-center z-[2]"
                style={{
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  background: isStart ? "#D74132" : "transparent",
                  border: isEnd ? "2px solid #D74132" : "none",
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

export default function FramerDateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  onClose,
  compact = false,
}: FramerDateRangePickerProps) {
  const today = useMemo(() => toDateOnly(new Date()), []);
  const maxDate = useMemo(() => addMonths(today, 12), [today]);

  const [monthOffset, setMonthOffset] = useState(0);
  const [mobileMonthOffset, setMobileMonthOffset] = useState(0);

  const start = checkIn ? toDateOnly(new Date(checkIn + "T12:00:00")) : null;
  const end = checkOut ? toDateOnly(new Date(checkOut + "T12:00:00")) : null;

  const months: Date[] = compact
    ? [
        addMonths(today, mobileMonthOffset * 2),
        addMonths(today, mobileMonthOffset * 2 + 1),
      ]
    : [addMonths(today, monthOffset), addMonths(today, monthOffset + 1)];

  const handleDayClick = (day: Date) => {
    if (isBefore(day, today) || isAfter(day, maxDate)) return;

    const isNewCheckIn = !start || (start && end);

    if (isNewCheckIn) {
      onCheckInChange(toISO(day));
      onCheckOutChange("");

      // A안: 체크인 선택 시 자동 이동 — 선택한 날이 오른쪽(2번째) 달에 있으면
      // 캘린더를 이동해서 왼쪽에 체크인 달, 오른쪽에 다음 달이 보이도록 함
      const dayMonth = day.getFullYear() * 12 + day.getMonth();
      const todayMonth = today.getFullYear() * 12 + today.getMonth();
      const selectedOffset = dayMonth - todayMonth;

      if (compact) {
        const rightMonth = mobileMonthOffset * 2 + 1;
        if (selectedOffset >= rightMonth) {
          setMobileMonthOffset(Math.floor(selectedOffset / 2));
        }
      } else {
        const rightMonth = monthOffset + 1;
        if (selectedOffset >= rightMonth) {
          setMonthOffset(selectedOffset);
        }
      }
    } else {
      if (isSameDay(day, start)) return;
      const [a, b] = day < start ? [day, start] : [start, day];
      onCheckInChange(toISO(a));
      onCheckOutChange(toISO(b));
    }
  };

  const goToToday = () => {
    setMonthOffset(0);
    setMobileMonthOffset(0);
  };

  if (compact) {
    const canMobilePrev = mobileMonthOffset > 0;
    const canMobileNext = !isAfter(startOfMonth(addMonths(today, (mobileMonthOffset + 1) * 2)), maxDate);

    return (
      <div className="w-full min-w-[320px] max-h-[100vh] flex flex-col bg-white overflow-hidden rounded-none">
        <div className="flex-1 flex flex-col gap-8 py-4 px-5 pb-6 overflow-y-auto overflow-x-hidden">
          {months.map((mon, idx) => (
            <MonthBlock
              key={idx}
              month={mon}
              today={today}
              maxDate={maxDate}
              start={start}
              end={end}
              onDayClick={handleDayClick}
              isMobile
              showPrev={idx === 0 && canMobilePrev}
              showNext={idx === 1 && canMobileNext}
              onPrev={idx === 0 ? () => setMobileMonthOffset((o) => Math.max(0, o - 1)) : undefined}
              onNext={idx === 1 ? () => { if (canMobileNext) setMobileMonthOffset((o) => o + 1); } : undefined}
            />
          ))}
        </div>
      </div>
    );
  }

  const canGoPrev = monthOffset > 0;
  const canGoNext = !isAfter(startOfMonth(addMonths(today, monthOffset + 2)), maxDate);

  return (
    <div
      className="flex flex-col bg-white rounded-[24px] overflow-hidden box-border shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
      style={{ width: 704, minWidth: 704 }}
    >
      <div className="flex flex-row gap-8 p-8 box-border">
        {months.map((mon, idx) => (
          <MonthBlock
            key={idx}
            month={mon}
            today={today}
            maxDate={maxDate}
            start={start}
            end={end}
            onDayClick={handleDayClick}
            isMobile={false}
            showPrev={idx === 0 && canGoPrev}
            showNext={idx === 1 && canGoNext}
            onPrev={idx === 0 ? () => setMonthOffset((o) => Math.max(0, o - 1)) : undefined}
            onNext={idx === 1 ? () => { if (canGoNext) setMonthOffset((o) => o + 1); } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
