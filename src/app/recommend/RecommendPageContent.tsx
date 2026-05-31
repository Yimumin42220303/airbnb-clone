"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  RecommendLandingWrapper,
  RecommendExampleSection,
  RecommendFaqSection,
  RecommendBottomCta,
} from "@/components/recommend/RecommendLandingSections";
import { trackRecommendEvent } from "@/lib/recommend-analytics";
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

const TRIP_TYPES: { value: "friends" | "couple" | "family" | "solo"; labelKey: HostTranslationKey }[] = [
  { value: "friends", labelKey: "guest.tripFriends" },
  { value: "couple", labelKey: "guest.tripCouple" },
  { value: "family", labelKey: "guest.tripFamily" },
  { value: "solo", labelKey: "guest.tripSolo" },
];

const PRIORITIES: { value: Priority; labelKey: HostTranslationKey }[] = [
  { value: "value", labelKey: "guest.priorityValue" },
  { value: "rating", labelKey: "guest.priorityRating" },
  { value: "location", labelKey: "guest.priorityLocation" },
  { value: "space", labelKey: "guest.prioritySpace" },
  { value: "environment", labelKey: "guest.priorityEnvironment" },
  { value: "child_friendly", labelKey: "guest.priorityChildFriendly" },
];

type TripType = "friends" | "couple" | "family" | "solo";
type Priority = "value" | "rating" | "location" | "space" | "environment" | "child_friendly";

type ListingFromApi = {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  amenities?: string[];
  isPromoted?: boolean;
  bedrooms?: number;
  maxGuests?: number;
  beds?: number;
};

/** API·후속 단계에서 동일 id가 섞여 들어올 때 한 번만 유지 */
function dedupeListingsById(listings: ListingFromApi[]): ListingFromApi[] {
  const seen = new Set<string>();
  return listings.filter((l) => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });
}

