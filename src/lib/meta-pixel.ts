import {
  validateFunnelPixelPayload,
  validatePurchasePixelPayload,
  validateViewContentPixelPayload,
} from "@/lib/meta-payload-validator";

/** Meta Pixel ID. 환경 변수로 덮어쓸 수 있음. */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1382135537313085";

/** 카탈로그·퍼널 공통 파라미터 */
export type MetaCatalogEventPayload = {
  content_ids: string[];
  value: number;
  currency?: string;
  content_type?: string;
  /** CAPI와 동일한 eventId — Meta 중복 제거용 */
  eventId?: string;
};

/** Meta ViewContent 이벤트 페이로드 */
export type MetaViewContentPayload = MetaCatalogEventPayload & {
  content_name: string;
  content_category: string;
  /** CAPI와 동일한 eventId — Meta 중복 제거용 */
  eventId?: string;
};

/** Meta Purchase 이벤트 페이로드 (브라우저 Pixel) */
export type MetaPurchasePayload = MetaCatalogEventPayload & {
  eventId: string;
};

function buildCatalogPixelParams(payload: MetaCatalogEventPayload) {
  return {
    content_ids: payload.content_ids,
    content_type: payload.content_type ?? "product",
    value: payload.value,
    currency: payload.currency ?? "JPY",
  };
}

/** fbq ViewContent용 파라미터 빌드 + 규격 검증 */
export function buildViewContentPixelParams(payload: MetaViewContentPayload) {
  return {
    ...buildCatalogPixelParams(payload),
    content_name: payload.content_name,
    content_category: payload.content_category,
  };
}

function trackFunnelEvent(
  eventName: "Schedule" | "InitiateCheckout",
  payload: MetaCatalogEventPayload & { eventId?: string }
) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    const params = buildCatalogPixelParams(payload);
    const validation = validateFunnelPixelPayload(eventName, params);
    if (!validation.valid) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[meta-pixel] ${eventName} 페이로드 규격 오류`, validation.issues);
      }
      return;
    }

    if (payload.eventId) {
      window.fbq("track", eventName, params, { eventID: payload.eventId });
    } else {
      window.fbq("track", eventName, params);
    }
  } catch {
    // silently ignore analytics errors
  }
}

/** 예약 생성 성공 시 (POST /api/bookings) */
export function trackMetaSchedule(payload: MetaCatalogEventPayload) {
  trackFunnelEvent("Schedule", payload);
}

/** 결제 페이지 진입 시 */
export function trackMetaInitiateCheckout(payload: MetaCatalogEventPayload) {
  trackFunnelEvent("InitiateCheckout", payload);
}

/** 숙소 상세 조회 시 Meta ViewContent 전송 */
export function trackMetaViewContent(payload: MetaViewContentPayload) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    const params = buildViewContentPixelParams(payload);
    // 브라우저 fbq()는 CAPI보다 관대하므로 검증 실패 시에도 발화
    if (process.env.NODE_ENV === "development") {
      const validation = validateViewContentPixelPayload(params);
      if (!validation.valid) {
        console.warn("[meta-pixel] ViewContent 페이로드 규격 오류", validation.issues);
      }
    }

    if (payload.eventId) {
      window.fbq("track", "ViewContent", params, { eventID: payload.eventId });
    } else {
      window.fbq("track", "ViewContent", params);
    }
  } catch {
    // silently ignore analytics errors
  }
}

/** 결제 완료 Purchase — eventID로 CAPI와 중복 집계 방지 */
export function trackMetaPurchase(payload: MetaPurchasePayload) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    const params = buildCatalogPixelParams(payload);
    const validation = validatePurchasePixelPayload(params, { eventID: payload.eventId });
    if (!validation.valid) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[meta-pixel] Purchase 페이로드 규격 오류", validation.issues);
      }
      return;
    }

    window.fbq("track", "Purchase", params, { eventID: payload.eventId });
  } catch {
    // silently ignore analytics errors
  }
}
