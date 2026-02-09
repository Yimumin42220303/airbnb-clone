/**
 * iCal/ICS 기반 외부 캘린더 연동 (OTA·PMS 중복 예약 방지).
 * 임시: ICS URL Import. 추후 Beds24 등 API 연동 시 동일 getExternalBlockedDates 인터페이스로 플러그인.
 */

import { getDateKeysBetween } from "./availability";

const CACHE_TTL_MS = 15 * 60 * 1000; // 15분

type CacheEntry = { text: string; fetchedAt: number };

const icalCache = new Map<string, CacheEntry>();

function cacheKey(url: string): string {
  return url.trim();
}

/**
 * 단일 ICS URL을 fetch 후 파싱해, 해당 기간 내 막힌 날짜(YYYY-MM-DD) 집합 반환.
 * ICS 본문만 URL별로 캐시하고, 요청한 fromDate~toDate 구간마다 파싱해 해당 월이 올바르게 반영되도록 함.
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
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return new Set();
      text = await res.text();
      icalCache.set(key, { text, fetchedAt: Date.now() });
    } catch {
      return new Set();
    }
  }
  return parseIcsToBlockedDateKeys(text, fromDate, toDate);
}

/**
 * RFC 5545 줄 접기 제거 (CRLF + 공백/탭으로 이어지는 줄 한 줄로 합침)
 */
function unfoldIcs(icsBody: string): string {
  return icsBody.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

/**
 * ICS 본문에서 VEVENT의 DTSTART/DTEND를 파싱해, fromDate~toDate 구간과 겹치는 날짜를 YYYY-MM-DD 집합으로 반환.
 * RRULE 등 복잡한 규칙은 1차 미지원(단일/다중 VEVENT만).
 */
export function parseIcsToBlockedDateKeys(
  icsBody: string,
  fromDate: Date,
  toDate: Date
): Set<string> {
  const unfolded = unfoldIcs(icsBody);
  const out = new Set<string>();
  const veventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/gi;
  let m: RegExpExecArray | null;
  while ((m = veventRegex.exec(unfolded)) !== null) {
    const block = m[0];
    const dtStart = getIcalDate(block, "DTSTART");
    const dtEnd = getIcalDate(block, "DTEND");
    if (!dtStart) continue;
    const start = dtStart;
    const end = dtEnd ?? new Date(start.getTime() + 24 * 60 * 60 * 1000);
    if (end <= fromDate || start >= toDate) continue;
    const rangeStart = start < fromDate ? fromDate : start;
    const rangeEnd = end > toDate ? toDate : end;
    const keys = getDateKeysBetween(rangeStart, rangeEnd);
    keys.forEach((k) => out.add(k));
  }
  return out;
}

function getIcalDate(veventBlock: string, prop: "DTSTART" | "DTEND"): Date | null {
  // VALUE=DATE, TZID 등 다양한 파라미터 후 :YYYYMMDD 또는 :YYYYMMDDThhmmss
  const regex = new RegExp(
    `${prop}(?:;[^:]+)?:([0-9]{8})(?:T([0-9]{6})Z?)?`,
    "i"
  );
  const match = veventBlock.match(regex);
  if (!match) return null;
  const datePart = match[1];
  const timePart = match[2];
  const y = parseInt(datePart.slice(0, 4), 10);
  const m = parseInt(datePart.slice(4, 6), 10) - 1;
  const d = parseInt(datePart.slice(6, 8), 10);
  if (timePart) {
    const h = parseInt(timePart.slice(0, 2), 10);
    const min = parseInt(timePart.slice(2, 4), 10);
    const sec = parseInt(timePart.slice(4, 6), 10);
    const date = new Date(y, m, d, h, min, sec);
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
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
