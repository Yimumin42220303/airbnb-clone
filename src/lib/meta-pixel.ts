/** Meta Pixel ID. 환경 변수로 덮어쓸 수 있음. */
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1815598592627600";

/** Meta ViewContent 이벤트 페이로드 */
export type MetaViewContentPayload = {
  content_ids: string[];
  content_name: string;
  content_category: string;
  value: number;
  currency?: string;
  content_type?: string;
};

/** 숙소 상세 조회 시 Meta ViewContent 전송 */
export function trackMetaViewContent(payload: MetaViewContentPayload) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    window.fbq("track", "ViewContent", {
      content_ids: payload.content_ids,
      content_name: payload.content_name,
      content_category: payload.content_category,
      content_type: payload.content_type ?? "product",
      value: payload.value,
      currency: payload.currency ?? "JPY",
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[meta-pixel] ViewContent", payload);
    }
  } catch {
    // silently ignore analytics errors
  }
}
