/**
 * iCal/ICS 기반 외부 캘린더 연동 (OTA·PMS 중복 예약 방지).
 * 임시: ICS URL Import. 추후 Beds24 등 API 연동 시 동일 getExternalBlockedDates 인터페이스로 플러그인.
 */

import { getDateKeysBetween, toDateKey } from "./availability";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15분

type CacheEntry = { text: string; fetchedAt: number };

const icalCache = new Map<string, CacheEntry>();

function cacheKey(url: string): string {
  return url.trim();
}

/**
 * 캐시 무효화: 해당 URL들의 ICS 캐시를 지워 다음 fetch 시 최신 데이터를 가져옵니다.
 */
export function invalidateIcalCacheForUrls(urls: string[]): void {
  for (const url of urls) {
    const u = url?.trim?.();
    if (u) icalCache.delete(cacheKey(u));
  }
}

/**
 * 단일 ICS URL을 fetch 후 파싱해, 해당 기간 내 막힌 날짜(YYYY-MM-DD) 집합 반환.
 * ICS 본문만 URL별로 캐시하고, 요청한 fromDate~toDate 구간마다 파싱해 해당 월이 올바르게 반영되도록 함.
 * Airbnb 캘린더의 모든 블록(예약·수동막힘·타채널 동기화)을 반영.
 */
export async function fetchIcsBlockedDateKeys(
  url: string,
  fromDate: Date,
  toDate: Date
): Promise<Set<string>> {
  const key = cacheKey(url);
  let text: string | null = null;
  const cached = icalCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    text = cached.text;
  }
  if (!text) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/calendar, text/plain, */*",
        },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (!res.ok) {
        console.error(`[iCal] fetch failed: ${url} status=${res.status}`);
        return new Set();
      }
      text = await res.text();
      if (!text || text.trim().length < 50) {
        console.error(`[iCal] empty or invalid response: ${url}`);
        return new Set();
      }
      icalCache.set(key, { text, fetchedAt: Date.now() });
    } catch (err) {
      console.error(`[iCal] fetch error: ${url}`, err instanceof Error ? err.message : err);
      return new Set();
    }
  }
  return parseIcsToBlockedDateKeys(text, fromDate, toDate, url);
}

/**
 * RFC 5545 줄 접기 제거 (CRLF + 공백/탭으로 이어지는 줄 한 줄로 합침)
 */
