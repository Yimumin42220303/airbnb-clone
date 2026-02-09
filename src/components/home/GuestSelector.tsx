"use client";

import { Minus, Plus } from "lucide-react";

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
}

export const DEFAULT_GUESTS: GuestCounts = { adults: 1, children: 0, infants: 0 };

export interface GuestSelectorProps {
  adults: number;
  childrenCount: number;
  infants: number;
  onAdultsChange: (n: number) => void;
  onChildrenChange: (n: number) => void;
  onInfantsChange: (n: number) => void;
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="w-8 h-8 rounded-full border border-minbak-light-gray flex items-center justify-center text-minbak-gray hover:border-minbak-gray hover:text-minbak-black disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="감소"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-6 text-center text-airbnb-body font-medium text-minbak-black">
        {value}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-full border border-minbak-light-gray flex items-center justify-center text-minbak-gray hover:border-minbak-gray hover:text-minbak-black disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="증가"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function GuestSelector({
  adults,
  childrenCount,
  infants,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
}: GuestSelectorProps) {
  return (
    <div
      className="bg-white border border-minbak-light-gray rounded-airbnb-lg shadow-airbnb-lg p-5 min-w-[280px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between py-3 border-b border-minbak-light-gray">
        <div>
          <p className="text-airbnb-body font-semibold text-minbak-black">성인</p>
          <p className="text-airbnb-caption text-minbak-gray">13세 이상</p>
        </div>
        <Stepper value={adults} min={1} max={16} onChange={onAdultsChange} />
      </div>
      <div className="flex items-center justify-between py-3 border-b border-minbak-light-gray">
        <div>
          <p className="text-airbnb-body font-semibold text-minbak-black">어린이</p>
          <p className="text-airbnb-caption text-minbak-gray">2~12세</p>
        </div>
        <Stepper value={childrenCount} min={0} max={16} onChange={onChildrenChange} />
      </div>
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-airbnb-body font-semibold text-minbak-black">유아</p>
          <p className="text-airbnb-caption text-minbak-gray">2세 미만</p>
        </div>
        <Stepper value={infants} min={0} max={5} onChange={onInfantsChange} />
      </div>
    </div>
  );
}
