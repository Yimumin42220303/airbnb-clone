"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";
  const prevRef = useRef<string | null>(null);
  const prevListingRef = useRef<string | null>(null);

  useEffect(() => {
    const current = pathname + (searchParamsString ? `?${searchParamsString}` : "");
    if (prevRef.current === current) return;
    prevRef.current = current;

    if (typeof window.fbq !== "function") return;

    // PageView
    window.fbq("track", "PageView");

    // ViewContent — listing 페이지 진입 시 PageView와 동일 조건으로 발화
    // eventId를 window.__metaVcEventId에 저장 → ListingDetailContent의 CAPI 호출과 공유하여 중복 제거
    const match = pathname.match(/^\/listing\/([^/?#]+)/);
    if (match) {
      const listingId = match[1];
      if (prevListingRef.current !== listingId) {
        prevListingRef.current = listingId;
        const eventId = `vc_${listingId}_${Date.now()}`;
        // CAPI(ListingDetailContent)가 동일 eventId를 읽어 중복 제거에 활용
        (window as Window & { __metaVcEventId?: string }).__metaVcEventId = eventId;
        window.fbq("track", "ViewContent", {
          content_ids: [listingId],
          content_type: "product",
          currency: "JPY",
        }, { eventID: eventId });
      }
    } else {
      prevListingRef.current = null;
      (window as Window & { __metaVcEventId?: string }).__metaVcEventId = undefined;
    }
  }, [pathname, searchParamsString]);

  return null;
}