function unfoldIcs(icsBody: string): string {
  return icsBody.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

/**
 * STATUS:CANCELLED 여부 확인 (VEVENT에서 취소된 이벤트 제외)
 */
function isCancelled(veventBlock: string): boolean {
  return /STATUS:CANCELLED/i.test(veventBlock);
}

/**
 * DURATION 파싱 (PT24H=1일, P3D=3일 등) → 밀리초 반환
 */
function getIcalDuration(veventBlock: string): number | null {
  const match = veventBlock.match(/DURATION(?:;[^:]+)?:P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/i);
  if (!match) return null;
  const days = parseInt(match[1] ?? "0", 10);
  const hours = parseInt(match[2] ?? "0", 10);
  const minutes = parseInt(match[3] ?? "0", 10);
  const seconds = parseInt(match[4] ?? "0", 10);
  return (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000;
}

/**
 * ICS 본문에서 VEVENT의 DTSTART/DTEND(또는 DURATION)를 파싱해, fromDate~toDate 구간과 겹치는 날짜를 YYYY-MM-DD 집합으로 반환.
 * Airbnb·Booking.com 등 OTA 캘린더의 모든 블록(예약·수동막힘)을 반영. STATUS:CANCELLED는 제외.
 * RRULE 등 복잡한 규칙은 1차 미지원(단일/다중 VEVENT만).
 *
 * iCal DTEND은 exclusive: 체크인 3/16, 체크아웃 3/20 → DTEND:3/21, 막힌 날은 3/16~3/20 (Airbnb 형식).
 * 표준: DTEND:3/20이면 3/16~3/19만 막음. Airbnb는 DTEND가 체크아웃 다음날(3/21)로 올 수 있음.
 */
export function parseIcsToBlockedDateKeys(
  icsBody: string,
  fromDate: Date,
  toDate: Date,
  _icsUrl?: string
): Set<string> {
  const unfolded = unfoldIcs(icsBody);
  const out = new Set<string>();
  const veventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/gi;
  let m: RegExpExecArray | null;
  while ((m = veventRegex.exec(unfolded)) !== null) {
    const block = m[0];
    if (isCancelled(block)) continue;
    const dtStart = getIcalDate(block, "DTSTART");
    if (!dtStart) continue;
    let end: Date;
    const dtEnd = getIcalDate(block, "DTEND");
    if (dtEnd) {
      end = dtEnd;
    } else {
      const dur = getIcalDuration(block);
      end = dur != null
        ? new Date(dtStart.getTime() + dur)
        : new Date(dtStart.getTime() + 24 * 60 * 60 * 1000);
    }
    if (end <= fromDate || dtStart >= toDate) continue;
    const rangeStart = dtStart < fromDate ? fromDate : dtStart;
    const rangeEnd = end > toDate ? toDate : end;
    const keys = getDateKeysBetween(rangeStart, rangeEnd);
    keys.forEach((k) => out.add(k));
  }
  return out;
}

function getIcalDate(veventBlock: string, prop: "DTSTART" | "DTEND"): Date | null {
  // VALUE=DATE, TZID 등 다양한 파라미터 후 :YYYYMMDD 또는 :YYYYMMDDThhmmss(Z)
  const regex = new RegExp(
    `${prop}(?:;[^:]+)?:([0-9]{8})(?:T([0-9]{6})(Z)?)?`,
    "i"
  );
  const match = veventBlock.match(regex);
  if (!match) return null;
  const datePart = match[1];
  const timePart = match[2];
  const isUtc = match[3] === "Z" || match[3] === "z";
  const y = parseInt(datePart.slice(0, 4), 10);
  const m = parseInt(datePart.slice(4, 6), 10) - 1;
  const d = parseInt(datePart.slice(6, 8), 10);
  if (timePart) {
    const h = parseInt(timePart.slice(0, 2), 10);
    const min = parseInt(timePart.slice(2, 4), 10);
    const sec = parseInt(timePart.slice(4, 6), 10);
    const date = isUtc
      ? new Date(Date.UTC(y, m, d, h, min, sec))
      : new Date(y, m, d, h, min, sec);
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
}

/** DTEND의 날짜 문자열(YYYYMMDD)를 YYYY-MM-DD로 반환. 타임존 없이 ICS 원본 그대로 사용. */
function getIcalDateKey(veventBlock: string, prop: "DTSTART" | "DTEND"): string | null {
  const regex = new RegExp(
    `${prop}(?:;[^:]+)?:([0-9]{8})(?:T[0-9]{6}(Z)?)?`,
    "i"
  );
  const match = veventBlock.match(regex);
  if (!match) return null;
  const datePart = match[1];
  return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
}

/**
 * 숙소의 외부 캘린더(ICS Import URL 목록)에서 해당 기간에 막힌 날짜 집합 반환.
 * 추후 Beds24 API 연동 시 이 함수 내부에서 API 소스를 추가로 호출해 같은 Set에 merge하면 됨.
 */
export async function getExternalBlockedDateKeys(
  listingId: string,
  checkIn: Date,
  checkOut: Date
): Promise<Set<string>> {
  const { prisma } = await import("./prisma");
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { icalImportUrls: true },
  });
  if (!listing?.icalImportUrls) return new Set();

  let urls: string[] = [];
  try {
    const arr = JSON.parse(listing.icalImportUrls);
    urls = Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string" && u.trim().length > 0) : [];
  } catch {
    return new Set();
  }

  const merged = new Set<string>();
  for (const url of urls) {
    const keys = await fetchIcsBlockedDateKeys(url, checkIn, checkOut);
    keys.forEach((k) => merged.add(k));
  }

  // 추후: Beds24 등 API 소스에서 blocked dates 조회 후 merged에 add

  return merged;
}

/**
 * ICS에서 체크아웃 전용 날짜 추출:
 * 1) 체크아웃일(DTEND): 전날 게스트 퇴실 → 당일 체크인 불가, 체크아웃만 가능
 * 2) 체크인일(DTSTART): 당일 오후 다음 게스트 체크인 → 당일 오전에는 체크아웃 가능 (체크인은 주로 15시 이후)
 *
 * Airbnb iCal: DTEND이 마지막 숙박일을 가리킬 수 있음(체크아웃 00:00).
 * 표준 iCal: DTEND exclusive → 체크아웃일 = DTEND 날짜.
 * Airbnb 계열 URL이면 DTEND+1일을 체크아웃일로 사용.
 */
export function parseIcsToCheckoutOnlyDateKeys(
  icsBody: string,
  fromDate: Date,
  toDate: Date,
  icsUrl?: string
): Set<string> {
  const unfolded = unfoldIcs(icsBody);
  const out = new Set<string>();
  const fromKey = toDateKey(fromDate);
  const toKey = toDateKey(toDate);
  const isAirbnbFormat = !!(icsUrl && /airbnb\.com|airbnb\.co\.|airbnb\.co\.kr|ical\/\d+/.test(icsUrl));
  const veventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/gi;
  let m: RegExpExecArray | null;
  while ((m = veventRegex.exec(unfolded)) !== null) {
    const block = m[0];
    if (isCancelled(block)) continue;
    const dtStart = getIcalDate(block, "DTSTART");
    if (!dtStart) continue;
    let end: Date;
    const dtEnd = getIcalDate(block, "DTEND");
    if (dtEnd) {
      end = dtEnd;
    } else {
      const dur = getIcalDuration(block);
      end = dur != null
        ? new Date(dtStart.getTime() + dur)
        : new Date(dtStart.getTime() + 24 * 60 * 60 * 1000);
    }
    if (end <= fromDate || dtStart >= toDate) continue;

    // 1) 체크아웃일
    let checkoutKey: string | null = null;
    const dtEndKey = getIcalDateKey(block, "DTEND");
    if (dtEndKey) {
      if (isAirbnbFormat) {
        const d = new Date(dtEndKey + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + 1);
        checkoutKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      } else {
        checkoutKey = dtEndKey;
      }
    } else {
      checkoutKey = toDateKey(end);
    }
    if (checkoutKey && checkoutKey >= fromKey && checkoutKey < toKey) {
      out.add(checkoutKey);
    }

    // 2) 체크인일 (다른 게스트 체크인일 = 전 게스트가 오전 체크아웃 가능)
    const checkInKey = getIcalDateKey(block, "DTSTART") ?? toDateKey(dtStart);
    if (checkInKey >= fromKey && checkInKey < toKey) {
      out.add(checkInKey);
    }
  }
  return out;
}

/**
 * 숙소의 외부 캘린더(ICS)에서 체크아웃 전용 날짜 집합 반환.
 */
export async function getExternalCheckoutOnlyDateKeys(
  listingId: string,
  fromDate: Date,
  toDate: Date
): Promise<Set<string>> {
  const { prisma } = await import("./prisma");
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { icalImportUrls: true },
  });
  if (!listing?.icalImportUrls) return new Set();

  let urls: string[] = [];
  try {
    const arr = JSON.parse(listing.icalImportUrls);
    urls = Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string" && u.trim().length > 0) : [];
  } catch {
    return new Set();
  }

  const merged = new Set<string>();
  for (const url of urls) {
    const key = cacheKey(url);
    let text: string | null = null;
    const cached = icalCache.get(key);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      text = cached.text;
    }
    if (!text) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "text/calendar, text/plain, */*",
          },
          signal: AbortSignal.timeout(15000),
          cache: "no-store",
        });
        if (!res.ok) continue;
        text = await res.text();
        icalCache.set(key, { text, fetchedAt: Date.now() });
      } catch {
        continue;
      }
    }
    const keys = parseIcsToCheckoutOnlyDateKeys(text, fromDate, toDate, url);
    keys.forEach((k) => merged.add(k));
  }
  return merged;
}

/**
 * checkIn~checkOut 구간 중 하루라도 외부 캘린더에서 막혀 있으면 true.
 */
export async function hasExternalBlockedOverlap(
  listingId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const blocked = await getExternalBlockedDateKeys(listingId, checkIn, checkOut);
  const rangeKeys = getDateKeysBetween(checkIn, checkOut);
  return rangeKeys.some((k) => blocked.has(k));
}
