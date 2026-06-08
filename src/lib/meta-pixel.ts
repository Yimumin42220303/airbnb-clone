import {
  validateFunnelPixelPayload,
  validatePurchasePixelPayload,
  validateViewContentPixelPayload,
} from "@/lib/meta-payload-validator";

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1382135537313085";

export type MetaCatalogEventPayload = {
  content_ids: string[];
  value: number;
  currency?: string;
  content_type?: string;
  eventId?: string;
};

export type MetaViewContentPayload = MetaCatalogEventPayload & {
  content_name: string;
  content_category: string;
  eventId?: string;
};

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
        console.warn(`[meta-pixel] ${eventName} payload validation failed`, validation.issues);
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

export function trackMetaSchedule(payload: MetaCatalogEventPayload) {
  trackFunnelEvent("Schedule", payload);
}

export function trackMetaInitiateCheckout(payload: MetaCatalogEventPayload) {
  trackFunnelEvent("InitiateCheckout", payload);
}

export function trackMetaViewContent(payload: MetaViewContentPayload) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    const params = buildViewContentPixelParams(payload);
    if (process.env.NODE_ENV === "development") {
      const validation = validateViewContentPixelPayload(params);
      if (!validation.valid) {
        console.warn("[meta-pixel] ViewContent payload validation failed", validation.issues);
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

export function trackMetaLead(params: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq("track", "Lead", {
      ...(params.content_name ? { content_name: params.content_name } : {}),
      ...(params.content_category ? { content_category: params.content_category } : {}),
      ...(params.value != null ? { value: params.value, currency: params.currency ?? "JPY" } : {}),
    });
  } catch {
    // silently ignore analytics errors
  }
}

export function trackMetaPurchase(payload: MetaPurchasePayload) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;

    const params = buildCatalogPixelParams(payload);
    const validation = validatePurchasePixelPayload(params, { eventID: payload.eventId });
    if (!validation.valid) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[meta-pixel] Purchase payload validation failed", validation.issues);
      }
      return;
    }

    window.fbq("track", "Purchase", params, { eventID: payload.eventId });
  } catch {
    // silently ignore analytics errors
  }
}
