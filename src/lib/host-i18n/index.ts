import { hostTranslations, type HostLocale, type HostTranslationKey } from "./translations";

const COOKIE_NAME = "host-locale";

export function getHostLocaleFromCookie(cookieHeader: string | undefined): HostLocale {
  if (!cookieHeader) return "ko";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const value = match?.[1]?.trim();
  return value === "ja" ? "ja" : "ko";
}

export function t(
  locale: HostLocale,
  key: HostTranslationKey,
  params?: Record<string, string | number>
): string {
  let str = (hostTranslations[locale] as Record<string, string>)[key] ?? (hostTranslations.ko as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

export { hostTranslations, type HostLocale, type HostTranslationKey };
export { COOKIE_NAME };
