"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { t, type HostLocale, type HostTranslationKey } from "@/lib/host-i18n";

const COOKIE_NAME = "host-locale";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

type HostLocaleContextType = {
  locale: HostLocale;
  setLocale: (locale: HostLocale) => void;
  t: (key: HostTranslationKey, params?: Record<string, string | number>) => string;
};

const HostLocaleContext = createContext<HostLocaleContextType | null>(null);

export default function HostLocaleProvider({
  children,
  initialLocale = "ko",
}: {
  children: React.ReactNode;
  initialLocale?: HostLocale;
}) {
  const [locale, setLocaleState] = useState<HostLocale>(initialLocale);

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    const value = match?.[1]?.trim();
    if (value === "ja" || value === "ko") setLocaleState(value);
  }, []);

  const setLocale = useCallback((newLocale: HostLocale) => {
    setLocaleState(newLocale);
    document.cookie = `${COOKIE_NAME}=${newLocale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }, []);

  const tFn = useCallback(
    (key: HostTranslationKey, params?: Record<string, string | number>) => t(locale, key, params),
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t: tFn }), [locale, setLocale, tFn]);

  return <HostLocaleContext.Provider value={value}>{children}</HostLocaleContext.Provider>;
}

export function useHostTranslations(): HostLocaleContextType {
  const ctx = useContext(HostLocaleContext);
  if (!ctx) {
    return {
      locale: "ko",
      setLocale: () => {},
      t: (key: HostTranslationKey, params?: Record<string, string | number>) => t("ko", key, params),
    };
  }
  return ctx;
}
