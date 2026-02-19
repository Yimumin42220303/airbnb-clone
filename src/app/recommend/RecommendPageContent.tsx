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
import type { HostTranslationKey } from "@/lib/host-i18n";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

const TRIP_TYPES: { value: "friends" | "couple" | "family"; labelKey: HostTranslationKey }[] = [
  { value: "friends", labelKey: "guest.tripFriends" },
  { value: "couple", labelKey: "guest.tripCouple" },
  { value: "family", labelKey: "guest.tripFamily" },
];

const PRIORITIES: { value: Priority; labelKey: HostTranslationKey }[] = [
  { value: "value", labelKey: "guest.priorityValue" },
  { value: "rating", labelKey: "guest.priorityRating" },
  { value: "location", labelKey: "guest.priorityLocation" },
  { value: "space", labelKey: "guest.prioritySpace" },
  { value: "environment", labelKey: "guest.priorityEnvironment" },
  { value: "child_friendly", labelKey: "guest.priorityChildFriendly" },
];

type TripType = "friends" | "couple" | "family";
type Priority = "value" | "rating" | "location" | "space" | "environment" | "child_friendly";

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
  /** AI 추천 근거(리뷰·위치·가격 등). 게스트에게 "왜 이 숙소인지" 보여줌 */
  highlights?: string[];
};

export default function RecommendPageContent() {
  const t = useHostTranslations().t;
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<GuestCounts>(defaultGuestCounts);
  const [tripType, setTripType] = useState<TripType | "">("");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const MAX_PRIORITIES = 3;
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
      setError(t("guest.dateRequiredError"));
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
          priorities: priorities.slice(0, MAX_PRIORITIES),
          preferences: preferences.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("guest.recommendRequestFailed"));
        return;
      }

      setResults(data.listings ?? []);
      setMessage(data.message ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("guest.networkError"));
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
          {t("guest.aiRecommendTitle")}
        </h1>
        <p className="text-minbak-body text-minbak-dark-gray mt-2">
          {t("guest.aiRecommendDesc")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 여행 유형 */}
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-minbak-primary" />
            {t("guest.whoTravelWith")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRIP_TYPES.map(({ value, labelKey }) => (
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
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        {/* 우선순위 (최대 3개) */}
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-minbak-primary" />
            {t("guest.whatMattersMost")}
          </h2>
          <p className="text-minbak-caption text-minbak-gray mb-3">
            {t("guest.priorityMaxSelect", { max: MAX_PRIORITIES })} · <span className="font-medium text-minbak-dark-gray">{t("guest.prioritySelectCount", { current: priorities.length, max: MAX_PRIORITIES })}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map(({ value, labelKey }) => {
              const isSelected = priorities.includes(value);
              const isDisabled = !isSelected && priorities.length >= MAX_PRIORITIES;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    if (isSelected) setPriorities((prev) => prev.filter((p) => p !== value));
                    else if (priorities.length < MAX_PRIORITIES) setPriorities((prev) => [...prev, value]);
                  }}
                  disabled={isDisabled}
                  className={`px-4 py-2.5 rounded-minbak text-minbak-body font-medium border transition-colors ${
                    isSelected
                      ? "bg-minbak-primary text-white border-minbak-primary"
                      : isDisabled
                        ? "bg-[#f5f5f5] text-minbak-gray border-[#e5e5e5] cursor-not-allowed"
                        : "bg-white text-minbak-black border-minbak-light-gray hover:border-minbak-primary/50"
                  }`}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
        </section>

        {/* 일정 · 인원 */}
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-minbak-primary" />
            {t("guest.travelInfo")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-minbak-caption text-minbak-gray mb-1">{t("guest.checkInCheckOut")}</label>
              <button
                type="button"
                onClick={() => setDateOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak text-left text-minbak-body hover:border-minbak-primary transition-colors"
              >
                <span className="text-minbak-black">
                  {checkIn && checkOut
                    ? `${formatDateDisplay(checkIn)} ~ ${formatDateDisplay(checkOut)}`
                    : t("guest.dateSelect")}
                </span>
              </button>
            </div>
            <div>
              <label className="block text-minbak-caption text-minbak-gray mb-1">{t("guest.guests")}</label>
              <button
                type="button"
                onClick={() => setGuestOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak text-left text-minbak-body hover:border-minbak-primary transition-colors"
              >
                <span className="text-minbak-black">
                  {guests.adult + guests.child + guests.infant > 0
                    ? (guests.infant > 0
                      ? t("guest.guestCountWithInfant", { total: guests.adult + guests.child, infant: guests.infant })
                      : t("guest.guestCount", { total: guests.adult + guests.child }))
                    : t("guest.addGuests")}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* 선호사항 자유 입력 */}
        <section className="bg-white border border-minbak-light-gray rounded-minbak p-4 md:p-5 shadow-sm">
          <h2 className="text-minbak-body font-semibold text-minbak-black mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-minbak-primary" />
            {t("guest.preferencesOptional")}
          </h2>
          <textarea
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder={t("guest.preferencesPlaceholder")}
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
              {t("guest.aiRecommendLoading")}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t("guest.aiRecommendCta")}
            </>
          )}
        </button>
      </form>

      {results !== null && results.length > 0 && (
        <div className="mt-10">
          <h2 className="text-minbak-h3 font-bold text-minbak-black mb-4">
            {t("guest.aiRecommendResultsCount", { count: results.length })}
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
                <div className="mt-2 space-y-1">
                  <p className="text-minbak-caption text-minbak-dark-gray">
                    <span className="font-medium text-minbak-primary">{t("guest.recommendReason")}:</span> {item.reason}
                  </p>
                  {item.highlights && item.highlights.length > 0 && (
                    <div className="text-minbak-caption text-minbak-gray">
                      <span className="font-medium text-minbak-dark-gray">{t("guest.recommendGrounds")}:</span>
                      <ul className="mt-0.5 list-disc list-inside space-y-0.5">
                        {item.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-minbak-caption text-minbak-gray text-center">
            <Link href="/search" className="text-minbak-primary hover:underline">
              {t("guest.changeConditionsSearch")}
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
          <div className="flex justify-center w-full max-w-[calc(100vw-2rem)]" onClick={(e) => e.stopPropagation()}>
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
