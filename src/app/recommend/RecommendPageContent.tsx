"use client";

import { useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/ui";
import { formatDateDisplay } from "@/lib/date-utils";
import FramerDateRangePicker from "@/components/search/FramerDateRangePicker";
import FramerGuestPicker, {
  defaultGuestCounts,
  formatGuestLabel,
  type GuestCounts,
} from "@/components/search/FramerGuestPicker";
import { Sparkles, Loader2, Users, Target, Calendar, MessageSquare } from "lucide-react";

const TRIP_TYPES = [
  { value: "friends", label: "친구" },
  { value: "couple", label: "커플" },
  { value: "family", label: "가족" },
] as const;

const PRIORITIES = [
  { value: "value", label: "가성비 중시" },
  { value: "rating", label: "평점 중시" },
  { value: "location", label: "위치 중시" },
] as const;

type TripType = (typeof TRIP_TYPES)[number]["value"];
type Priority = (typeof PRIORITIES)[number]["value"];

type RecommendItem = {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  isPromoted?: boolean;
  rank: number;
  reason: string;
};

export default function RecommendPageContent() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<GuestCounts>(defaultGuestCounts);
  const [tripType, setTripType] = useState<TripType | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [preferences, setPreferences] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<RecommendItem[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);
    setMessage(null);

    if (!checkIn || !checkOut) {
      setDateOpen(true);
      setError("체크인·체크아웃 날짜를 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkIn,
          checkOut,
          adults: guests.adult,
          children: guests.child,
          infants: guests.infant,
          tripType: tripType || undefined,
          priority: priority || undefined,
          preferences: preferences.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "추천 요청에 실패했습니다.");
        return;
      }

      setResults(data.listings ?? []);
      setMessage(data.message ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8 pb-24">
      <div className="mb-8">
        <h1 className="text-minbak-h2 font-bold text-minbak-black flex items-center gap-2">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-minbak-primary to-amber-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </span>
          AI 맞춤 숙소 추천
        </h1>
        <p className="text-minbak-body text-minbak-dark-gray mt-2">
          여행 유형·우선순위·일정을 입력하면 AI가 맞춤 숙소를 추천해 드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 여행 유형 */}
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-minbak-primary" />
            누구와 여행하나요?
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRIP_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTripType(tripType === value ? "" : value)}
                className={`px-4 py-2.5 rounded-minbak text-minbak-body font-medium border transition-colors ${
                  tripType === value
                    ? "bg-minbak-primary text-white border-minbak-primary"
                    : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 우선순위 */}
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-minbak-primary" />
            무엇을 가장 중요하게 보시나요?
          </h2>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(priority === value ? "" : value)}
                className={`px-4 py-2.5 rounded-minbak text-minbak-body font-medium border transition-colors ${
                  priority === value
                    ? "bg-minbak-primary text-white border-minbak-primary"
                    : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* 일정 · 인원 */}
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-minbak-primary" />
            여행 일정
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-minbak-caption text-minbak-gray mb-1">체크인 · 체크아웃</label>
              <button
                type="button"
                onClick={() => setDateOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak text-left text-minbak-body hover:border-minbak-primary transition-colors"
              >
                <span className="text-minbak-black">
                  {checkIn && checkOut
                    ? `${formatDateDisplay(checkIn)} ~ ${formatDateDisplay(checkOut)}`
                    : "날짜 선택"}
                </span>
              </button>
            </div>
            <div>
              <label className="block text-minbak-caption text-minbak-gray mb-1">인원</label>
              <button
                type="button"
                onClick={() => setGuestOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak text-left text-minbak-body hover:border-minbak-primary transition-colors"
              >
                <span className="text-minbak-black">
                  {guests.adult + guests.child + guests.infant > 0
                    ? formatGuestLabel(guests)
                    : "게스트 추가"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* 선호사항 자유 입력 */}
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-minbak-primary" />
            그 외 선호사항 (선택)
          </h2>
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="예: 시부야 근처, 조용한 동네, 주방 필수, 와이파이 빠른 곳"
            className="w-full px-4 py-3 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black placeholder:text-minbak-gray resize-none focus:outline-none focus:ring-2 focus:ring-minbak-primary focus:border-transparent"
            rows={3}
          />
        </section>

        {error && (
          <div className="p-4 rounded-minbak bg-red-50 border border-red-200 text-red-700 text-minbak-body">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-minbak bg-minbak-primary hover:bg-minbak-primary-hover disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-minbak-body flex items-center justify-center gap-2 transition-colors shadow-lg shadow-minbak-primary/25"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI가 추천 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              AI 추천 받기
            </>
          )}
        </button>
      </form>

      {results !== null && results.length > 0 && (
        <div className="mt-10">
          <h2 className="text-minbak-h3 font-bold text-minbak-black mb-4">
            AI 추천 숙소 {results.length}곳
          </h2>
          {message && (
            <p className="text-minbak-caption text-minbak-gray mb-4">{message}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {results.map((item) => (
              <div key={item.id} className="relative">
                <div className="absolute top-2 left-2 z-10">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-minbak-primary text-white text-sm font-bold shadow-md">
                    {item.rank}
                  </span>
                </div>
                <ListingCard
                  id={item.id}
                  title={item.title}
                  location={item.location}
                  imageUrl={item.imageUrl}
                  price={item.price}
                  rating={item.rating}
                  reviewCount={item.reviewCount}
                  amenities={item.amenities}
                  isPromoted={item.isPromoted}
                />
                <p className="mt-2 text-minbak-caption text-minbak-dark-gray line-clamp-2">
                  <span className="font-medium text-minbak-primary">추천 이유:</span> {item.reason}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-minbak-caption text-minbak-gray text-center">
            <Link href="/search" className="text-minbak-primary hover:underline">
              조건을 바꿔서 검색하기
            </Link>
          </p>
        </div>
      )}

      {dateOpen && (
        <div
          className="fixed inset-0 z-[10001] flex items-start justify-center pt-[calc(184px+env(safe-area-inset-top,0px))] md:pt-[200px] pb-8 px-4 bg-black/40"
          onClick={() => setDateOpen(false)}
          role="presentation"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <FramerDateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onCheckInChange={setCheckIn}
              onCheckOutChange={setCheckOut}
              onClose={() => setDateOpen(false)}
              compact={typeof window !== "undefined" && window.innerWidth < 768}
            />
          </div>
        </div>
      )}

      {guestOpen && (
        <FramerGuestPicker
          counts={guests}
          onChange={setGuests}
          onClose={() => setGuestOpen(false)}
        />
      )}
    </div>
  );
}
