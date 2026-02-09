"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout";
import { ChevronLeft, ChevronRight } from "lucide-react";
import HostCalendarBookingActions from "./HostCalendarBookingActions";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
  checkOut: string
): string {
  const today = toDateKey(new Date());
  const cin = checkIn.slice(0, 10);
  const cout = checkOut.slice(0, 10);
  if (today >= cin && today <= cout) return "현재 호스팅 중";
  if (status === "confirmed") return "확정됨";
  if (status === "pending") return "대기";
  return "확정됨";
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
    keys.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

export default function HostCalendarView() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const todayKey = toDateKey(new Date());

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
      <main className="min-h-screen pt-32 md:pt-40">
        <div className="flex min-h-[calc(100vh-8rem)]">
          {/* Left sidebar */}
          <aside className="w-72 border-r border-airbnb-light-gray bg-white flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-airbnb-light-gray">
              <h2 className="text-airbnb-body font-semibold text-airbnb-black">
                리스팅 {listings.length}개
              </h2>
              <input
                type="text"
                placeholder="리스팅 검색..."
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-airbnb-light-gray rounded-airbnb text-airbnb-body placeholder:text-airbnb-gray focus:outline-none focus:ring-2 focus:ring-airbnb-black/20"
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
                    className={`w-full flex gap-3 p-3 rounded-airbnb text-left transition-colors ${
                      selectedListingId === l.id
                        ? "bg-airbnb-bg ring-1 ring-airbnb-light-gray"
                        : "hover:bg-airbnb-bg"
                    }`}
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
                      <p className="text-airbnb-body font-medium text-airbnb-black truncate">
                        {l.title}
                      </p>
                      <p className="text-airbnb-caption text-airbnb-gray truncate">
                        {l.location}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Calendar area */}
          <div className="flex-1 overflow-x-auto bg-airbnb-bg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevMonth}
                  className="p-2 rounded-airbnb hover:bg-white"
                  aria-label="이전 달"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-airbnb-body font-semibold text-airbnb-black min-w-[120px] text-center">
                  {year}년 {month}월
                </span>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="p-2 rounded-airbnb hover:bg-white"
                  aria-label="다음 달"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goToToday}
                  className="ml-2 px-3 py-1.5 text-airbnb-caption border border-airbnb-light-gray rounded-airbnb hover:bg-white"
                >
                  오늘
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-airbnb-gray">
                로딩 중...
              </div>
            ) : (
              <div className="bg-white rounded-airbnb border border-airbnb-light-gray overflow-hidden relative">
                {selectedRange && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-2 z-10 flex items-center gap-2 px-3 py-2 bg-white border border-minbak-light-gray rounded-airbnb shadow-lg">
                    <span className="text-airbnb-caption text-minbak-black whitespace-nowrap">
                      선택한 날짜 {selectedRange.dateKeys.length}일
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
                      className="px-3 py-1.5 text-sm font-medium rounded-airbnb bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      블락
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
                      className="px-3 py-1.5 text-sm font-medium rounded-airbnb bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      오픈
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRange(null)}
                      className="px-3 py-1.5 text-sm font-medium rounded-airbnb border border-minbak-light-gray text-minbak-black hover:bg-minbak-bg"
                    >
                      취소
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
                  <div className="bg-airbnb-bg border-b border-r border-airbnb-light-gray p-2" />
                  {calendarDays.map((d, i) => (
                    <div
                      key={i}
                      className={`border-b border-r border-airbnb-light-gray p-1 text-center text-airbnb-caption ${
                        d.getMonth() !== month - 1 ? "text-airbnb-gray bg-airbnb-bg/50" : ""
                      } ${toDateKey(d) === todayKey ? "bg-airbnb-red/10 font-medium" : ""}`}
                    >
                      {WEEKDAYS[d.getDay()]} {d.getDate()}
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
                      onCellMouseDown={handleCellMouseDown}
                      onCellMouseEnter={handleCellMouseEnter}
                    />
                  ))}
                </div>
              </div>
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
  onCellMouseDown,
  onCellMouseEnter,
}: {
  listing: ListingWithBookings;
  calendarDays: Date[];
  month: number;
  year: number;
  selectionDateKeys?: Set<string>;
  onCellMouseDown?: (listingId: string, dateKey: string) => void;
  onCellMouseEnter?: (listingId: string, dateKey: string) => void;
}) {
  const todayKey = toDateKey(new Date());
  const blockedSet = useMemo(
    () => new Set(listing.blockedDateKeys ?? []),
    [listing.blockedDateKeys]
  );

  return (
    <>
      <div className="border-b border-r border-airbnb-light-gray p-2 bg-airbnb-bg flex flex-col justify-center">
        <p className="text-airbnb-caption text-airbnb-gray">
          ₩{listing.pricePerNight.toLocaleString()}/박
        </p>
        <Link
          href={`/listing/${listing.id}`}
          className="text-airbnb-body font-medium text-airbnb-black hover:underline truncate mt-0.5"
        >
          {listing.title}
        </Link>
      </div>
      {calendarDays.map((d, colIndex) => {
        const dateKey = toDateKey(d);
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
              className={`border-b border-r border-airbnb-light-gray min-w-[56px] min-h-[52px] p-1 cursor-crosshair ${
                !isCurrentMonth ? "bg-airbnb-bg/30" : ""
              } ${isToday ? "bg-airbnb-red/5" : ""} ${
                isCurrentMonth && isBlocked ? "bg-gray-200/80" : ""
              } ${isSelected ? "ring-2 ring-inset ring-teal-500 bg-teal-50/80" : ""}`}
              style={{ gridColumn: gridCol }}
              title={isCurrentMonth && isBlocked ? "막힌 날짜 (드래그로 선택)" : isCurrentMonth ? "예약 가능 (드래그로 선택)" : undefined}
              onMouseDown={() => {
                onCellMouseDown?.(listing.id, dateKey);
              }}
              onMouseEnter={() => {
                onCellMouseEnter?.(listing.id, dateKey);
              }}
            >
              {isCurrentMonth && !isBlocked && (
                <p className="text-[11px] leading-tight text-airbnb-gray whitespace-nowrap overflow-visible">
                  ₩{listing.pricePerNight.toLocaleString()}
                </p>
              )}
              {isCurrentMonth && isBlocked && (
                <span className="text-airbnb-caption text-gray-500" aria-hidden>
                  막힘
                </span>
              )}
            </div>
          );
        }

        const cin = booking.checkIn.slice(0, 10);
        const cout = booking.checkOut.slice(0, 10);
        const startCol = calendarDays.findIndex((day) => toDateKey(day) >= cin);
        const endCol = calendarDays.findIndex((day) => toDateKey(day) >= cout);
        const span = (endCol === -1 ? calendarDays.length : endCol) - startCol;
        const isFirstDay = toDateKey(calendarDays[startCol]) === dateKey;

        if (!isFirstDay) return null;

        return (
          <div
            key={colIndex}
            className="border-b border-r border-airbnb-light-gray min-h-[52px] p-0.5"
            style={{ gridColumn: `${gridCol} / span ${span}` }}
          >
            <div className="h-full min-w-0 bg-teal-500/90 hover:bg-teal-600/90 rounded px-2 py-1.5 text-white flex flex-col justify-center overflow-hidden">
              <p className="text-airbnb-caption font-medium truncate">
                {booking.guestName}
              </p>
              <p className="text-airbnb-caption opacity-90">
                ₩{booking.totalPrice.toLocaleString()}
              </p>
              <p className="text-airbnb-caption opacity-90">
                {getBookingStatusLabel(
                  booking.status,
                  booking.checkIn,
                  booking.checkOut
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
