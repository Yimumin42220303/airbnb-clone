"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getMonthYear(d: Date) {
  return { year: d.getFullYear(), month: d.getMonth() };
}

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (number | null)[] = [];
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export interface SearchDateCalendarProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (iso: string) => void;
  onCheckOutChange: (iso: string) => void;
  onClose?: () => void;
  /** 'check-in' | 'check-out' - which field opened the calendar (초기 포커스용) */
  focusMode?: "check-in" | "check-out";
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export default function SearchDateCalendar({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  focusMode = "check-in",
  anchorRef,
}: SearchDateCalendarProps) {
  const today = todayISO();
  const [leftMonth, setLeftMonth] = useState(() => {
    if (focusMode === "check-out" && checkOut) {
      const d = new Date(checkOut + "T12:00:00");
      return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    }
    if (checkIn) {
      const d = new Date(checkIn + "T12:00:00");
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const rightMonth = new Date(leftMonth.getFullYear(), leftMonth.getMonth() + 1, 1);

  function goPrev() {
    setLeftMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }
  function goNext() {
    setLeftMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  function toISO(year: number, month: number, day: number): string {
    const d = new Date(year, month, day);
    return d.toISOString().slice(0, 10);
  }

  function handleDateClick(year: number, month: number, day: number) {
    const iso = toISO(year, month, day);
    if (!checkIn || (checkIn && checkOut)) {
      onCheckInChange(iso);
      onCheckOutChange("");
    } else {
      if (iso <= checkIn) {
        onCheckInChange(iso);
        onCheckOutChange("");
      } else {
        onCheckOutChange(iso);
      }
    }
  }

  const leftDays = getDaysInMonth(leftMonth.getFullYear(), leftMonth.getMonth());
  const rightDays = getDaysInMonth(rightMonth.getFullYear(), rightMonth.getMonth());

  function renderMonth(
    year: number,
    month: number,
    days: (number | null)[],
    label: string
  ) {
    return (
      <div className="flex flex-col">
        <p className="text-airbnb-body font-semibold text-minbak-black mb-3">{label}</p>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              className={`py-1.5 text-airbnb-caption font-medium ${
                i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-minbak-gray"
              }`}
            >
              {w}
            </span>
          ))}
          {days.map((day, i) => {
            if (day === null)
              return <div key={`e-${i}`} className="py-2" />;
            const iso = toISO(year, month, day);
            const isToday = iso === today;
            const isCheckIn = iso === checkIn;
            const isCheckOut = iso === checkOut;
            const isPast = iso < today;
            const beforeCheckIn = checkIn ? iso < checkIn : false;
            const inRange =
              checkIn &&
              checkOut &&
              iso > checkIn &&
              iso < checkOut;
            const disabled = isPast || beforeCheckIn;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && handleDateClick(year, month, day)}
                className={`
                  py-2 text-airbnb-body rounded-airbnb
                  ${disabled ? "text-minbak-light-gray cursor-not-allowed" : "hover:bg-minbak-bg cursor-pointer"}
                  ${isToday ? "font-bold text-minbak-primary" : ""}
                  ${isCheckIn || isCheckOut ? "bg-minbak-primary text-white hover:bg-minbak-primary-hover font-medium" : ""}
                  ${inRange ? "bg-minbak-primary/20 text-minbak-black" : ""}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white border border-minbak-light-gray rounded-airbnb-lg shadow-airbnb-lg p-4 min-w-[320px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            onCheckInChange(today);
            onCheckOutChange("");
          }}
          className="text-airbnb-caption font-medium text-minbak-primary hover:underline"
        >
          오늘
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="p-1.5 rounded-full hover:bg-minbak-bg text-minbak-black"
            aria-label="이전 달"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="p-1.5 rounded-full hover:bg-minbak-bg text-minbak-black"
            aria-label="다음 달"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex gap-8">
        {renderMonth(
          leftMonth.getFullYear(),
          leftMonth.getMonth(),
          leftDays,
          `${leftMonth.getFullYear()}년 ${leftMonth.getMonth() + 1}월`
        )}
        {renderMonth(
          rightMonth.getFullYear(),
          rightMonth.getMonth(),
          rightDays,
          `${rightMonth.getFullYear()}년 ${rightMonth.getMonth() + 1}월`
        )}
      </div>
    </div>
  );
}
