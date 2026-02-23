/**
 * Beds24 API V2 연동
 * - 인증: BEDS24_REFRESH_TOKEN → Access Token
 * - 블록일 조회: GET /inventory/rooms/availability
 * - 예약 전송: POST /bookings
 *
 * @see docs/Beds24-API-V2-検証結果.md
 * @see docs/Beds24-連携企画.md
 */

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

type AvailabilityResponse = Record<string, { i?: number }>;

/**
 * Beds24에서 특정 기간의 블록(예약불가) 날짜 키(YYYY-MM-DD) 반환.
 * GET /inventory/rooms/availability 응답에서 inventory(i)=0인 날짜를 블록으로 처리.
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
    const data = (await res.json()) as AvailabilityResponse;
    const blocked = new Set<string>();
    for (const [dateKey, row] of Object.entries(data)) {
      if (!row || typeof row !== "object") continue;
      const inv = row.i;
      if (inv === 0 || inv === undefined) {
        // YYYYMMDD → YYYY-MM-DD
        if (/^\d{8}$/.test(dateKey)) {
          blocked.add(`${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`);
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

  const body: Record<string, unknown> = {
    propId: input.propId,
    roomId: input.roomId,
    arrival: checkInStr,
    departure: checkOutStr,
    numAdult: Math.max(1, input.guests),
    numChild: 0,
    referer: "tokyominbak",
    refererId: input.externalId ?? undefined,
  };
  if (input.guestName) body.firstName = input.guestName.split(/\s+/)[0] ?? "Guest";
  if (input.guestName) body.lastName = input.guestName.split(/\s+/).slice(1).join(" ") || "Guest";
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
