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

type CurrencyContextValue = {
  formatForGuest: (amount: number) => string;
  formatForHost: (amount: number) => string;
  jpyToKrw: number | null;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
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

  const formatGuest = useCallback(
    (amount: number) => formatForGuest(amount, { jpyToKrw: jpyToKrw ?? undefined }),
    [jpyToKrw]
  );

  const formatHost = useCallback(
    (amount: number) => formatForHost(amount, { jpyToKrw: jpyToKrw ?? undefined }),
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
