/**
 * Beds24 API V2 연동
 * - 인증: BEDS24_REFRESH_TOKEN → Access Token
 * - 블록일 조회: GET /inventory/rooms/availability
 * - 예약 전송: POST /bookings
 *
 * 캘린더 표시: 예약자명·OTA명만 영문으로 보이도록 firstName/lastName은 로마자로 전송.
 *
 * @see docs/Beds24-API-V2-検証結果.md
 * @see docs/Beds24-連携企画.md
 */

import { fromKana } from "hepburn";
import { romanize as romanizeKorean } from "@romanize/korean";

const BEDS24_BASE = "https://beds24.com/api/v2";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간 (Beds24 권장)

let accessTokenCache: {
  token: string;
  expiresAt: number;
} | null = null;

/**
 * Access Token 획득 (Refresh Token으로 갱신)
 */
async function getAccessToken(): Promise<string | null> {
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN?.trim();
  if (!refreshToken) return null;

  if (accessTokenCache && Date.now() < accessTokenCache.expiresAt - 60_000) {
    return accessTokenCache.token;
  }

  try {
    const res = await fetch(`${BEDS24_BASE}/authentication/token`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        refreshToken,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error("[Beds24] token refresh failed:", res.status, await res.text());
      accessTokenCache = null;
      return null;
    }
    const data = (await res.json()) as { token?: string; expiresIn?: number };
    if (!data.token) return null;
    const expiresIn = typeof data.expiresIn === "number" ? data.expiresIn : 86400;
    accessTokenCache = {
      token: data.token,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    return data.token;
  } catch (err) {
    console.error("[Beds24] token refresh error:", err instanceof Error ? err.message : err);
    accessTokenCache = null;
    return null;
  }
}

/**
 * YYYY-MM-DD → yyyymmdd
 */
function toBeds24Date(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** 영문 표기용: 로마자 문자열을 첫 글자만 대문자로 (예: honggildong → Honggildong) */
function toTitleCase(word: string): string {
  const lower = word.toLowerCase();
  return lower ? lower.replace(/^\w/, (c) => c.toUpperCase()) : word;
}

/** Beds24 캘린더에 '예약자명, tokyominbak' 형태로만 보이도록 게스트 이름을 영문(로마자)으로 변환 */
function guestNameToEnglish(name: string | undefined): string {
  const s = (name ?? "").trim();
  if (!s) return "Guest";
  // 이미 라틴 문자만 있으면 그대로 사용 (공백 정규화)
  if (/^[\x20-\x7E]+$/.test(s)) return s.replace(/\s+/g, " ").trim() || "Guest";
  // 한글 → 국립국어원 로마자 표기법(Revised Romanization)
  if (/[가-힣]/.test(s)) {
    try {
      const romanized = romanizeKorean(s);
      if (romanized && /[A-Za-z]/.test(romanized)) {
        return romanized
          .split(/\s+/)
          .map(toTitleCase)
          .join(" ")
          .trim();
      }
    } catch {
      /* fallback to Guest */
    }
    return "Guest";
  }
  // 일본어 가나 → 로마자
  try {
    const romaji = fromKana(s);
    if (romaji && /[A-Za-z]/.test(romaji)) {
      return romaji
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
    }
  } catch {
    /* 한자 등 변환 실패 시 Guest */
  }
  return "Guest";
}

type Beds24DataItem = {
  roomId?: number;
  propertyId?: number;
  availability?: Record<string, boolean>;
};
type AvailabilityResponse = {
  success?: boolean;
  data?: Beds24DataItem[];
};

/**
 * Beds24에서 특정 기간의 블록(예약불가) 날짜 키(YYYY-MM-DD) 반환.
 * 응답: { data: [{ availability: { "2026-02-23": false, "2026-02-26": true, ... } }] }
 * false = 블록(예약불가), true = 가용
 */
export async function getBeds24BlockedDateKeys(
  propId: string,
  roomId: string,
  fromDate: Date,
  toDate: Date
): Promise<Set<string>> {
  const token = await getAccessToken();
  if (!token) return new Set();

  const from = toBeds24Date(fromDate);
  const to = toBeds24Date(toDate);
  const url = new URL(`${BEDS24_BASE}/inventory/rooms/availability`);
  url.searchParams.set("propId", propId);
  url.searchParams.set("roomId", roomId);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", token },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error("[Beds24] availability failed:", res.status, await res.text());
      return new Set();
    }
    const raw = (await res.json()) as AvailabilityResponse;
    const blocked = new Set<string>();

    const items = Array.isArray(raw?.data) ? raw.data : [];
    for (const item of items) {
      const avail = item?.availability;
      if (!avail || typeof avail !== "object") continue;
      for (const [dateKey, value] of Object.entries(avail)) {
        if (value === false && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
          blocked.add(dateKey);
        }
      }
    }
    return blocked;
  } catch (err) {
    console.error("[Beds24] availability error:", err instanceof Error ? err.message : err);
    return new Set();
  }
}

