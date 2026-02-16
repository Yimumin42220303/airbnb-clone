"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { formatDateDisplay } from "@/lib/date-utils";
import FramerDateRangePicker from "@/components/search/FramerDateRangePicker";
import FramerGuestPicker, {
  defaultGuestCounts,
  type GuestCounts,
} from "@/components/search/FramerGuestPicker";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

type Variant = "hero" | "compact";

interface HomeSearchBarProps {
  variant?: Variant;
  className?: string;
}

/** Framer 스타일: 흰색 pill에 체크인·체크아웃·인원 클릭 시 오버레이, 검색 버튼으로 /search 이동 */
export default function HomeSearchBar({
  variant = "hero",
  className = "",
}: HomeSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState<GuestCounts>(defaultGuestCounts);
  const [dateOpen, setDateOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const t = useHostTranslations().t;

  // URL과 동기화 (검색 페이지 및 숙소 상세 페이지에서 query params 반영)
  useEffect(() => {
    const ci = searchParams.get("checkIn");
    const co = searchParams.get("checkOut");
    if (!ci && !co) return; // query params 없으면 스킵
    setCheckIn(ci ?? "");
    setCheckOut(co ?? "");
    const adults = parseInt(searchParams.get("adults") ?? "1", 10);
    const children = parseInt(searchParams.get("children") ?? "0", 10);
    const infants = parseInt(searchParams.get("infants") ?? "0", 10);
    setGuests({
      adult: isNaN(adults) ? 1 : Math.max(1, adults),
      child: isNaN(children) ? 0 : Math.max(0, children),
      infant: isNaN(infants) ? 0 : Math.max(0, infants),
    });
  }, [pathname, searchParams]);

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      setDateOpen(true);
      return;
    }
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(guests.adult),
      children: String(guests.child),
      infants: String(guests.infant),
    });
    router.push(`/search?${params.toString()}`);
    setDateOpen(false);
    setGuestOpen(false);
  };

  const isCompact = variant === "compact";

  return (
    <>
      <div
        className={`
          w-full flex items-center bg-white rounded-[90px]
          shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]
          transition-shadow
          ${isCompact ? "min-h-[44px] md:min-h-[48px] py-3 md:py-[18px] pl-4 pr-1 md:pl-10 md:pr-2 gap-0 md:gap-2" : "min-h-[52px] md:min-h-[56px] px-4 md:px-5 py-3 gap-2 md:gap-4"}
          ${className}
        `}
        style={{ fontFamily: "var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif" }}
      >
        {/* 체크인 */}
        <button
          type="button"
          onClick={() => setDateOpen(true)}
          className="flex-1 min-w-0 flex flex-col items-start py-0.5 md:py-1 px-2 md:px-4 border-r border-minbak-light-gray cursor-pointer text-left"
        >
          <span className="text-[11px] md:text-minbak-caption text-minbak-gray block">{t("guest.checkIn")}</span>
          <span className="text-minbak-body font-medium text-minbak-black truncate w-full">
            {checkIn ? formatDateDisplay(checkIn) : t("guest.addDate")}
          </span>
        </button>
        {/* 체크아웃 */}
        <button
          type="button"
          onClick={() => setDateOpen(true)}
          className="flex-1 min-w-0 flex flex-col items-start py-0.5 md:py-1 px-2 md:px-4 border-r border-minbak-light-gray cursor-pointer text-left"
        >
          <span className="text-[11px] md:text-minbak-caption text-minbak-gray block">{t("guest.checkOut")}</span>
          <span className="text-minbak-body font-medium text-minbak-black truncate w-full">
            {checkOut ? formatDateDisplay(checkOut) : t("guest.addDate")}
          </span>
        </button>
        {/* 인원 */}
        <button
          type="button"
          onClick={() => setGuestOpen(true)}
          className="flex-1 min-w-0 flex flex-col items-start py-0.5 md:py-1 px-2 md:px-4 cursor-pointer text-left"
        >
          <span className="text-[11px] md:text-minbak-caption text-minbak-gray block">{t("guest.guests")}</span>
          <span className="text-minbak-body font-medium text-minbak-black truncate w-full">
            {guests.adult + guests.child + guests.infant > 0
              ? (guests.infant > 0
                  ? t("guest.guestCountWithInfant", { total: String(guests.adult + guests.child), infant: String(guests.infant) })
                  : t("guest.guestCount", { total: String(guests.adult + guests.child) }))
              : t("guest.addGuests")}
          </span>
        </button>
        {/* 검색 버튼 */}
        <button
          type="button"
          onClick={handleSearch}
          className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-minbak-primary flex items-center justify-center text-white hover:bg-minbak-primary-hover transition-colors"
          aria-label={t("guest.search")}
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* 날짜 오버레이 */}
      {dateOpen && (
        <div
          className="fixed inset-0 z-[10001] flex items-start justify-center pt-[184px] md:pt-[200px] pb-8 px-4 bg-black/40"
          onClick={() => setDateOpen(false)}
          role="presentation"
        >
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
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

      {/* 인원 오버레이 */}
      {guestOpen && (
        <FramerGuestPicker
          counts={guests}
          onChange={setGuests}
          onClose={() => setGuestOpen(false)}
        />
      )}
    </>
  );
}
