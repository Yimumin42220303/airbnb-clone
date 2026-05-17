"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { formatForGuest, formatForHost } from "@/lib/currency";
import { useCurrencyAudience } from "./CurrencyAudienceContext";

type CurrencyContextValue = {
  /** 게스트 화면: KRW. 호스트(/host) 화면: 실수로 호출해도 JPY(저장 통화)로 표시 */
  formatForGuest: (amount: number) => string;
  /** 항상 호스트용 JPY(저장 통화 기준) */
  formatForHost: (amount: number) => string;
  jpyToKrw: number | null;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const audience = useCurrencyAudience();
  const [jpyToKrw, setJpyToKrw] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((res) => res.json())
      .then((data: { jpyToKrw?: number }) => {
        const rate = data?.jpyToKrw;
        if (typeof rate === "number" && rate > 0) setJpyToKrw(rate);
      })
      .catch(() => {});
  }, []);

  const opts = { jpyToKrw: jpyToKrw ?? undefined };

  const formatGuest = useCallback(
    (amount: number) =>
      audience === "host"
        ? formatForHost(amount, opts)
        : formatForGuest(amount, opts),
    [audience, jpyToKrw]
  );

  const formatHost = useCallback(
    (amount: number) => formatForHost(amount, opts),
    [jpyToKrw]
  );

  return (
    <CurrencyContext.Provider
      value={{ formatForGuest: formatGuest, formatForHost: formatHost, jpyToKrw }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    const fallback = (amount: number) => formatForGuest(amount);
    return {
      formatForGuest: fallback,
      formatForHost: (amount: number) => formatForHost(amount),
      jpyToKrw: null,
    };
  }
  return ctx;
}
