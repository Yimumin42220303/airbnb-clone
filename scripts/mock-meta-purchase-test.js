#!/usr/bin/env node
/**
 * Meta Purchase 모의 테스트 (실결제 없음)
 *
 * 사용:
 *   npm run test:meta-mock-purchase
 *   npm run test:meta-mock-purchase -- --booking-id=clxxx
 *   npm run test:meta-mock-purchase -- --mode=http --base-url=http://localhost:3000
 *
 * 사전:
 *   - .env: META_CAPI_ACCESS_TOKEN (CAPI success/skip/failure 확인)
 *   - (선택) META_CAPI_TEST_EVENT_CODE — npm run setup:meta-capi-test
 *   - http 모드: ENABLE_MOCK_PAYMENT=1, npm run dev, 로그인 세션 쿠키
 */
const path = require("path");

const jiti = require("jiti")(path.join(__dirname, "mock-meta-purchase-test.js"), {
  alias: { "@": path.join(__dirname, "..", "src") },
  interopDefault: true,
});

const root = path.join(__dirname, "..");
require("dotenv").config({ path: path.join(root, ".env.local") });
require("dotenv").config({ path: path.join(root, ".env"), override: true });

const {
  createMetaPurchaseEventId,
  triggerMetaPurchaseConversionAsync,
} = jiti("../src/lib/meta-purchase.ts");
const { buildMetaCapiPurchasePayload } = jiti("../src/lib/meta-capi.ts");

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
  return {
    mode: get("mode") || "direct",
    bookingId: get("booking-id") || process.env.META_MOCK_BOOKING_ID || "booking_meta_mock_test",
    listingId: get("listing-id") || "listing_meta_mock_test",
    value: Number(get("value") || "42000"),
    baseUrl: (get("base-url") || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
      /\/$/,
      ""
    ),
    cookie: get("cookie") || process.env.META_MOCK_SESSION_COOKIE || "",
  };
}

function simulateBrowserPurchasePixel(conversion) {
  return {
    channel: "browser_pixel",
    eventName: "Purchase",
    params: {
      content_ids: conversion.listingId ? [conversion.listingId] : [],
      content_type: "product",
      value: conversion.value,
      currency: conversion.currency,
    },
    options: {
      eventID: conversion.eventId,
    },
  };
}

function printOpsStyleLog(result) {
  const base = {
    eventId: result.eventId,
    bookingId: result.bookingId,
    listingId: result.listingId ?? null,
    valueJpy: result.value,
    testMode: Boolean(process.env.META_CAPI_TEST_EVENT_CODE?.trim()),
  };
  if (result.capiStatus === "success") {
    console.log(
      "[meta-ops]",
      JSON.stringify({ ts: new Date().toISOString(), event: "capi_purchase_success", ...base })
    );
  } else if (result.capiStatus === "skipped") {
    console.log(
      "[meta-ops]",
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "capi_purchase_skipped",
        reason: process.env.META_CAPI_ACCESS_TOKEN?.trim()
          ? "send_skipped_unknown"
          : "META_CAPI_ACCESS_TOKEN_missing",
        ...base,
      })
    );
  } else {
    console.log(
      "[meta-ops]",
      JSON.stringify({
        ts: new Date().toISOString(),
        event: "capi_purchase_failure",
        errorMessage: result.capiError ?? "unknown",
        ...base,
      })
    );
  }
}

function compareEventIds(browserEventId, serverEventId, expectedFromBooking) {
  console.log("\n=== event_id 정합성 (Deduplication) ===\n");
  console.log("  createMetaPurchaseEventId(bookingId):", expectedFromBooking);
  console.log("  서버 CAPI / conversion.eventId:     ", serverEventId);
  console.log("  브라우저 Pixel options.eventID:    ", browserEventId);

  const match =
    browserEventId === serverEventId && serverEventId === expectedFromBooking;

  if (match) {
    console.log("\n  ✅ 세 값 일치 — Meta Pixel ↔ CAPI dedup 가능\n");
  } else {
    console.log("\n  ❌ 불일치 — event_id를 확인하세요\n");
    process.exitCode = 1;
  }
}

