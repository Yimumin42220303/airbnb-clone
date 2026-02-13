"use client";

import { useState } from "react";
import HostTodayCard from "./HostTodayCard";

export type TodayBookingItem = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  guestName: string;
  guestImage: string | null;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
};

type Props = {
  todayBookings: TodayBookingItem[];
  upcomingBookings: TodayBookingItem[];
};

export default function HostTodayContent({
  todayBookings,
  upcomingBookings,
}: Props) {
  const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");
  const list = activeTab === "today" ? todayBookings : upcomingBookings;
  const count = list.length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`min-h-[44px] flex items-center px-4 py-2.5 rounded-[90px] text-sm font-medium transition-colors ${
              activeTab === "today"
                ? "bg-minbak-black text-white"
                : "bg-white text-minbak-black border border-minbak-light-gray hover:bg-minbak-bg"
            }`}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`min-h-[44px] flex items-center px-4 py-2.5 rounded-[90px] text-sm font-medium transition-colors ${
              activeTab === "upcoming"
                ? "bg-minbak-black text-white"
                : "bg-white text-minbak-black border border-minbak-light-gray hover:bg-minbak-bg"
            }`}
          >
            예정
          </button>
        </div>
        <button
          type="button"
          className="min-h-[44px] flex items-center px-4 py-2.5 rounded-airbnb border border-minbak-black text-minbak-black text-sm font-medium hover:bg-minbak-bg transition-colors"
        >
          홈 필터
        </button>
      </div>

      <h2 className="text-[20px] sm:text-airbnb-h2 font-semibold text-minbak-black mb-4">
        예약이 {count}건 있습니다
      </h2>

      {count === 0 ? (
        <p className="text-airbnb-body text-minbak-gray">
          {activeTab === "today" ? "오늘 예정된 예약이 없습니다." : "예정된 예약이 없습니다."}
        </p>
      ) : (
        <ul className="space-y-4">
          {list.map((b) => (
            <li key={b.id}>
              <HostTodayCard booking={b} isToday={activeTab === "today"} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
