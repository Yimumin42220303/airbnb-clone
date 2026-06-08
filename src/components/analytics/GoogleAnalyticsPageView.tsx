"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gaPageView } from "@/lib/google-analytics";

/**
 * App Router 클라이언트 내비게이션마다 page_path 갱신.
 * 최초 로드 PageView는 GoogleAnalyticsScript(gtag config)에서 처리.
 */
export default function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    gaPageView(path);
  }, [pathname, searchParams]);

  return null;
}
