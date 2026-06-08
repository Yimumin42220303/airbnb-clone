"use client";

import { createContext, useContext, type ReactNode } from "react";

export type CurrencyDisplayAudience = "guest" | "host";

const CurrencyAudienceContext = createContext<CurrencyDisplayAudience>("guest");

export function CurrencyAudienceProvider({
  audience,
  children,
}: {
  audience: CurrencyDisplayAudience;
  children: ReactNode;
}) {
  return (
    <CurrencyAudienceContext.Provider value={audience}>
      {children}
    </CurrencyAudienceContext.Provider>
  );
}

export function useCurrencyAudience(): CurrencyDisplayAudience {
  return useContext(CurrencyAudienceContext);
}