async function runDirect(opts) {
  const expectedId = createMetaPurchaseEventId(opts.bookingId);
  const request = new Request(`${opts.baseUrl}/api/payments/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "MetaMockPurchaseTest/1.0",
      "x-forwarded-for": "203.0.113.1",
    },
  });

  console.log("\n=== 모의 Purchase (verify API 내부 로직 직접 호출) ===\n");
  console.log("  bookingId:", opts.bookingId);
  console.log("  listingId:", opts.listingId);
  console.log("  value JPY:", opts.value);
  console.log(
    "  META_CAPI_TEST_EVENT_CODE:",
    process.env.META_CAPI_TEST_EVENT_CODE?.trim() ? "설정됨" : "없음"
  );
  console.log(
    "  META_CAPI_ACCESS_TOKEN:",
    process.env.META_CAPI_ACCESS_TOKEN?.trim() ? "설정됨" : "없음"
  );

  const capiBody = buildMetaCapiPurchasePayload({
    eventId: expectedId,
    value: opts.value,
    currency: "JPY",
    bookingId: opts.bookingId,
    listingId: opts.listingId,
    userEmail: "mock-guest@example.com",
  });
  if (capiBody.test_event_code) {
    console.log("  CAPI payload test_event_code:", capiBody.test_event_code);
  }

  const result = await triggerMetaPurchaseConversionAsync({
    bookingId: opts.bookingId,
    listingId: opts.listingId,
    value: opts.value,
    request,
    userEmail: "mock-guest@example.com",
    userPhone: "01012345678",
  });

  printOpsStyleLog(result);

  const browser = simulateBrowserPurchasePixel(result);
  console.log("\n=== 브라우저 Pixel 시뮬레이션 (fbq 호출 인자) ===\n");
  console.log(
    JSON.stringify(
      {
        call: `fbq('track', '${browser.eventName}', ...)`,
        params: browser.params,
        options: browser.options,
      },
      null,
      2
    )
  );

  compareEventIds(browser.options.eventID, result.eventId, expectedId);

  return { result, browser };
}

async function runHttp(opts) {
  if (!opts.cookie) {
    console.error(`
[mock-meta-purchase] http 모드: 세션 쿠키가 필요합니다.

1) ENABLE_MOCK_PAYMENT=1 로 npm run dev
2) 브라우저 로그인 후 DevTools → Application → Cookies → next-auth.session-token 복사
3) 실행:
   npm run test:meta-mock-purchase -- --mode=http --booking-id=<예약ID> --cookie="next-auth.session-token=..."

또는 DB 변경 없이: --mode=direct (기본)
`);
    process.exit(1);
  }

  const url = `${opts.baseUrl}/api/payments/mock-verify`;
  console.log("\n=== POST /api/payments/mock-verify (HTTP) ===\n");
  console.log("  URL:", url);
  console.log("  bookingId:", opts.bookingId);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: opts.cookie,
    },
    body: JSON.stringify({ bookingId: opts.bookingId }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("  응답 JSON 파싱 실패:", text.slice(0, 300));
    process.exit(1);
  }

  console.log("  HTTP", res.status, data.ok ? "ok" : "error");
  if (!data.ok) {
    console.error("  error:", data.error);
    process.exit(1);
  }

  const expectedId = createMetaPurchaseEventId(opts.bookingId);
  const serverEventId = data.metaPurchaseEventId ?? expectedId;
  const browser = simulateBrowserPurchasePixel({
    eventId: serverEventId,
    value: data.purchaseValue ?? opts.value,
    currency: "JPY",
    bookingId: opts.bookingId,
    listingId: data.listingId ?? opts.listingId,
  });

  printOpsStyleLog({
    eventId: serverEventId,
    bookingId: opts.bookingId,
    listingId: data.listingId,
    value: data.purchaseValue ?? opts.value,
    currency: "JPY",
    capiStatus: data.capiStatus ?? "skipped",
    capiError: data.capiError,
  });

  compareEventIds(browser.options.eventID, serverEventId, expectedId);
}

async function main() {
  const opts = parseArgs();

  console.log("\n========================================");
  console.log(" Meta Purchase 모의 테스트");
  console.log("========================================");

  if (opts.mode === "http") {
    await runHttp(opts);
  } else {
    await runDirect(opts);
  }

  console.log("Meta Events Manager → 테스트 이벤트 탭에서 서버 이벤트 수신을 확인하세요.");
  console.log("(META_CAPI_TEST_EVENT_CODE 설정 시 Test Events에만 표시)\n");
}

main().catch((err) => {
  console.error("\n[mock-meta-purchase] 오류:", err);
  process.exit(1);
});
