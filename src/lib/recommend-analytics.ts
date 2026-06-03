/**
 * /recommend 퍼널 이벤트 (GTM dataLayer). gtag/dataLayer 없으면 no-op.
 * 자유 입력 텍스트·연락처(PII)는 전송하지 않음.
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
  }
}

export function trackRecommendEvent(
  name: RecommendEventName,
  params: RecommendEventParams = {}
) {
  try {
    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: name,
        ...params,
      });
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`[recommend-analytics] ${name}`, params);
    }
  } catch {
    // no-op
  }
}
