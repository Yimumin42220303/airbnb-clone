"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  buildListingInquiryTokyominbakFields,
  RECOMMEND_CHANNEL_PROFILE_CLEAR,
  TOKYOMINBAK_CONTEXT_CLEAR_PROFILE,
} from "@/lib/channel-context-summary";
import { parseListingBookingPrefill } from "@/lib/listing-booking-prefill";

type Props = {
  listingId: string;
  listingTitle: string;
  label: string;
  className?: string;
};

/** addTags용: 소문자·채널톡 제한에 맞춤 */
function listingInquiryTag(listingId: string): string {
  return `listing_${listingId}`.toLowerCase().slice(0, 64);
}

const INQUIRY_PROFILE_CLEAR = {
  inquiryListingId: null,
  inquiryListingTitle: null,
  inquiryPageUrl: null,
  lastInquiryListingSummary: null,
  ...TOKYOMINBAK_CONTEXT_CLEAR_PROFILE,
};

/**
 * 숙소 상세에서 채널톡을 열고, 데스크에서 숙소를 식별할 수 있도록 전달합니다.
 * - updateUser.profile: 사용자 카드(데스크에서 프로필 필드 등록 시 표시)
 * - setPage + profile: 새 대화 생성 시 채팅 프로필로 반영(채널톡 문서)
 * - addTags: 사용자 태그 영역에 노출(소문자 태그)
 * - track: 사용자 타임라인 이벤트
 */
export default function ListingChannelInquiryButton({
  listingId,
  listingTitle,
  label,
  className = "",
}: Props) {
  const { data: session } = useSession();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const [opening, setOpening] = useState(false);

  const bookingFromUrl = useMemo(
    () => parseListingBookingPrefill(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  useEffect(() => {
    const tag = listingInquiryTag(listingId);
    return () => {
      if (typeof window === "undefined" || !window.ChannelIO) return;
      try {
        window.ChannelIO("resetPage");
      } catch {
        /* ignore */
      }
      try {
        window.ChannelIO("removeTags", ["listing_inquiry", tag]);
      } catch {
        /* ignore */
      }
      try {
        window.ChannelIO("updateUser", {
          profile: INQUIRY_PROFILE_CLEAR,
        });
      } catch {
        /* ignore */
      }
    };
  }, [listingId]);

  const handleClick = useCallback(() => {
    if (typeof window === "undefined" || !window.ChannelIO) return;
    setOpening(true);
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    const url = origin && pathname ? `${origin}${pathname}` : pathname || "";
    const pageForDesk = url || `/listing/${listingId}`;
    const titleShort = listingTitle.slice(0, 200);
    const summaryForProfile = `${titleShort} · ${listingId}`.slice(0, 500);
    const tag = listingInquiryTag(listingId);

    const guestCount = bookingFromUrl.initialGuests;
    const childCount = bookingFromUrl.initialChildren;
    const infantCount = bookingFromUrl.initialInfants;

    const tokyominbak = buildListingInquiryTokyominbakFields({
      listingId,
      listingTitle: titleShort,
      pageUrl: pageForDesk,
      checkIn: bookingFromUrl.initialCheckIn,
      checkOut: bookingFromUrl.initialCheckOut,
      guestCount,
      childCount,
      infantCount,
    });

    const chatProfile = {
      ...RECOMMEND_CHANNEL_PROFILE_CLEAR,
      inquiryListingId: listingId,
      inquiryListingTitle: titleShort,
      inquiryPageUrl: url.slice(0, 2000),
      lastInquiryListingSummary: summaryForProfile,
      ...tokyominbak,
    };

    try {
      window.ChannelIO("track", "Guest listing inquiry", {
        listingId,
        listingTitle: titleShort,
        pageUrl: url,
        checkIn: bookingFromUrl.initialCheckIn ?? null,
        checkOut: bookingFromUrl.initialCheckOut ?? null,
        guestCount: guestCount ?? null,
        ...tokyominbak,
      });
    } catch {
      /* ignore */
    }

    try {
      window.ChannelIO("setPage", pageForDesk, chatProfile);
    } catch {
      /* ignore */
    }

    try {
      window.ChannelIO("updateUser", {
        profile: {
          ...(session?.user?.name ? { name: session.user.name } : {}),
          ...(session?.user?.email ? { email: session.user.email } : {}),
          ...chatProfile,
        },
      });
    } catch {
      /* ignore */
    }

    try {
      window.ChannelIO("addTags", ["listing_inquiry", tag]);
    } catch {
      /* ignore */
    }

    try {
      window.ChannelIO("showMessenger");
    } catch {
      /* ignore */
    }

    window.setTimeout(() => setOpening(false), 600);
  }, [
    listingId,
    listingTitle,
    pathname,
    session?.user?.email,
    session?.user?.name,
    bookingFromUrl,
  ]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={opening}
      className={`inline-flex items-center justify-center rounded-full border border-minbak-primary bg-white px-4 py-2 text-[13px] font-semibold text-minbak-primary shadow-sm transition-colors hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-minbak-primary disabled:opacity-60 ${className}`}
    >
      {label}
    </button>
  );
}
