"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/booking-analytics";

type BannerItem = {
  icon: string;
  text: string;
};

const DEFAULT_ITEMS: BannerItem[] = [
  { icon: "💰", text: "도쿄민박 가격 보장 — 에어비앤비보다 최소 5% 저렴" },
  { icon: "🇰🇷", text: "한국어 고객지원 운영" },
  { icon: "📩", text: "예약 후 체크인 안내 24시간 내 제공" },
];

type Props = {
  listingId: string;
  items?: BannerItem[];
  variant?: "default" | "compact";
};

export default function TrustBanner({
  listingId,
  items = DEFAULT_ITEMS,
  variant = "default",
}: Props) {
  const tracked = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tracked.current || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true;
          trackEvent("trust_banner_viewed", { listing_id: listingId });
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [listingId]);

  if (variant === "compact") {
    return (
      <div ref={ref} className="flex flex-wrap gap-2 py-3">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f7f7] text-[12px] text-[#484848] rounded-full"
          >
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="rounded-xl border border-[#e8e8e8] bg-gradient-to-r from-[#f8faf9] to-[#faf8f5] p-4 md:p-5"
    >
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[14px] text-[#222]">
            <span className="flex-shrink-0 w-5 text-center leading-5">{item.icon}</span>
            <span className="leading-5">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