function ruleBasedSort(
  listings: ListingFromApi[],
  priorities: Priority[]
): ListingFromApi[] {
  if (listings.length <= 1) return [...listings];
  const primary = priorities[0];
  const sorted = [...listings];
  if (primary === "value") {
    sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  } else if (primary === "rating") {
    sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else if (primary === "space") {
    sorted.sort((a, b) => {
      const scoreA = (a.bedrooms ?? 0) * 10 + (a.maxGuests ?? 0) + (a.beds ?? 0);
      const scoreB = (b.bedrooms ?? 0) * 10 + (b.maxGuests ?? 0) + (b.beds ?? 0);
      return scoreB - scoreA;
    });
  } else {
    sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  }
  return sorted;
}

function toRecommendItem(
  listing: ListingFromApi,
  rank: number,
  reason: string,
  highlights?: string[]
): RecommendItem {
  return {
    id: listing.id,
    title: listing.title,
    location: listing.location,
    imageUrl: listing.imageUrl,
    price: listing.price,
    rating: listing.rating,
    reviewCount: listing.reviewCount,
    amenities: listing.amenities,
    isPromoted: listing.isPromoted,
    rank,
    reason,
    highlights,
  };
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
  /** AI 추천 근거(리뷰·위치·가격 등). 게스트에게 "왜 이 숙소인지" 보여줌 */
  highlights?: string[];
};

export default function RecommendPageContent() {
  const { t, locale } = useHostTranslations();
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
  const [aiRefining, setAiRefining] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<RecommendItem[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const formStartedRef = useRef(false);
  const dateTrackedRef = useRef(false);
  const guestTrackedRef = useRef(false);

  const markFormStart = () => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      trackRecommendEvent("recommend_form_start");
    }
  };

  useEffect(() => {
    if (checkIn && checkOut && !dateTrackedRef.current) {
      dateTrackedRef.current = true;
      trackRecommendEvent("recommend_date_select", { date_selected: true });
    }
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (results && results.length > 0) {
      trackRecommendEvent("recommend_result_view", {
        result_count: results.length,
        travel_type: tripType || undefined,
        priorities: priorities.join(","),
        guest_count: guests.adult + guests.child,
        date_selected: !!(checkIn && checkOut),
      });
    }
  }, [results, tripType, priorities, guests.adult, guests.child, checkIn, checkOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);
    setMessage(null);
    setAiRefining(false);

    if (!checkIn || !checkOut) {
      setDateOpen(true);
      setError(t("guest.dateRequiredError"));
      return;
    }

    const guestTotal = guests.adult + guests.child;
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guestTotal < 1 ? 1 : guestTotal),
    });

    setLoading(true);
    trackRecommendEvent("recommend_submit", {
      travel_type: tripType || undefined,
      priorities: priorities.slice(0, MAX_PRIORITIES).join(","),
      guest_count: guests.adult + guests.child,
      date_selected: true,
    });
    const recommendBody = {
      checkIn,
      checkOut,
      adults: guests.adult,
      children: guests.child,
      infants: guests.infant,
      tripType: tripType || undefined,
      priorities: priorities.slice(0, MAX_PRIORITIES),
      preferences: preferences.trim(),
      locale,
    };

    const listingsPromise = fetch(`/api/listings?${params}`).then((r) => r.json());

    listingsPromise
      .then(async (listingsData) => {
        if (!Array.isArray(listingsData)) {
          setError(listingsData?.error ?? t("guest.recommendRequestFailed"));
          setLoading(false);
          return;
        }
        const listings: ListingFromApi[] = dedupeListingsById(listingsData);
        if (listings.length === 0) {
          setResults([]);
          setMessage(t("guest.noListingsAvailable"));
          setLoading(false);
          return;
        }
        const sorted = ruleBasedSort(listings, priorities.slice(0, MAX_PRIORITIES));
        const ruleBasedTop5 = sorted.slice(0, 5).map((l, i) =>
          toRecommendItem(l, i + 1, t("guest.ruleBasedReason"), undefined)
        );
        setResults(ruleBasedTop5);
        setMessage(null);
        setLoading(false);
        setAiRefining(true);

        let hasReceivedAny = false;
        try {
          const res = await fetch("/api/recommend/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(recommendBody),
          });
          if (!res.ok) {
            let streamError = t("guest.aiRefineFailedUseRuleBased");
            try {
              const errData = await res.json();
              if (typeof errData?.error === "string" && errData.error.trim()) {
                streamError = errData.error;
              }
            } catch {
              // ignore parsing failure and keep fallback message
            }
            setMessage(streamError);
            return;
          }
          if (!res.body) {
            setMessage(t("guest.aiRefineFailedUseRuleBased"));
            return;
          }
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const raw = line.slice(6).trim();
                if (raw === "" || raw === "[DONE]") continue;
                try {
                  const data = JSON.parse(raw) as { done?: boolean; error?: string } & RecommendItem;
                  if (data.done || data.error) {
                    if (data.error) setMessage(data.error);
                    continue;
                  }
                  const item: RecommendItem = {
                    id: data.id,
                    title: data.title,
                    location: data.location,
                    imageUrl: data.imageUrl,
                    price: data.price,
                    rating: data.rating,
                    reviewCount: data.reviewCount,
                    amenities: data.amenities,
                    isPromoted: data.isPromoted,
                    rank: data.rank,
                    reason: data.reason,
                    highlights: data.highlights,
                  };
                  if (!hasReceivedAny) {
                    setResults([item]);
                    hasReceivedAny = true;
                  } else {
                    setResults((prev) => {
                      if (!prev) return [item];
                      if (prev.some((p) => p.id === item.id)) return prev;
                      return [...prev, item];
                    });
                  }
                } catch {
                  // skip invalid JSON
                }
              }
            }
          }
        } catch {
          setMessage(t("guest.aiRefineFailedUseRuleBased"));
        } finally {
          if (!hasReceivedAny) {
            setMessage((prev) => prev ?? t("guest.aiRefineFailedUseRuleBased"));
          }
          setAiRefining(false);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("guest.networkError"));
        setLoading(false);
        setAiRefining(false);
      });
  };

  return (
    <div className="max-w-[900px] mx-auto px-0 sm:px-2 py-6 md:py-8 pb-24">
      <RecommendLandingWrapper />

      <form id="recommend-form" onSubmit={handleSubmit} className="space-y-6 scroll-mt-28">
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
                onClick={() => {
                  markFormStart();
                  const next = tripType === value ? "" : value;
                  setTripType(next);
                  if (next) trackRecommendEvent("recommend_travel_type_select", { travel_type: next });
                }}
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
                    markFormStart();
                    if (isSelected) setPriorities((prev) => prev.filter((p) => p !== value));
                    else if (priorities.length < MAX_PRIORITIES) {
                      setPriorities((prev) => {
                        const next = [...prev, value];
                        trackRecommendEvent("recommend_priority_select", {
                          priorities: next.join(","),
                        });
                        return next;
                      });
                    }
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
              <label className="block text-minbak-caption text-minbak-gray mb-1">{t("guest.recommendScheduleHint")}</label>
              <button
                type="button"
                onClick={() => {
                  markFormStart();
                  setDateOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 border border-minbak-light-gray rounded-minbak text-left text-minbak-body hover:border-minbak-primary transition-colors"
              >
                <span className="text-minbak-black">
                  {checkIn && checkOut
                    ? `${formatDateDisplay(checkIn, locale)} ~ ${formatDateDisplay(checkOut, locale)}`
                    : t("guest.dateSelect")}
                </span>
              </button>
            </div>
            <div>
              <label className="block text-minbak-caption text-minbak-gray mb-1">{t("guest.recommendGuestsHint")}</label>
              <button
                type="button"
                onClick={() => {
                  markFormStart();
                  setGuestOpen(true);
                }}
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
            onChange={(e) => {
              markFormStart();
              setPreferences(e.target.value);
            }}
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

      {results !== null && results.length === 0 && message && (
        <p className="mt-10 text-minbak-body text-minbak-dark-gray">{message}</p>
      )}
      {results !== null && results.length > 0 && (
        <div className="mt-10">
          <h2 className="text-minbak-h3 font-bold text-minbak-black mb-4">
            {t("guest.aiRecommendResultsCount", { count: results.length })}
          </h2>
          {aiRefining && (
            <div className="mb-4 p-4 bg-minbak-primary/5 border border-minbak-primary/20 rounded-minbak">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-minbak-caption font-medium text-minbak-primary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  {t("guest.aiRefining")}
                </span>
                <span className="text-minbak-body font-semibold text-minbak-primary tabular-nums">
                  {t("guest.progressPercent", {
                    percent: Math.min(100, Math.round((results.length / 5) * 100)),
                  })}
                </span>
              </div>
              <div className="h-2 w-full bg-minbak-primary/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-minbak-primary rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, (results.length / 5) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {message && !aiRefining && (
            <p className="text-minbak-caption text-minbak-gray mb-4">{message}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {results.map((item) => (
              <div key={item.id} className="relative flex flex-col">
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
                <div className="mt-2 space-y-2 flex-1 flex flex-col">
                  <p className="text-minbak-caption text-minbak-dark-gray">
                    <span className="font-medium text-minbak-primary">{t("guest.recommendReason")}:</span>{" "}
                    {item.reason}
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
                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    <Link
                      href={`/listing/${item.id}`}
                      onClick={() =>
                        trackRecommendEvent("recommend_listing_click", {
                          listing_id: item.id,
                          listing_name: item.title,
                          result_count: results.length,
                        })
                      }
                      className="inline-flex items-center justify-center min-h-[40px] flex-1 px-4 py-2 rounded-minbak bg-minbak-primary text-white text-minbak-caption font-semibold hover:bg-minbak-primary-hover transition-colors"
                    >
                      {t("guest.recommendViewListing")}
                    </Link>
                    <Link
                      href={`/listing/${item.id}`}
                      onClick={() => trackRecommendEvent("recommend_booking_start", { listing_id: item.id })}
                      className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-minbak border border-minbak-primary text-minbak-primary text-minbak-caption font-medium hover:bg-minbak-primary/5 transition-colors"
                    >
                      {t("guest.recommendCheckListing")}
                    </Link>
                  </div>
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
          onChange={(next) => {
            setGuests(next);
            const total = next.adult + next.child;
            if (total > 0 && !guestTrackedRef.current) {
              guestTrackedRef.current = true;
              trackRecommendEvent("recommend_guest_count_select", { guest_count: total });
            }
          }}
          onClose={() => setGuestOpen(false)}
        />
      )}

      <RecommendExampleSection />
      <RecommendFaqSection />
      <RecommendBottomCta />
    </div>
  );
}