/** 캐시: propId+roomId+날짜범위 → blocked keys (6h TTL) */
const blockedCache = new Map<string, { keys: Set<string>; expiresAt: number }>();

function blockedCacheKey(propId: string, roomId: string, from: string, to: string): string {
  return `${propId}:${roomId}:${from}:${to}`;
}

/** YYYY-MM-DD 형식으로 변환 */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** from~to 기간 내 YYYY-MM-DD 배열 (to 제외) */
function getDateKeysBetween(fromDate: Date, toDate: Date): string[] {
  const keys: string[] = [];
  const cur = new Date(fromDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  while (cur < end) {
    keys.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

type CalendarRangeItem = {
  from?: string;
  to?: string;
  price1?: number;
  price2?: number;
  price3?: number;
  price4?: number;
  price5?: number;
  price6?: number;
  price7?: number;
  price8?: number;
  price9?: number;
  price10?: number;
  price11?: number;
  price12?: number;
  price13?: number;
  price14?: number;
  price15?: number;
  price16?: number;
};
type CalendarDataItem = {
  roomId?: number;
  propertyId?: number;
  calendar?: CalendarRangeItem[];
};
type CalendarResponse = {
  success?: boolean;
  data?: CalendarDataItem[];
};

/**
 * Beds24 calendar API에서 일별 가격 조회.
 * API V2: startDate/endDate, includePrices=true 필수. calendar는 { from, to, price1..16 }[] 형식.
 * 항상 price1(AirBnB 기준가) 사용. 배율(beds24PriceMultiplier)은 도쿄민박 쪽에서 적용.
 * @returns Map<YYYY-MM-DD, pricePerNight>
 */
export async function getBeds24CalendarPrices(
  propId: string,
  roomId: string,
  fromDate: Date,
  toDate: Date
): Promise<Map<string, number>> {
  const token = await getAccessToken();
  const result = new Map<string, number>();
  if (!token) return result;

  // Beds24 endDate = "last night" = 체크아웃 전날 (공식 문서)
  const lastNight = new Date(toDate);
  lastNight.setDate(lastNight.getDate() - 1);

  // 요청 범위를 앞뒤 60일 확장 (Beds24가 일부 구간만 반환하는 경우 대비)
  const padStart = new Date(fromDate);
  padStart.setDate(padStart.getDate() - 60);
  const padEnd = new Date(lastNight);
  padEnd.setDate(padEnd.getDate() + 60);

  const url = new URL(`${BEDS24_BASE}/inventory/rooms/calendar`);
  url.searchParams.set("propertyId", propId);
  url.searchParams.set("roomId", roomId);
  url.searchParams.set("startDate", toDateKey(padStart));
  url.searchParams.set("endDate", toDateKey(padEnd));
  url.searchParams.set("includePrices", "true");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", token },
      signal: AbortSignal.timeout(30000),
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error("[Beds24] calendar failed:", res.status, await res.text());
      return result;
    }
    const raw = (await res.json()) as CalendarResponse;
    const items = Array.isArray(raw?.data) ? raw.data : [];

    const extractPrices = (key: string) => {
      const map = new Map<string, number>();
      for (const item of items) {
        const ranges = item.calendar;
        if (!Array.isArray(ranges)) continue;
        for (const range of ranges) {
          const fromStr = range.from;
          const toStr = range.to;
          const price = (range as Record<string, unknown>)[key];
          if (typeof price !== "number" || price <= 0 || !fromStr || !toStr) continue;
          const fromD = new Date(fromStr);
          const toD = new Date(toStr);
          if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) continue;
          // Beds24 "to"는 inclusive → 다음 날을 end로
          const toExclusive = new Date(toD);
          toExclusive.setDate(toExclusive.getDate() + 1);
          const dateKeys = getDateKeysBetween(fromD, toExclusive);
          for (const dk of dateKeys) map.set(dk, Math.round(price));
        }
      }
      return map;
    };

    const prices = extractPrices("price1");
    prices.forEach((v, k) => result.set(k, v));
  } catch (err) {
    console.error("[Beds24] calendar error:", err instanceof Error ? err.message : err);
  }
  return result;
}

