import { sendMetaPurchaseEvent } from "@/lib/meta-capi";
import { BASE_URL } from "@/lib/site-url";

/** sessionStorage 키 — 결제 직후 브라우저 Purchase 전송용 */
export const META_PURCHASE_PENDING_KEY = "meta_purchase_pending";

export type MetaPurchaseConversion = {
  eventId: string;
  value: number;
  currency: "JPY";
  bookingId: string;
};

export type MetaPurchaseTriggerInput = {
  bookingId: string;
  listingId?: string;
  value: number;
  request?: Request;
  userEmail?: string | null;
  eventSourceUrl?: string;
};

/** 브라우저·CAPI 중복 방지용 결정적 event_id (예약 1건 = Purchase 1건) */
export function createMetaPurchaseEventId(bookingId: string): string {
  return `purchase_${bookingId}`;
}

function getClientIp(request?: Request): string | undefined {
  if (!request) return undefined;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return request.headers.get("x-real-ip") ?? undefined;
}

/**
 * 결제 완료 시 CAPI Purchase 전송(비동기) + 클라이언트용 event_id·금액 반환.
 * verify / mock-verify / webhook 등 결제 완료 핸들러에서 호출.
 */
export function triggerMetaPurchaseConversion(
  input: MetaPurchaseTriggerInput
): MetaPurchaseConversion {
  const eventId = createMetaPurchaseEventId(input.bookingId);
  const conversion: MetaPurchaseConversion = {
    eventId,
    value: input.value,
    currency: "JPY",
    bookingId: input.bookingId,
  };

  void sendMetaPurchaseEvent({
    eventId,
    value: input.value,
    currency: "JPY",
    bookingId: input.bookingId,
    listingId: input.listingId,
    eventSourceUrl: input.eventSourceUrl ?? `${BASE_URL}/booking/complete?id=${input.bookingId}`,
    clientIpAddress: getClientIp(input.request),
    clientUserAgent: input.request?.headers.get("user-agent") ?? undefined,
    userEmail: input.userEmail,
  }).catch((err) => {
    console.error("[meta-purchase] CAPI Purchase failed:", err);
  });

  return conversion;
}

/** 결제 성공 후 브라우저 Pixel 전송 대기 큐(sessionStorage) */
export function stashMetaPurchasePending(conversion: MetaPurchaseConversion): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(META_PURCHASE_PENDING_KEY, JSON.stringify(conversion));
  } catch {
    // ignore quota / private mode
  }
}

export function readMetaPurchasePending(): MetaPurchaseConversion | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(META_PURCHASE_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetaPurchaseConversion;
    if (
      typeof parsed.eventId === "string" &&
      typeof parsed.value === "number" &&
      typeof parsed.bookingId === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearMetaPurchasePending(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(META_PURCHASE_PENDING_KEY);
  } catch {
    // ignore
  }
}
