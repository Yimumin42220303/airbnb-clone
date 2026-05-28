import { META_PIXEL_ID } from "@/lib/meta-pixel";
import { logMetaCapiOps } from "@/lib/meta-ops-log";
import { hashMetaPhone, normalizePhoneForMeta } from "@/lib/meta-user-data";
import {
  assertValidOrThrow,
  hashMetaUserData,
  logMetaCapiResponse,
  parseMetaCapiResponse,
  validateCapiPurchaseEvent,
} from "@/lib/meta-payload-validator";

const META_GRAPH_API_VERSION = "v21.0";
const META_CAPI_MAX_RETRIES = 2;
const META_CAPI_RETRY_BASE_MS = 400;

export type MetaCapiPurchaseInput = {
  eventId: string;
  value: number;
  currency?: string;
  bookingId: string;
  listingId?: string;
  eventSourceUrl?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  userEmail?: string | null;
  userPhone?: string | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashSha256(value: string): string {
  return hashMetaUserData(value);
}

/** CAPI 요청 본문 생성 (네트워크 호출 없음, 검증 스크립트용) */
export function buildMetaCapiPurchasePayload(input: MetaCapiPurchaseInput): {
  data: Record<string, unknown>[];
  access_token?: string;
  test_event_code?: string;
} {
  const userData: Record<string, string | string[]> = {};
  if (input.userEmail?.trim()) {
    userData.em = [hashSha256(input.userEmail)];
  }
  if (input.userPhone?.trim()) {
    const normalized = normalizePhoneForMeta(input.userPhone);
    const hashedPhone = hashMetaPhone(input.userPhone);
    if (normalized && hashedPhone) {
      userData.ph = [hashedPhone];
    }
  }
  if (input.clientIpAddress) {
    userData.client_ip_address = input.clientIpAddress;
  }
  if (input.clientUserAgent) {
    userData.client_user_agent = input.clientUserAgent;
  }

  const eventPayload: Record<string, unknown> = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: "website",
    user_data: userData,
    custom_data: {
      currency: input.currency ?? "JPY",
      value: input.value,
      ...(input.listingId ? { content_ids: [input.listingId] } : {}),
      order_id: input.bookingId,
    },
  };

  if (input.eventSourceUrl) {
    eventPayload.event_source_url = input.eventSourceUrl;
  }

  const body: {
    data: Record<string, unknown>[];
    access_token?: string;
    test_event_code?: string;
  } = {
    data: [eventPayload],
  };

  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  return body;
}

/**
 * Meta Conversions API로 Purchase 이벤트 전송 (1회).
 * META_CAPI_ACCESS_TOKEN 미설정 시 조용히 스킵.
 */
export async function sendMetaPurchaseEvent(input: MetaCapiPurchaseInput): Promise<void> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  const opsBase = {
    eventId: input.eventId,
    bookingId: input.bookingId,
    listingId: input.listingId ?? null,
    valueJpy: input.value,
    testMode: Boolean(testEventCode),
  };

  if (!accessToken) {
    logMetaCapiOps("skipped", {
      ...opsBase,
      reason: "META_CAPI_ACCESS_TOKEN_missing",
    });
    if (process.env.NODE_ENV === "development") {
      console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN이 설정되지 않아 CAPI를 스킵합니다.");
    }
    return;
  }

  const body = buildMetaCapiPurchasePayload(input);
  body.access_token = accessToken;

  const capiEvent = body.data[0] as Record<string, unknown>;
  const validation = validateCapiPurchaseEvent(capiEvent);
  assertValidOrThrow(validation, "CAPI");

  try {
    const res = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const rawBody = await res.text().catch(() => "");
    const responseLog = parseMetaCapiResponse(res.status, rawBody, input.eventId);
    logMetaCapiResponse(responseLog);

    if (!res.ok) {
      logMetaCapiOps("failed", {
        ...opsBase,
        httpStatus: res.status,
        errorMessage: responseLog.errorMessage ?? rawBody.slice(0, 200),
        fbtraceId: responseLog.fbtraceId ?? null,
      });
      throw new Error(
        `Meta CAPI Purchase failed (${res.status}): ${responseLog.errorMessage ?? rawBody.slice(0, 300)}`
      );
    }

    logMetaCapiOps("success", {
      ...opsBase,
      httpStatus: res.status,
      eventsReceived: responseLog.eventsReceived ?? null,
      fbtraceId: responseLog.fbtraceId ?? null,
      testEventCode: testEventCode ?? null,
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Meta CAPI Purchase failed")) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    logMetaCapiOps("failed", {
      ...opsBase,
      errorMessage: message,
    });
    throw err;
  }
}

/**
 * CAPI Purchase 전송 + 지수 백오프 재시도 (토큰 없으면 즉시 return).
 */
export async function sendMetaPurchaseEventWithRetry(
  input: MetaCapiPurchaseInput
): Promise<void> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    await sendMetaPurchaseEvent(input);
    return;
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= META_CAPI_MAX_RETRIES; attempt++) {
    try {
      await sendMetaPurchaseEvent(input);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < META_CAPI_MAX_RETRIES) {
        const delayMs = META_CAPI_RETRY_BASE_MS * (attempt + 1);
        console.warn(
          `[meta-capi] Purchase 재시도 ${attempt + 1}/${META_CAPI_MAX_RETRIES} (${delayMs}ms 후)`,
          { eventId: input.eventId, bookingId: input.bookingId }
        );
        await sleep(delayMs);
      }
    }
  }
  throw lastError;
}
