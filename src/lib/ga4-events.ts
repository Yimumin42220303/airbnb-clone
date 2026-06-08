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

export function sendGa4Event(eventName: string, params: Record<string, unknown>) {
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

export function trackGa4ViewItem(params: {
  listingId: string;
  itemName: string;
  itemCategory?: string;
  value: number;
  area?: string;
  maxGuests?: number;
}) {
  if (!Number.isFinite(params.value) || params.value < 0) return;
  sendGa4Event("view_item", {
    currency: "JPY",
    value: params.value,
    value_type: "nightly",
    ...(params.area ? { area: params.area } : {}),
    ...(params.maxGuests != null ? { max_guests: params.maxGuests } : {}),
    items: buildItems({
      item_id: params.listingId,
      item_name: params.itemName,
      item_category: params.itemCategory,
      price: params.value,
    }),
  });
}

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

export function trackGa4BookingRequestStart(params: {
  listingId: string;
  bookingType?: string;
  value?: number;
  nights?: number;
}) {
  sendGa4Event("booking_request_start", {
    listing_id: params.listingId,
    ...(params.bookingType ? { booking_type: params.bookingType } : {}),
    ...(params.value != null && Number.isFinite(params.value) ? { value: params.value, currency: "JPY" } : {}),
    ...(params.nights != null ? { nights: params.nights } : {}),
  });
}

export function trackGa4BookingFormStart(params: {
  listingId: string;
  listingName?: string;
  bookingType?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  pagePath?: string;
}) {
  sendGa4Event("booking_form_start", {
    listing_id: params.listingId,
    ...(params.listingName ? { listing_name: params.listingName } : {}),
    ...(params.bookingType ? { booking_type: params.bookingType } : {}),
    ...(params.checkIn ? { check_in: params.checkIn } : {}),
    ...(params.checkOut ? { check_out: params.checkOut } : {}),
    ...(params.guests != null ? { guests: params.guests } : {}),
    ...(params.pagePath ? { page_path: params.pagePath } : {}),
  });
}

export function trackGa4BookingRequestSubmit(params: {
  listingId: string;
  listingName?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  value: number;
  currency?: string;
  bookingType?: string;
  pagePath?: string;
}) {
  if (!Number.isFinite(params.value) || params.value < 0) return;
  sendGa4Event("booking_request_submit", {
    listing_id: params.listingId,
    ...(params.listingName ? { listing_name: params.listingName } : {}),
    check_in: params.checkIn,
    check_out: params.checkOut,
    guests: params.guests,
    nights: params.nights,
    value: params.value,
    currency: params.currency ?? "JPY",
    value_type: "total",
    ...(params.bookingType ? { booking_type: params.bookingType } : {}),
    ...(params.pagePath ? { page_path: params.pagePath } : {}),
    items: buildItems({
      item_id: params.listingId,
      ...(params.listingName ? { item_name: params.listingName } : {}),
      price: params.value,
    }),
  });
}

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
