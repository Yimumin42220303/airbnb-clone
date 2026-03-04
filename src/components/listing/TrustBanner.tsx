"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/booking-analytics";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

type BannerItem = {
  icon: string;
  text: string;
};

type Props = {
  listingId: string;
  items?: BannerItem[];
  variant?: "default" | "compact";
};

const DEFAULT_ITEM_KEYS = [
  { icon: "💰", key: "trustBanner.priceGuarantee" as const },
  { icon: "🇰🇷", key: "trustBanner.koreanSupport" as const },
  { icon: "📩", key: "trustBanner.checkinGuide" as const },
];

export default function TrustBanner({
  listingId,
  items: itemsProp,
  variant = "default",
}: Props) {
  const { t } = useHostTranslations();
  const items: BannerItem[] =
    itemsProp ??
    DEFAULT_ITEM_KEYS.map(({ icon, key }) => ({ icon, text: t(key) }));
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