export async function getBeds24BlockedDateKeysCached(
  propId: string,
  roomId: string,
  fromDate: Date,
  toDate: Date
): Promise<Set<string>> {
  const from = toBeds24Date(fromDate);
  const to = toBeds24Date(toDate);
  const key = blockedCacheKey(propId, roomId, from, to);
  const cached = blockedCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return new Set(cached.keys);
  }
  const keys = await getBeds24BlockedDateKeys(propId, roomId, fromDate, toDate);
  blockedCache.set(key, {
    keys: new Set(keys),
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  return keys;
}

export type Beds24PostBookingInput = {
  propId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  /** 게스트 이름 (선택) */
  guestName?: string;
  /** 게스트 이메일 (선택) */
  guestEmail?: string;
  /** 게스트 전화번호 (선택) */
  guestPhone?: string;
  /** 외부 예약 ID (당 OTA 예약 ID, 추적용) */
  externalId?: string;
};

/**
 * 당 OTA에서 확정된 예약을 Beds24로 전송.
 * 성공 시 Beds24가 해당 기간을 블록하여 타 OTA 중복 예약 방지.
 */
export async function postBeds24Booking(input: Beds24PostBookingInput): Promise<{ ok: boolean; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: "Beds24 인증 정보가 없습니다." };
  }

  const checkInStr = toBeds24Date(input.checkIn);
  const checkOutStr = toBeds24Date(input.checkOut);

  // 캘린더에 '예약자명, tokyominbak' 형태로만 표시되도록 예약자명은 영문(로마자)으로 전송
  const nameEn = guestNameToEnglish(input.guestName);
  const nameParts = nameEn.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] ?? "Guest";
  const lastName = nameParts.slice(1).join(" ") || "Guest";

  const body: Record<string, unknown> = {
    propId: input.propId,
    roomId: input.roomId,
    arrival: checkInStr,
    departure: checkOutStr,
    numAdult: Math.max(1, input.guests),
    numChild: 0,
    referer: "tokyominbak",
    refererId: input.externalId ?? undefined,
    firstName,
    lastName,
  };
  if (input.guestEmail) body.email = input.guestEmail;
  if (input.guestPhone) body.phone = input.guestPhone;

  try {
    const res = await fetch(`${BEDS24_BASE}/bookings`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        token,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    let data: { error?: string; message?: string } = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      /* ignore */
    }
    if (!res.ok) {
      const errMsg = (data.error ?? data.message ?? text) || `HTTP ${res.status}`;
      console.error("[Beds24] POST /bookings failed:", res.status, errMsg);
      return { ok: false, error: errMsg };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Beds24] POST /bookings error:", msg);
    return { ok: false, error: msg };
  }
}
