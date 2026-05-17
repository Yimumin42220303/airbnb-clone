"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CurrencyAudienceProvider,
  type CurrencyDisplayAudience,
} from "./CurrencyAudienceContext";

/**
 * URL이 /host 로 시작하면 호스트 대시보드로 간주해 금액을 JPY로,
 * 그 외는 게스트 화면으로 간주해 KRW로 표시한다.
 */
export default function CurrencyAudienceFromRoute({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const audience: CurrencyDisplayAudience = pathname.startsWith("/host")
    ? "host"
    : "guest";

  return (
    <CurrencyAudienceProvider audience={audience}>
      {children}
    </CurrencyAudienceProvider>
  );
}
