import { createHash } from "crypto";
import { META_PIXEL_ID } from "@/lib/meta-pixel";

const META_GRAPH_API_VERSION = "v21.0";

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
};

function hashSha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * Meta Conversions API로 Purchase 이벤트 전송 (비동기, fire-and-forget).
 * META_CAPI_ACCESS_TOKEN 미설정 시 조용히 스킵.
 */
export async function sendMetaPurchaseEvent(input: MetaCapiPurchaseInput): Promise<void> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN이 설정되지 않아 CAPI를 스킵합니다.");
    }
    return;
  }

  const userData: Record<string, string | string[]> = {};
  if (input.userEmail?.trim()) {
    userData.em = hashSha256(input.userEmail);
  }
  if (input.clientIpAddress) {
    userData.client_ip_address = input.clientIpAddress;
  }
  if (input.clientUserAgent) {
    userData.client_user_agent = input.clientUserAgent;
  }

  const payload: Record<string, unknown> = {
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
    payload.event_source_url = input.eventSourceUrl;
  }

  const body: Record<string, unknown> = {
    data: [payload],
    access_token: accessToken,
  };

  const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  const res = await fetch(
    `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${META_PIXEL_ID}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta CAPI Purchase failed (${res.status}): ${text.slice(0, 300)}`);
  }

  if (process.env.NODE_ENV === "development") {
    const json = await res.json().catch(() => ({}));
    console.log("[meta-capi] Purchase sent", { eventId: input.eventId, response: json });
  }
}
