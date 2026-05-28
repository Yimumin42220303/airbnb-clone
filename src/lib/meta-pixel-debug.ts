/** Meta Pixel 브라우저 디버그 (Development / NEXT_PUBLIC_META_PIXEL_DEBUG=1 만) */

export type MetaPixelDebugEventName = "PageView" | "ViewContent" | "Purchase" | string;

export type MetaPixelDebugRow = Record<string, string | number | boolean | null | undefined>;

/** Production에서는 false. Preview/로컬에서 NEXT_PUBLIC_META_PIXEL_DEBUG=1 로 강제 활성화 가능 */
export function isMetaPixelDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "development") return true;
  return process.env.NEXT_PUBLIC_META_PIXEL_DEBUG === "1";
}

function flattenPixelPayload(
  eventName: MetaPixelDebugEventName,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
): MetaPixelDebugRow {
  const row: MetaPixelDebugRow = {
    이벤트: eventName,
  };

  if (params) {
    if (params.content_ids != null) {
      row["숙소 ID"] = Array.isArray(params.content_ids)
        ? params.content_ids.join(", ")
        : String(params.content_ids);
    }
    if (typeof params.content_name === "string") row["숙소명"] = params.content_name;
    if (typeof params.content_category === "string") row["지역"] = params.content_category;
    if (typeof params.value === "number") row["금액 (value)"] = params.value;
    if (typeof params.currency === "string") row["통화"] = params.currency;
    if (typeof params.content_type === "string") row["content_type"] = params.content_type;
  }

  const eventId = options?.eventID;
  if (typeof eventId === "string" && eventId) {
    row["이벤트 ID (dedup)"] = eventId;
  }

  return row;
}

/** 브라우저 Pixel 이벤트 — 콘솔 표 형식 출력 */
export function logMetaPixelEvent(
  eventName: MetaPixelDebugEventName,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
): void {
  if (!isMetaPixelDebugEnabled()) return;

  const row = flattenPixelPayload(eventName, params, options);
  console.groupCollapsed(`%c[Meta Pixel Event] ${eventName}`, "color:#1877F2;font-weight:bold");
  console.table(row);
  console.groupEnd();
}

export type MetaCapiDebugInfo = {
  eventId: string;
  value: number;
  currency?: string;
  bookingId: string;
  listingId?: string;
  capiStatus: "success" | "skipped" | "failed";
  capiError?: string;
};

/** 결제 verify API 응답 기준 — 서버 CAPI 전송 결과 */
export function logMetaCapiDebug(info: MetaCapiDebugInfo): void {
  if (!isMetaPixelDebugEnabled()) return;

  if (info.capiStatus === "success") {
    console.groupCollapsed(
      "%c[Meta Pixel Event] 서버 측 CAPI 전송 완료",
      "color:#42B72A;font-weight:bold"
    );
    console.table({
      "이벤트 ID (dedup)": info.eventId,
      "예약 ID": info.bookingId,
      ...(info.listingId ? { "숙소 ID": info.listingId } : {}),
      "금액 (value)": info.value,
      "통화": info.currency ?? "JPY",
      "CAPI 상태": "success",
    });
    console.log("브라우저 Pixel + 서버 CAPI 양쪽 전송 확인 (동일 event_id로 dedup)");
    console.groupEnd();
    return;
  }

  if (info.capiStatus === "skipped") {
    console.info(
      "[Meta Pixel Event] CAPI skipped — META_CAPI_ACCESS_TOKEN 미설정 (브라우저 Pixel만 전송)"
    );
    return;
  }

  console.warn("[Meta Pixel Event] 서버 CAPI 전송 실패 (결제 플로우는 정상)", {
    eventId: info.eventId,
    bookingId: info.bookingId,
    error: info.capiError,
  });
}

/** PayButton / callback — verify API JSON 응답 처리 */
export function logMetaPurchaseFromVerifyResponse(data: {
  metaPurchaseEventId?: string;
  purchaseValue?: number;
  capiStatus?: MetaCapiDebugInfo["capiStatus"];
  capiError?: string;
  bookingId: string;
  listingId?: string;
}): void {
  if (!isMetaPixelDebugEnabled()) return;
  if (!data.metaPurchaseEventId || typeof data.purchaseValue !== "number") return;

  logMetaCapiDebug({
    eventId: data.metaPurchaseEventId,
    value: data.purchaseValue,
    currency: "JPY",
    bookingId: data.bookingId,
    listingId: data.listingId,
    capiStatus: data.capiStatus ?? "skipped",
    capiError: data.capiError,
  });
}
