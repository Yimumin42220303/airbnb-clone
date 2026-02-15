"use client";

import { useState } from "react";
import { ListingCard } from "@/components/ui";
import { formatDateDisplay } from "@/lib/date-utils";
import FramerDateRangePicker from "@/components/search/FramerDateRangePicker";
import FramerGuestPicker, {
  defaultGuestCounts,
  formatGuestLabel,
  type GuestCounts,
} from "@/components/search/FramerGuestPicker";
import { Sparkles, Loader2, ChevronDown } from "lucide-react";

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

export default function AIRecommendSection() {
  const [expanded, setExpanded] = useState(false);
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
    <section id="ai-recommend" className="relative overflow-hidden scroll-mt-24">
      {/* 눈에 띄는 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-minbak-primary/10 via-amber-50/80 to-minbak-primary/5" aria-hidden />
      <div className="relative z-10 px-4 py-10 sm:py-12 md:px-6 md:py-14">
        <div className="max-w-[900px] mx-auto">
          {/* 접힌 상태: CTA 배너 */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`w-full text-left transition-all duration-300 ${
              expanded ? "mb-6" : ""
            }`}
            aria-expanded={expanded}
          >
            <div className="flex items-center justify-between gap-4 p-5 md:p-6 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-minbak-primary/20 transition-shadow">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-minbak-primary to-amber-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-minbak-body-lg md:text-minbak-h3 font-bold text-minbak-black">
                    AI 맞춤 숙소 추천
                  </h2>
                  <p className="text-minbak-caption md:text-minbak-body text-minbak-dark-gray mt-0.5 truncate">
                    여행 일정·인원·선호사항 입력 후 AI가 맞춤 숙소를 추천해 드립니다
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`flex-shrink-0 w-6 h-6 text-minbak-primary transition-transform duration-300 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* 펼쳐진 상태: 폼 */}
          {expanded && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-6 shadow-sm">
                <h3 className="text-minbak-body font-semibold text-minbak-black mb-4">여행 정보</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

                <div>
                  <label htmlFor="preferences" className="block text-minbak-caption text-minbak-gray mb-1">
                    선호사항 (자유 입력)
                  </label>
                  <textarea
                    id="preferences"
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="예: 시부야 근처, 조용한 동네, 주방 필수, 와이파이 빠른 곳"
                    className="w-full px-4 py-3 border border-minbak-light-gray rounded-minbak text-minbak-body text-minbak-black placeholder:text-minbak-gray resize-none focus:outline-none focus:ring-2 focus:ring-minbak-primary focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

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
          )}

          {results !== null && results.length > 0 && (
            <div className="mt-8 md:mt-10">
              <h3 className="text-minbak-h3 font-bold text-minbak-black mb-4">
                AI 추천 숙소 {results.length}곳
              </h3>
              {message && (
                <p className="text-minbak-caption text-minbak-gray mb-4">{message}</p>
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
                    <p className="mt-2 text-minbak-caption text-minbak-dark-gray line-clamp-2">
                      <span className="font-medium text-minbak-primary">추천 이유:</span> {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 오버레이를 section의 z-10 스태킹 컨텍스트 바깥에 배치 */}
      {dateOpen && (
        <div
          className="fixed inset-0 z-[10001] flex items-start justify-center pt-[184px] md:pt-[200px] pb-8 px-4 bg-black/40"
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
    </section>
  );
}
