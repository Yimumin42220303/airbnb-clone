"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HostCalendarBookingActions from "./HostCalendarBookingActions";
import { useHostTranslations } from "./HostLocaleProvider";
import { toISODateString } from "@/lib/date-utils";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/** 모바일 전용: 두 번째 첨부 이미지 스타일의 월 그리드 (7열 × 주차, 날짜+가격/예약/막힘) */
function MobileMonthGrid({
  listing,
  calendarDays,
  month,
  year,
  todayKey,
}: {
  listing: ListingWithBookings | undefined;
  calendarDays: Date[];
  month: number;
  year: number;
  todayKey: string;
}) {
  const t = useHostTranslations().t;

  if (!listing) {
    return (
      <div className="md:hidden bg-white rounded-minbak border border-minbak-light-gray p-6 text-center text-minbak-body text-minbak-gray">
        {t("calendar.selectListing")}
      </div>
    );
  }

  const blockedSet = new Set(listing.blockedDateKeys ?? []);

  /** 해당 날짜가 예약의 첫날일 때만 그 예약 정보 반환 (캘린더 그리드 내 span 포함) */
  function getBookingAt(dateKey: string): { booking: Booking; startIndex: number; span: number } | null {
    for (const b of listing!.bookings) {
      const cin = b.checkIn.slice(0, 10);
      const cout = b.checkOut.slice(0, 10);
      if (dateKey < cin || dateKey >= cout) continue;
      const startIndex = calendarDays.findIndex((d) => toISODateString(d) >= cin);
      if (startIndex < 0) return null;
      const firstKey = toISODateString(calendarDays[startIndex]);
      if (dateKey !== firstKey) return null;
      const endIndex = calendarDays.findIndex((d) => toISODateString(d) >= cout);
      const span = endIndex === -1 ? calendarDays.length - startIndex : endIndex - startIndex;
      return { booking: b, startIndex, span };
    }
    return null;
  }

  /** 해당 날짜가 예약의 2일차 이후인지 (첫날이면 false) */
  function isContinuationOfBooking(dayIndex: number): boolean {
    const dateKey = toISODateString(calendarDays[dayIndex]);
    for (const b of listing!.bookings) {
      const cin = b.checkIn.slice(0, 10);
      const cout = b.checkOut.slice(0, 10);
      if (dateKey <= cin || dateKey >= cout) continue;
      const firstIndex = calendarDays.findIndex((d) => toISODateString(d) >= cin);
      if (dayIndex > firstIndex) return true;
    }
    return false;
  }

  const cells: { index: number; row: number; col: number }[] = [];
  for (let i = 0; i < calendarDays.length; i++) {
    cells.push({ index: i, row: Math.floor(i / 7), col: i % 7 });
  }

  return (
    <div className="md:hidden bg-white rounded-minbak border border-minbak-light-gray overflow-hidden">
      <h2 className="text-lg font-semibold text-minbak-black px-3 pt-3 pb-2">
        {month}{t("calendar.month")}
      </h2>
      <div
        className="grid gap-px bg-minbak-light-gray p-px"
        style={{
          gridTemplateColumns: "repeat(7, 1fr)",
          gridAutoRows: "minmax(52px, auto)",
        }}
      >
        {WEEKDAY_KEYS.map((k, i) => (
          <div
            key={i}
            className="bg-minbak-bg py-1.5 text-center text-[11px] font-medium text-minbak-gray"
            style={{ gridColumn: i + 1, gridRow: 1 }}
          >
            {t(`calendar.weekday.${k}`)}
          </div>
        ))}
        {cells.map(({ index, row, col }) => {
          const d = calendarDays[index];
          const dateKey = toISODateString(d);
          const isCurrentMonth = d.getMonth() === month - 1;
          const isToday = dateKey === todayKey;
          const isBlocked = blockedSet.has(dateKey);
          const bookingAt = getBookingAt(dateKey);
          const isFirst = bookingAt != null && bookingAt.startIndex === index;
          const isContinuation = isContinuationOfBooking(index);

          if (isContinuation) {
            return <div key={index} className="bg-minbak-bg/30" style={{ gridColumn: col + 1, gridRow: row + 2 }} />;
          }

          if (isFirst && bookingAt) {
            const { booking, startIndex, span } = bookingAt;
            const segments: { row: number; col: number; span: number }[] = [];
            let remaining = span;
            let idx = startIndex;
            while (remaining > 0) {
              const c = idx % 7;
              const r = Math.floor(idx / 7);
              const take = Math.min(remaining, 7 - c);
              segments.push({ row: r, col: c, span: take });
              remaining -= take;
              idx += take;
            }
            return (
              <React.Fragment key={index}>
                {segments.map((seg, si) => (
                  <div
                    key={`${index}-${si}`}
                    className="flex flex-col justify-center rounded px-1 py-1 bg-gray-800 text-white min-h-[52px]"
                    style={{
                      gridColumn: `${seg.col + 1} / span ${seg.span}`,
                      gridRow: seg.row + 2,
                    }}
                  >
                    <p className="text-[11px] font-medium truncate leading-tight">
                      {booking.guestName}
                      {span > 1 ? ` +${span - 1}` : ""}
                    </p>
                    <p className="text-[10px] opacity-90 mt-0.5">
                      ₩{booking.totalPrice.toLocaleString()}
                    </p>
                  </div>
                ))}
              </React.Fragment>
            );
          }

          return (
            <div
              key={index}
              className={`flex flex-col justify-center items-center py-1 px-0.5 min-h-[52px] ${
                !isCurrentMonth ? "bg-minbak-bg/50 text-minbak-gray" : "bg-white"
              } ${isToday ? "ring-2 ring-inset ring-red-500 rounded-full w-7 h-7 flex items-center justify-center" : ""}`}
              style={{ gridColumn: col + 1, gridRow: row + 2 }}
            >
              <span className={`text-[13px] font-medium ${isToday ? "text-red-600" : "text-minbak-black"}`}>
                {d.getDate()}
              </span>
              {isCurrentMonth && (
                <span
                  className={`text-[10px] leading-tight mt-0.5 truncate max-w-full ${
                    isBlocked ? "text-gray-400 line-through" : "text-minbak-gray"
                  }`}
                >
                  {isBlocked ? t("calendar.blocked") : `₩${listing.pricePerNight.toLocaleString()}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  guestName: string;
};

type ListingWithBookings = {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  pricePerNight: number;
  bookings: Booking[];
  blockedDateKeys?: string[];
};

function getCalendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const start = new Date(first);
  start.setDate(start.getDate() - startDay);
  const days: Date[] = [];
  const total = 35;
  for (let i = 0; i < total; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function getBookingStatusLabel(
  status: string,
  checkIn: string,
  checkOut: string,
  t: ReturnType<typeof useHostTranslations>["t"]
): string {
  const today = toISODateString(new Date());
  const cin = checkIn.slice(0, 10);
  const cout = checkOut.slice(0, 10);
  if (today >= cin && today <= cout) return t("calendar.hostingNow");
  if (status === "confirmed") return t("bookings.confirmed");
  if (status === "pending") return t("bookings.pending");
  return t("bookings.confirmed");
}

/** 두 날짜 키(YYYY-MM-DD) 사이의 모든 날짜 키 배열 (양끝 포함) */
function getDateKeysBetweenKeys(startKey: string, endKey: string): string[] {
  const [y0, m0, d0] = startKey.split("-").map(Number);
  const [y1, m1, d1] = endKey.split("-").map(Number);
  const start = new Date(y0, m0 - 1, d0);
  const end = new Date(y1, m1 - 1, d1);
  const keys: string[] = [];
  const cur = new Date(Math.min(start.getTime(), end.getTime()));
  const last = new Date(Math.max(start.getTime(), end.getTime()));
  while (cur <= last) {
    keys.push(toISODateString(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

export default function HostCalendarView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useHostTranslations().t;
  const monthParam = searchParams.get("month"); // YYYY-MM
  const now = new Date();
  const [year, setYear] = useState(() =>
    monthParam ? parseInt(monthParam.slice(0, 4), 10) : now.getFullYear()
  );
  const [month, setMonth] = useState(() =>
    monthParam ? parseInt(monthParam.slice(5, 7), 10) : now.getMonth() + 1
  );
  const [listings, setListings] = useState<ListingWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dragStart, setDragStart] = useState<{ listingId: string; dateKey: string } | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ listingId: string; dateKeys: string[] } | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [hoveredListingId, setHoveredListingId] = useState<string | null>(null);
  const dragStartRef = useRef<{ listingId: string; dateKey: string } | null>(null);
  const dragEndRef = useRef<string | null>(null);

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const handleCellMouseDown = (listingId: string, dateKey: string) => {
    const payload = { listingId, dateKey };
    dragStartRef.current = payload;
    dragEndRef.current = dateKey;
    setDragStart(payload);
    setDragEnd(dateKey);
    setSelectedRange(null);
  };

  const handleCellMouseEnter = (listingId: string, dateKey: string) => {
    if (dragStartRef.current?.listingId === listingId) {
      dragEndRef.current = dateKey;
      setDragEnd(dateKey);
    }
  };

  const handleMouseUp = () => {
    const start = dragStartRef.current;
    if (!start) return;
    const end = dragEndRef.current ?? start.dateKey;
    const dateKeys = getDateKeysBetweenKeys(start.dateKey, end);
    setSelectedRange({ listingId: start.listingId, dateKeys });
    dragStartRef.current = null;
    dragEndRef.current = null;
    setDragStart(null);
    setDragEnd(null);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  useEffect(() => {
    if (!monthParam) return;
    const y = parseInt(monthParam.slice(0, 4), 10);
    const m = parseInt(monthParam.slice(5, 7), 10);
    if (!isNaN(y)) setYear(y);
    if (!isNaN(m)) setMonth(m);
  }, [monthParam]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/host/bookings?month=${year}-${String(month).padStart(2, "0")}`)
      .then((res) => {
        if (res.status === 401) {
          router.push("/auth/signin?callbackUrl=/host/calendar");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.listings) setListings(data.listings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [year, month, router, refreshKey]);

  const calendarDays = useMemo(
    () => getCalendarDays(year, month - 1),
    [year, month]
  );
  const firstDay = calendarDays[0];
  const todayKey = toISODateString(new Date());

  const selectionByListing = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (selectedRange) {
      map.set(selectedRange.listingId, new Set(selectedRange.dateKeys));
    } else if (dragStart && dragEnd) {
      const dateKeys = getDateKeysBetweenKeys(dragStart.dateKey, dragEnd);
      map.set(dragStart.listingId, new Set(dateKeys));
    }
    return map;
  }, [selectedRange, dragStart, dragEnd]);

  const filteredListings = useMemo(() => {
    if (!sidebarSearch.trim()) return listings;
    const q = sidebarSearch.trim().toLowerCase();
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q)
    );
  }, [listings, sidebarSearch]);

  function goToPrevMonth() {
    const nextYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 1 ? 12 : month - 1;
    setYear(nextYear);
    setMonth(nextMonth);
    router.push(
      `/host/calendar?month=${nextYear}-${String(nextMonth).padStart(2, "0")}`
    );
  }
  function goToNextMonth() {
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    setYear(nextYear);
    setMonth(nextMonth);
    router.push(
      `/host/calendar?month=${nextYear}-${String(nextMonth).padStart(2, "0")}`
    );
  }
  function goToToday() {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
    router.push(
      `/host/calendar?month=${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-4 md:pt-8">
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-8rem)]">
          {/* Left sidebar: 모바일에서 상단 고정 높이, 데스크톱에서 세로 스크롤 */}
          <aside className="md:w-72 w-full max-h-[220px] md:max-h-none border-b md:border-b-0 md:border-r border-minbak-light-gray bg-white flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-minbak-light-gray">
              <h2 className="text-minbak-body font-semibold text-minbak-black">
                {t("calendar.listingsCount", { count: listings.length })}
              </h2>
              <input
                type="text"
                placeholder={t("calendar.searchPlaceholder")}
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="mt-2 w-full px-3 py-2.5 min-h-[44px] border border-minbak-light-gray rounded-minbak text-minbak-body placeholder:text-minbak-gray focus:outline-none focus:ring-2 focus:ring-minbak-black/20"
              />
            </div>
            <ul className="p-2">
              {filteredListings.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedListingId((id) => (id === l.id ? null : l.id))
                    }
                    onMouseEnter={() => setHoveredListingId(l.id)}
                    onMouseLeave={() => setHoveredListingId(null)}
                    className={`w-full flex gap-3 p-3 min-h-[56px] rounded-minbak text-left transition-colors ${
                      selectedListingId === l.id
                        ? "bg-minbak-bg ring-1 ring-minbak-light-gray"
                        : "hover:bg-minbak-bg"
                    } ${hoveredListingId === l.id ? "ring-2 ring-minbak-primary/40 bg-minbak-primary/5" : ""}`}
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={l.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-minbak-body font-medium text-minbak-black truncate">
                        {l.title}
                      </p>
                      <p className="text-minbak-caption text-minbak-gray truncate">
                        {l.location}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Calendar area */}
          <div className="flex-1 overflow-x-auto bg-minbak-bg p-4 min-w-0">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-minbak hover:bg-white"
                  aria-label={t("calendar.prevMonth")}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm sm:text-minbak-body font-semibold text-minbak-black min-w-[100px] sm:min-w-[120px] text-center">
                  {year}년 {month}월
                </span>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-minbak hover:bg-white"
                  aria-label={t("calendar.nextMonth")}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="min-h-[44px] flex items-center px-3 py-2 text-minbak-caption border border-minbak-light-gray rounded-minbak hover:bg-white"
                >
                  {t("calendar.today")}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-minbak-gray">
                {t("calendar.loading")}
              </div>
            ) : (
              <>
                {/* 모바일 전용: 월 그리드 (두 번째 첨부 디자인) */}
                <MobileMonthGrid
                  listing={selectedListingId
                    ? filteredListings.find((l) => l.id === selectedListingId) ?? filteredListings[0]
                    : filteredListings[0]}
                  calendarDays={calendarDays}
                  month={month}
                  year={year}
                  todayKey={todayKey}
                />

                {/* 데스크톱 전용: 기존 가로 스크롤 캘린더 */}
                <div className="hidden md:block bg-white rounded-minbak border border-minbak-light-gray overflow-hidden relative">
                {selectedRange && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-2 z-10 flex items-center gap-2 px-3 py-2 bg-white border border-minbak-light-gray rounded-minbak shadow-lg">
                    <span className="text-minbak-caption text-minbak-black whitespace-nowrap">
                      {t("calendar.selectedDays", { count: selectedRange.dateKeys.length })}
                    </span>
                    <button
                      type="button"
                      disabled={availabilityLoading}
                      onClick={async () => {
                        setAvailabilityLoading(true);
                        try {
                          const res = await fetch(
                            `/api/host/listings/${selectedRange.listingId}/availability`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                updates: selectedRange.dateKeys.map((date) => ({ date, available: false })),
                              }),
                            }
                          );
                          if (res.ok) {
                            setRefreshKey((k) => k + 1);
                            setSelectedRange(null);
                          }
                        } finally {
                          setAvailabilityLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 text-sm font-medium rounded-minbak bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {t("calendar.block")}
                    </button>
                    <button
                      type="button"
                      disabled={availabilityLoading}
                      onClick={async () => {
                        setAvailabilityLoading(true);
                        try {
                          const res = await fetch(
                            `/api/host/listings/${selectedRange.listingId}/availability`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                updates: selectedRange.dateKeys.map((date) => ({ date, available: true, pricePerNight: null })),
                              }),
                            }
                          );
                          if (res.ok) {
                            setRefreshKey((k) => k + 1);
                            setSelectedRange(null);
                          }
                        } finally {
                          setAvailabilityLoading(false);
                        }
                      }}
                      className="px-3 py-1.5 text-sm font-medium rounded-minbak bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      {t("calendar.open")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRange(null)}
                      className="px-3 py-1.5 text-sm font-medium rounded-minbak border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg"
                    >
                      {t("calendar.cancel")}
                    </button>
                  </div>
                )}
                <div
                  className={`grid gap-0 ${dragStart ? "select-none" : ""}`}
                  style={{
                    gridTemplateColumns: "140px repeat(35, minmax(56px, 1fr))",
                    minWidth: "min(100%, 140px + 35*56px)",
                  }}
                >
                  {/* Header: empty + weekdays for 5 weeks */}
                  <div className="bg-minbak-bg border-b border-r border-minbak-light-gray p-2" />
                  {calendarDays.map((d, i) => (
                    <div
                      key={i}
                      className={`border-b border-r border-minbak-light-gray p-1 text-center text-minbak-caption ${
                        d.getMonth() !== month - 1 ? "text-minbak-gray bg-minbak-bg/50" : ""
                      } ${toISODateString(d) === todayKey ? "bg-minbak-primary/10 font-medium" : ""}`}
                    >
                      {t(`calendar.weekday.${WEEKDAY_KEYS[d.getDay()]}`)} {d.getDate()}
                    </div>
                  ))}

                  {/* Listing rows */}
                  {(selectedListingId
                    ? filteredListings.filter((l) => l.id === selectedListingId)
                    : filteredListings
                  ).map((listing) => (
                    <CalendarRow
                      key={listing.id}
                      listing={listing}
                      calendarDays={calendarDays}
                      month={month}
                      year={year}
                      selectionDateKeys={selectionByListing.get(listing.id)}
                      isRowHighlighted={hoveredListingId === listing.id}
                      onCellMouseDown={handleCellMouseDown}
                      onCellMouseEnter={handleCellMouseEnter}
                      onRowMouseEnter={() => setHoveredListingId(listing.id)}
                      onRowMouseLeave={() => setHoveredListingId(null)}
                      t={t}
                    />
                  ))}
                </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function CalendarRow({
  listing,
  calendarDays,
  month,
  year,
  selectionDateKeys,
  isRowHighlighted,
  onCellMouseDown,
  onCellMouseEnter,
  onRowMouseEnter,
  onRowMouseLeave,
  t,
}: {
  listing: ListingWithBookings;
  calendarDays: Date[];
  month: number;
  year: number;
  selectionDateKeys?: Set<string>;
  isRowHighlighted?: boolean;
  onCellMouseDown?: (listingId: string, dateKey: string) => void;
  onCellMouseEnter?: (listingId: string, dateKey: string) => void;
  onRowMouseEnter?: () => void;
  onRowMouseLeave?: () => void;
  t: ReturnType<typeof useHostTranslations>["t"];
}) {
  const todayKey = toISODateString(new Date());
  const blockedSet = useMemo(
    () => new Set(listing.blockedDateKeys ?? []),
    [listing.blockedDateKeys]
  );

  const rowHighlightClass = isRowHighlighted ? "bg-minbak-primary/10 ring-1 ring-inset ring-minbak-primary/30" : "";

  return (
    <>
      <div
        className={`border-b border-r border-minbak-light-gray p-2 bg-minbak-bg flex gap-2 items-center min-h-[52px] ${rowHighlightClass}`}
        onMouseEnter={onRowMouseEnter}
        onMouseLeave={onRowMouseLeave}
      >
        <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden">
          <Image
            src={listing.imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-minbak-caption text-minbak-gray">
            ₩{listing.pricePerNight.toLocaleString()}/박
          </p>
          <Link
            href={`/listing/${listing.id}`}
            className="text-minbak-body font-medium text-minbak-black hover:underline truncate mt-0.5 block"
          >
            {listing.title}
          </Link>
        </div>
      </div>
      {calendarDays.map((d, colIndex) => {
        const dateKey = toISODateString(d);
        const isCurrentMonth = d.getMonth() === month - 1;
        const isToday = dateKey === todayKey;
        const isBlocked = blockedSet.has(dateKey);

        const booking = listing.bookings.find((b) => {
          const cin = b.checkIn.slice(0, 10);
          const cout = b.checkOut.slice(0, 10);
          if (dateKey < cin) return false;
          if (dateKey >= cout) return false;
          return true;
        });

        const gridCol = colIndex + 2;

        if (!booking) {
          const isSelected = selectionDateKeys?.has(dateKey);
          return (
            <div
              key={colIndex}
              className={`border-b border-r border-minbak-light-gray min-w-[56px] min-h-[52px] p-1 cursor-crosshair ${rowHighlightClass} ${
                !isCurrentMonth ? "bg-minbak-bg/30" : ""
              } ${isToday ? "bg-minbak-primary/5" : ""} ${
                isCurrentMonth && isBlocked ? "bg-gray-200/80" : ""
              } ${isSelected ? "ring-2 ring-inset ring-teal-500 bg-teal-50/80" : ""}`}
              style={{ gridColumn: gridCol }}
              title={isCurrentMonth && isBlocked ? t("calendar.dateBlocked") : isCurrentMonth ? t("calendar.dateAvailable") : undefined}
              onMouseDown={() => {
                onCellMouseDown?.(listing.id, dateKey);
              }}
              onMouseEnter={() => {
                onRowMouseEnter?.();
                onCellMouseEnter?.(listing.id, dateKey);
              }}
              onMouseLeave={onRowMouseLeave}
            >
              {isCurrentMonth && !isBlocked && (
                <p className="text-[11px] leading-tight text-minbak-gray whitespace-nowrap overflow-visible">
                  ₩{listing.pricePerNight.toLocaleString()}
                </p>
              )}
              {isCurrentMonth && isBlocked && (
                <span className="text-minbak-caption text-gray-500" aria-hidden>
                  {t("calendar.blocked")}
                </span>
              )}
            </div>
          );
        }

        const cin = booking.checkIn.slice(0, 10);
        const cout = booking.checkOut.slice(0, 10);
        const startCol = calendarDays.findIndex((day) => toISODateString(day) >= cin);
        const endCol = calendarDays.findIndex((day) => toISODateString(day) >= cout);
        const span = (endCol === -1 ? calendarDays.length : endCol) - startCol;
        const isFirstDay = toISODateString(calendarDays[startCol]) === dateKey;

        if (!isFirstDay) return null;

        return (
          <div
            key={colIndex}
            className={`border-b border-r border-minbak-light-gray min-h-[52px] p-0.5 ${rowHighlightClass}`}
            style={{ gridColumn: `${gridCol} / span ${span}` }}
            onMouseEnter={onRowMouseEnter}
            onMouseLeave={onRowMouseLeave}
          >
            <div className="h-full min-w-0 bg-teal-500/90 hover:bg-teal-600/90 rounded px-2 py-1.5 text-white flex flex-col justify-center overflow-hidden">
              <p className="text-minbak-caption font-medium truncate">
                {booking.guestName}
              </p>
              <p className="text-minbak-caption opacity-90">
                ₩{booking.totalPrice.toLocaleString()}
              </p>
              <p className="text-minbak-caption opacity-90">
                {getBookingStatusLabel(
                  booking.status,
                  booking.checkIn,
                  booking.checkOut,
                  t
                )}
              </p>
              <HostCalendarBookingActions
                bookingId={booking.id}
                status={booking.status}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}
