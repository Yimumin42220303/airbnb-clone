"use client";

import { useState } from "react";
import { Header, Footer } from "@/components/layout";
import { ListingCard } from "@/components/ui";
import FramerDateRangePicker from "@/components/search/FramerDateRangePicker";
import FramerGuestPicker, {
  defaultGuestCounts,
  formatGuestLabel,
  type GuestCounts,
} from "@/components/search/FramerGuestPicker";
import { Sparkles, Loader2 } from "lucide-react";

function formatDateDisplay(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

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

export default function RecommendPage() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<GuestCounts>(defaultGuestCounts);
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
    <>
      <Header />
      <main className="min-h-screen pt-4 md:pt-8 px-4 md:px-6">
        <div className="max-w-[800px] mx-auto">
          <div className="mb-6 md:mb-8">
            <h1 className="text-airbnb-h2 md:text-airbnb-h1 font-bold text-minbak-black flex items-center gap-2">
              <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-minbak-primary" />
              AI 맞춤 숙소 추천
            </h1>
            <p className="mt-2 text-airbnb-body text-minbak-dark-gray">
              여행 일정, 인원, 선호사항을 입력하면 AI가 맞춤 숙소를 추천해 드립니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white border border-minbak-light-gray rounded-airbnb p-4 md:p-6 shadow-sm">
              <h2 className="text-airbnb-body font-semibold text-minbak-black mb-4">여행 정보</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-airbnb-caption text-minbak-gray mb-1">체크인 · 체크아웃</label>
                  <button
                    type="button"
                    onClick={() => setDateOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-airbnb text-left text-airbnb-body hover:border-minbak-primary transition-colors"
                  >
                    <span className="text-minbak-black">
                      {checkIn && checkOut
                        ? `${formatDateDisplay(checkIn)} ~ ${formatDateDisplay(checkOut)}`
                        : "날짜 선택"}
                    </span>
                  </button>
                </div>
                <div>
                  <label className="block text-airbnb-caption text-minbak-gray mb-1">인원</label>
                  <button
                    type="button"
                    onClick={() => setGuestOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-airbnb text-left text-airbnb-body hover:border-minbak-primary transition-colors"
                  >
                    <span className="text-minbak-black">
                      {guests.adult + guests.child + guests.infant > 0
                        ? formatGuestLabel(guests)
                        : "게스트 추가"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="preferences" className="block text-airbnb-caption text-minbak-gray mb-1">
                  선호사항 (자유 입력)
                </label>
                <textarea
                  id="preferences"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="예: 시부야 근처, 조용한 동네, 주방 필수, 와이파이 빠른 곳"
                  className="w-full px-4 py-3 border border-minbak-light-gray rounded-airbnb text-airbnb-body text-minbak-black placeholder:text-minbak-gray resize-none focus:outline-none focus:ring-2 focus:ring-minbak-primary focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-airbnb bg-red-50 border border-red-200 text-red-700 text-airbnb-body">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-airbnb bg-minbak-primary hover:bg-minbak-primary-hover disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold text-airbnb-body flex items-center justify-center gap-2 transition-colors"
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

          {dateOpen && (
            <div
              className="fixed inset-0 z-[10001] flex items-start justify-center pt-28 pb-8 px-4 bg-black/40"
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

          {results !== null && (
            <section className="mt-10 md:mt-12">
              <h2 className="text-airbnb-h3 font-bold text-minbak-black mb-4">
                AI 추천 숙소 {results.length}곳
              </h2>
              {message && (
                <p className="text-airbnb-caption text-minbak-gray mb-4">{message}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                    <p className="mt-2 text-airbnb-caption text-minbak-dark-gray line-clamp-2">
                      <span className="font-medium text-minbak-primary">추천 이유:</span> {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
