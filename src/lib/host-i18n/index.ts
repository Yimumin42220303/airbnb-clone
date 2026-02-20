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

/** 편의시설 이름을 로케일에 맞게 반환. 번역이 없으면 원문(name) 반환 */
export function getAmenityLabel(locale: HostLocale, name: string): string {
  const key = "amenity." + name;
  const ko = hostTranslations.ko as Record<string, string>;
  const ja = hostTranslations.ja as Record<string, string>;
  return (locale === "ja" ? ja[key] : ko[key]) ?? ko[key] ?? name;
}

export { hostTranslations, type HostLocale, type HostTranslationKey };
export { COOKIE_NAME };
