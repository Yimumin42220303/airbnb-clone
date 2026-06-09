import { trackGa4AddToCart, trackGa4BookingRequestStart } from "@/lib/ga4-events";

type EventName =
  | "price_summary_viewed"
  | "cancellation_policy_viewed"
  | "booking_type_viewed"
  | "booking_cta_clicked"
  | "mobile_sticky_cta_clicked"
  | "review_section_viewed"
  | "review_written"
  | "badge_viewed"
  | "trust_banner_viewed";

type EventParams = {
  listing_id: string;
  booking_type?: string;
  total_price?: number;
  nights?: number;
  rating_average?: number;
  review_count?: number;
  badge_type?: string;
};

/**
 * Lightweight analytics event dispatcher.
 * Sends to window.dataLayer (GTM) if available, and logs in development.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function trackEvent(name: EventName, params: EventParams) {
  try {
    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: name,
        ...params,
      });
    }

    if (
      name === "booking_cta_clicked" ||
      name === "mobile_sticky_cta_clicked"
    ) {
      const hasPrice = params.total_price != null && params.total_price > 0;
      trackGa4BookingRequestStart({
        listingId: params.listing_id,
        bookingType: params.booking_type,
        value: hasPrice ? params.total_price : undefined,
        nights: hasPrice ? params.nights : undefined,
      });
      if (hasPrice && params.total_price != null) {
        trackGa4AddToCart({
          listingId: params.listing_id,
          value: params.total_price,
          bookingType: params.booking_type,
          nights: params.nights,
        });
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[analytics] ${name}`, params);
    }
  } catch {
    // silently ignore analytics errors
  }
}
