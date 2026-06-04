import { isGoogleAnalyticsEnabled } from "@/lib/google-analytics";

export type Ga4ItemInput = {
  item_id: string;
  item_name?: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
    window.dataLayer.push(payload);
  }
}

function buildItems(item: Ga4ItemInput) {
  return [
    {
      item_id: item.item_id,
      ...(item.item_name ? { item_name: item.item_name } : {}),
      ...(item.item_category ? { item_category: item.item_category } : {}),
      ...(item.price != null && Number.isFinite(item.price)
        ? { price: item.price }
        : {}),
      quantity: item.quantity ?? 1,
    },
  ];
}

function sendGa4Event(eventName: string, params: Record<string, unknown>) {
  try {
    if (!isGoogleAnalyticsEnabled() || typeof window === "undefined") return;
    pushDataLayer({ event: eventName, ...params });
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params);
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`[ga4] ${eventName}`, params);
    }
  } catch {
    // silently ignore analytics errors
  }
}

/** 숙소 상세 조회 */
export function trackGa4ViewItem(params: {
  listingId: string;
  itemName: string;
  itemCategory?: string;
  value: number;
}) {
  if (!Number.isFinite(params.value) || params.value < 0) return;
  sendGa4Event("view_item", {
    currency: "JPY",
    value: params.value,
    items: buildItems({
      item_id: params.listingId,
      item_name: params.itemName,
      item_category: params.itemCategory,
      price: params.value,
    }),
  });
}

/** 예약 CTA 클릭 (날짜·요금 선택 후) */
export function trackGa4AddToCart(params: {
  listingId: string;
  value: number;
  bookingType?: string;
  nights?: number;
}) {
  if (!Number.isFinite(params.value) || params.value < 0) return;
  sendGa4Event("add_to_cart", {
    currency: "JPY",
    value: params.value,
    ...(params.bookingType ? { booking_type: params.bookingType } : {}),
    ...(params.nights != null ? { nights: params.nights } : {}),
    items: buildItems({
      item_id: params.listingId,
      price: params.value,
    }),
  });
}

/** 예약 확인 페이지 진입 */
export function trackGa4BeginCheckout(params: {
  listingId: string;
  itemName?: string;
  itemCategory?: string;
  value: number;
  nights?: number;
}) {
  if (!Number.isFinite(params.value) || params.value < 0) return;
  sendGa4Event("begin_checkout", {
    currency: "JPY",
    value: params.value,
    ...(params.nights != null ? { nights: params.nights } : {}),
    items: buildItems({
      item_id: params.listingId,
      item_name: params.itemName,
      item_category: params.itemCategory,
      price: params.value,
    }),
  });
}

/** 결제 페이지 */
export function trackGa4AddPaymentInfo(params: {
  listingId: string;
  value: number;
  bookingId?: string;
}) {
  if (!Number.isFinite(params.value) || params.value < 0) return;
  sendGa4Event("add_payment_info", {
    currency: "JPY",
    value: params.value,
    ...(params.bookingId ? { booking_id: params.bookingId } : {}),
    items: buildItems({
      item_id: params.listingId,
      price: params.value,
    }),
  });
}

/** 결제 완료 — transaction_id = bookingId (1예약 1건) */
export function trackGa4Purchase(params: {
  bookingId: string;
  listingId?: string;
  value: number;
}) {
  if (!params.bookingId || !Number.isFinite(params.value) || params.value < 0) {
    return;
  }
  sendGa4Event("purchase", {
    transaction_id: params.bookingId,
    currency: "JPY",
    value: params.value,
    items: params.listingId
      ? buildItems({
          item_id: params.listingId,
          price: params.value,
        })
      : [],
  });
}
