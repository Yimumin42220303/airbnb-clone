import { sendMetaPurchaseEventWithRetry } from "@/lib/meta-capi";
import { BASE_URL } from "@/lib/site-url";

/** sessionStorage 키 — 결제 직후 브라우저 Purchase 전송용 */
export const META_PURCHASE_PENDING_KEY = "meta_purchase_pending";

export type MetaPurchaseConversion = {
  eventId: string;
  value: number;
  currency: "JPY";
  bookingId: string;
  listingId?: string;
};

export type MetaCapiSendStatus = "success" | "skipped" | "failed";

export type MetaPurchaseConversionResult = MetaPurchaseConversion & {
  capiStatus: MetaCapiSendStatus;
  capiError?: string;
};

export type MetaPurchaseTriggerInput = {
  bookingId: string;
  listingId?: string;
  value: number;
  request?: Request;
  userEmail?: string | null;
  userPhone?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  fbc?: string | null;
  fbp?: string | null;
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
 * webhook 등 fire-and-forget 경로용.
 */
export function triggerMetaPurchaseConversion(
  input: MetaPurchaseTriggerInput
): MetaPurchaseConversion {
  const result = buildMetaPurchaseConversion(input);
  void sendMetaPurchaseCapi(input, result.eventId).catch((err) => {
    console.error("[meta-purchase] CAPI Purchase failed:", err);
  });
  return result;
}

/**
 * verify API용 — CAPI 전송 완료 여부를 await하여 프론트 디버그/응답에 포함.
 */
export async function triggerMetaPurchaseConversionAsync(
  input: MetaPurchaseTriggerInput
): Promise<MetaPurchaseConversionResult> {
  const conversion = buildMetaPurchaseConversion(input);
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!token) {
    return { ...conversion, capiStatus: "skipped" };
  }
  try {
    await sendMetaPurchaseCapi(input, conversion.eventId);
    return { ...conversion, capiStatus: "success" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[meta-purchase] CAPI Purchase failed:", err);
    return { ...conversion, capiStatus: "failed", capiError: message };
  }
}

function buildMetaPurchaseConversion(input: MetaPurchaseTriggerInput): MetaPurchaseConversion {
  const eventId = createMetaPurchaseEventId(input.bookingId);
  return {
    eventId,
    value: input.value,
    currency: "JPY",
    bookingId: input.bookingId,
    listingId: input.listingId,
  };
}

function sendMetaPurchaseCapi(input: MetaPurchaseTriggerInput, eventId: string) {
  return sendMetaPurchaseEventWithRetry({
    eventId,
    value: input.value,
    currency: "JPY",
    bookingId: input.bookingId,
    listingId: input.listingId,
    eventSourceUrl: input.eventSourceUrl ?? `${BASE_URL}/booking/complete?id=${input.bookingId}`,
    clientIpAddress: getClientIp(input.request),
    clientUserAgent: input.request?.headers.get("user-agent") ?? undefined,
    userEmail: input.userEmail,
    userPhone: input.userPhone,
    userFirstName: input.userFirstName,
    userLastName: input.userLastName,
    fbc: input.fbc,
    fbp: input.fbp,
  });
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
