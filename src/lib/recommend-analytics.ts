/**
 * /recommend 퍼널 이벤트.
 * - window.dataLayer.push(): GTM 사용 환경 호환 유지
 * - window.gtag('event'): GTM 미사용 환경에서도 GA4에 직접 도달
 * 자유 입력 텍스트·연락처(PII)는 전송하지 않음.
 * undefined/null 파라미터는 GA4 전송 전 제거.
 */

export type RecommendEventName =
  | "recommend_page_view"
  | "recommend_form_start"
  | "recommend_travel_type_select"
  | "recommend_priority_select"
  | "recommend_date_select"
  | "recommend_guest_count_select"
  | "recommend_submit"
  | "recommend_result_view"
  | "recommend_listing_click"
  | "recommend_inquiry_click"
  | "recommend_booking_start"
  | "recommend_kakao_click"
  | "recommend_copy_message"
  | "recommend_lead_submit"
  | "recommend_consult_start_click"
  | "recommend_consult_lead_created"
  | "recommend_channeltalk_open"
  | "recommend_channeltalk_open_failed"
  | "listing_recommend_click";

export type RecommendEventParams = {
  travel_type?: string;
  priorities?: string;
  guest_count?: number;
  date_selected?: boolean;
  result_count?: number;
  listing_id?: string;
  listing_name?: string;
  source_page?: string;
  contact_method?: string;
  has_area?: boolean;
  has_budget?: boolean;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** undefined/null 값을 제거한 clean params 반환 */
function cleanParams(params: RecommendEventParams): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) result[k] = v;
  }
  return result;
}

export function trackRecommendEvent(
  name: RecommendEventName,
  params: RecommendEventParams = {}
) {
  try {
    const clean = cleanParams(params);

    // GTM 사용 환경 호환 — dataLayer 유지
    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, ...clean });
    }

    // GTM 미사용 환경에서도 GA4에 직접 도달
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", name, clean);
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[recommend-analytics] ${name}`, clean);
    }
  } catch {
    // no-op
  }
}
