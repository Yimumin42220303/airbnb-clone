"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/booking-analytics";
import { useHostTranslations } from "@/components/host/HostLocaleProvider";

export type BadgeType = "verified" | "popular" | "returning" | "new";

const LABEL_KEYS: Record<BadgeType, "listingBadge.verified" | "listingBadge.popular" | "listingBadge.repeat" | "listingBadge.new"> = {
  verified: "listingBadge.verified",
  popular: "listingBadge.popular",
  returning: "listingBadge.repeat",
  new: "listingBadge.new",
};

type Props = {
  type: BadgeType;
  listingId: string;
  size?: "sm" | "md";
};

const STYLE: Record<BadgeType, { icon: string; bg: string; text: string; border: string }> = {
  verified: {
    icon: "✓",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  popular: {
    icon: "🔥",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  returning: {
    icon: "🔄",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  new: {
    icon: "✨",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

export function computeBadges(listing: {
  isVerified?: boolean;
  recentBookingCount?: number;
  returningGuestRate?: number;
  createdAt?: string;
}): BadgeType[] {
  const badges: BadgeType[] = [];
  if (listing.isVerified) badges.push("verified");
  if ((listing.recentBookingCount ?? 0) >= 5) badges.push("popular");
  if ((listing.returningGuestRate ?? 0) >= 0.2) badges.push("returning");
  if (listing.createdAt) {
    const daysOld = (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld <= 30) badges.push("new");
  }
  return badges;
}

export default function ListingBadge({ type, listingId, size = "md" }: Props) {
  const { t } = useHostTranslations();
  const style = STYLE[type];
  const label = t(LABEL_KEYS[type]);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("badge_viewed", { listing_id: listingId, badge_type: type });
  }, [listingId, type]);

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1"
      : "px-2.5 py-1 text-[12px] gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      <span className="leading-none">{style.icon}</span>
      <span>{label}</span>
    </span>
  );
}
