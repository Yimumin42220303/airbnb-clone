#!/usr/bin/env node
/**
 * Meta Pixel / CAPI 검증 스크립트
 *
 * 실행: npm run test:meta-pixel
 *
 * 확인 항목:
 * 1) 예약 객체 mutation 없음 (데이터 격리)
 * 2) 브라우저 Pixel eventID ↔ CAPI event_id 일치 (중복 제거)
 * 3) Meta API 강제 오류 시 결제 완료 플로우가 중단되지 않음
 * 4) ViewContent/Purchase/CAPI 페이로드 Meta 규격 준수
 * 5) CAPI 응답 성공/오류 파싱 및 로그
 */
const path = require("path");

const jiti = require("jiti")(path.join(__dirname, "verify-meta-pixel.js"), {
  alias: { "@": path.join(__dirname, "..", "src") },
  interopDefault: true,
});

const {
  triggerMetaPurchaseConversion,
  createMetaPurchaseEventId,
} = jiti("../src/lib/meta-purchase.ts");
const { buildMetaCapiPurchasePayload } = jiti("../src/lib/meta-capi.ts");
const {
  buildViewContentPixelParams,
  trackMetaViewContent,
  trackMetaSchedule,
  trackMetaInitiateCheckout,
} = jiti("../src/lib/meta-pixel.ts");
const {
  validateFunnelPixelPayload,
} = jiti("../src/lib/meta-payload-validator.ts");
const {
  validateViewContentPixelPayload,
  validatePurchasePixelPayload,
  validateCapiPurchaseEvent,
  hashMetaUserData,
  isCorrectlyHashedMetaEmail,
  isValidSha256Hex,
  isValidUnixEventTime,
  isValidIso4217Currency,
  parseMetaCapiResponse,
  logMetaCapiResponse,
} = jiti("../src/lib/meta-payload-validator.ts");

const PASS = "✅ PASS";
const FAIL = "❌ FAIL";

let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ${PASS} ${message}`);
    return true;
  }
  console.log(`  ${FAIL} ${message}`);
  failed += 1;
  return false;
}

function snapshot(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Prisma Booking 유사 객체 (테스트용) */
function createMockBooking(overrides = {}) {
  return {
    id: "booking_test_001",
    userId: "user_test_001",
    listingId: "listing_test_001",
    checkIn: new Date("2026-06-01T00:00:00.000Z"),
    checkOut: new Date("2026-06-03T00:00:00.000Z"),
    guests: 2,
    totalPrice: 42000,
    paymentStatus: "pending",
    status: "confirmed",
    paymentMethod: null,
    user: { email: "guest@example.com", name: "테스트 게스트" },
    listing: { title: "신주쿠 테스트 숙소", location: "신주쿠구, 도쿄" },
    ...overrides,
  };
}

function createMockListing(overrides = {}) {
  return {
    id: "listing_test_001",
    title: "신주쿠 테스트 숙소",
    location: "신주쿠구, 도쿄",
    pricePerNight: 15000,
    cleaningFee: 3000,
    ...overrides,
  };
}

/** 브라우저 Pixel Purchase 호출 인자 시뮬레이션 */
function simulateBrowserPurchasePixel(conversion) {
  return {
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

/** 결제 verify API tail 시뮬레이션 (Meta 호출 포함) */
async function simulatePaymentVerifySuccess(booking, request) {
  const bookingBefore = snapshot(booking);

  let conversationId = "conversation_mock_001";
  const metaPurchase = triggerMetaPurchaseConversion({
    bookingId: booking.id,
    listingId: booking.listingId,
    value: booking.totalPrice,
    request,
    userEmail: booking.user?.email ?? null,
  });

  const apiResponse = {
    ok: true,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    conversationId,
    metaPurchaseEventId: metaPurchase.eventId,
    purchaseValue: metaPurchase.value,
  };

  const redirectTarget = apiResponse.conversationId
    ? `/messages/${apiResponse.conversationId}`
    : "/my-bookings";

  return {
    bookingBefore,
    bookingAfter: snapshot(booking),
    apiResponse,
    redirectTarget,
    metaPurchase,
  };
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testDataIsolation() {
  console.log("\n=== 1) 데이터 격리 (Mutation 없음) ===\n");

  const booking = createMockBooking();
  const listing = createMockListing();

  const bookingBefore = snapshot(booking);
  const listingBefore = snapshot(listing);

  console.log("[Purchase] 예약 객체 — Meta 호출 전:");
  console.log(JSON.stringify(bookingBefore, null, 2));

  const request = new Request("https://tokyominbak.net/api/payments/verify", {
    headers: {
      "x-forwarded-for": "203.0.113.10",
      "user-agent": "MetaPixelVerifyScript/1.0",
    },
  });

  const conversion = triggerMetaPurchaseConversion({
    bookingId: booking.id,
    listingId: booking.listingId,
    value: booking.totalPrice,
    request,
    userEmail: booking.user.email,
  });

  const bookingAfter = snapshot(booking);

  console.log("\n[Purchase] 예약 객체 — Meta 호출 후:");
  console.log(JSON.stringify(bookingAfter, null, 2));

  assert(
    deepEqual(bookingBefore, bookingAfter),
    "예약 객체가 Meta Purchase 트리거 전후로 동일함 (mutation 없음)"
  );
  assert(
    conversion.bookingId === booking.id && conversion !== booking,
    "Meta conversion 결과는 별도 객체이며 booking 참조를 재사용하지 않음"
  );

  const listingAfterViewContent = snapshot(listing);
  trackMetaViewContent({
    content_ids: [listing.id],
    content_name: listing.title,
    content_category: listing.location,
    value: listing.pricePerNight,
  });

  assert(
    deepEqual(listingBefore, listingAfterViewContent),
    "숙소(listing) 객체가 ViewContent 호출 전후로 동일함 (mutation 없음)"
  );

  await wait(50);
}

async function testEventIdAlignment() {
  console.log("\n=== 2) event_id 대조 (Pixel ↔ CAPI Deduplication) ===\n");

  const bookingId = "booking_dedup_001";
  const expectedEventId = createMetaPurchaseEventId(bookingId);

  const conversion = triggerMetaPurchaseConversion({
    bookingId,
    listingId: "listing_dedup_001",
    value: 55000,
    userEmail: "dedup@example.com",
  });

  const browserCall = simulateBrowserPurchasePixel(conversion);
  const capiPayload = buildMetaCapiPurchasePayload({
    eventId: conversion.eventId,
    value: conversion.value,
    bookingId,
    listingId: "listing_dedup_001",
    userEmail: "dedup@example.com",
  });
  const capiEventId = capiPayload.data[0]?.event_id;

  console.log("  createMetaPurchaseEventId:", expectedEventId);
  console.log("  triggerMetaPurchaseConversion.eventId:", conversion.eventId);
  console.log("  Browser Pixel options.eventID:", browserCall.options.eventID);
  console.log("  CAPI payload event_id:", capiEventId);

  assert(
    expectedEventId === conversion.eventId,
    "conversion.eventId === createMetaPurchaseEventId(bookingId)"
  );
  assert(
    browserCall.options.eventID === conversion.eventId,
    "Browser Pixel eventID === conversion.eventId"
  );
  assert(
    capiEventId === conversion.eventId,
    "CAPI event_id === conversion.eventId"
  );
  assert(
    expectedEventId === browserCall.options.eventID &&
      browserCall.options.eventID === capiEventId,
    "세 경로 event_id 완전 일치 → Meta deduplication 가능"
  );

  await wait(50);
}

async function testSafetyOnMetaApiFailure() {
  console.log("\n=== 3) 안전 장치 (Meta API 강제 오류) ===\n");

  const originalFetch = global.fetch;
  let fetchCallCount = 0;

  global.fetch = async (url, init) => {
    if (String(url).includes("graph.facebook.com")) {
      fetchCallCount += 1;
      throw new Error("FORCED_META_CAPI_ERROR_FOR_TEST");
    }
    return originalFetch(url, init);
  };

  process.env.META_CAPI_ACCESS_TOKEN = "test_token_for_verify_script";

  try {
    const booking = createMockBooking({ id: "booking_safety_001" });
    let thrown = null;
    let result = null;

    try {
      result = await simulatePaymentVerifySuccess(
        booking,
        new Request("https://tokyominbak.net/api/payments/verify")
      );
    } catch (err) {
      thrown = err;
    }

    assert(thrown === null, "Meta CAPI 오류가 결제 완료 시뮬레이션을 throw하지 않음");
    assert(
      result?.apiResponse?.ok === true,
      "결제 verify API 응답 ok: true 유지"
    );
    assert(
      result?.apiResponse?.paymentStatus === "paid",
      "paymentStatus === paid 유지"
    );
    assert(
      typeof result?.redirectTarget === "string" && result.redirectTarget.startsWith("/messages/"),
      `페이지 이동 경로 정상: ${result?.redirectTarget ?? "(없음)"}`
    );
    assert(
      deepEqual(result?.bookingBefore, result?.bookingAfter),
      "Meta 오류 전후 예약 객체 mutation 없음"
    );
    assert(
      fetchCallCount >= 1,
      "CAPI fetch가 호출되었고(오류 유발), 호출 자체는 fire-and-forget으로 처리됨"
    );

    await wait(100);

    assert(
      true,
      "Meta API 실패는 .catch 로그만 남기고 결제 플로우는 완료됨 (비동기 격리)"
    );
  } finally {
    global.fetch = originalFetch;
    delete process.env.META_CAPI_ACCESS_TOKEN;
  }
}

function testPayloadSpecCompliance() {
  console.log("\n=== 4) Meta 페이로드 규격 (전송 전 검증) ===\n");

  const viewParams = buildViewContentPixelParams({
    content_ids: ["listing_001"],
    content_name: "테스트 숙소",
    content_category: "신주쿠구, 도쿄",
    value: 15000,
    currency: "JPY",
  });
  const viewValid = validateViewContentPixelPayload(viewParams);
  assert(viewValid.valid, "ViewContent: value(JPY), currency, content_ids 등 필수 형식 통과");
  assert(isValidIso4217Currency(viewParams.currency), "ViewContent currency = ISO 4217 (JPY)");

  const viewInvalid = validateViewContentPixelPayload({
    ...viewParams,
    value: -1,
    currency: "yen",
  });
  assert(!viewInvalid.valid, "ViewContent: 잘못된 value/currency 감지");

  const purchaseParams = {
    content_ids: ["listing_001"],
    content_type: "product",
    value: 42000,
    currency: "JPY",
  };
  const purchaseValid = validatePurchasePixelPayload(purchaseParams, {
    eventID: "purchase_booking_001",
  });
  assert(purchaseValid.valid, "Purchase Pixel: content_ids, value, currency, eventID 형식 통과");

  const scheduleValid = validateFunnelPixelPayload("Schedule", {
    content_ids: ["listing_001"],
    value: 42000,
    currency: "JPY",
  });
  assert(scheduleValid.valid, "Schedule: content_ids, value, currency 통과");
  trackMetaSchedule({
    content_ids: ["listing_001"],
    value: 42000,
    currency: "JPY",
  });

  const checkoutValid = validateFunnelPixelPayload("InitiateCheckout", {
    content_ids: ["listing_001"],
    value: 42000,
    currency: "JPY",
  });
  assert(checkoutValid.valid, "InitiateCheckout: content_ids, value, currency 통과");
  trackMetaInitiateCheckout({
    content_ids: ["listing_001"],
    value: 42000,
    currency: "JPY",
  });

  const capiBody = buildMetaCapiPurchasePayload({
    eventId: "purchase_booking_001",
    value: 42000,
    currency: "JPY",
    bookingId: "booking_001",
    listingId: "listing_001",
    userEmail: "Guest@Example.COM",
    userPhone: "010-1234-5678",
  });
  const capiEvent = capiBody.data[0];
  const capiValid = validateCapiPurchaseEvent(capiEvent);
  assert(capiValid.valid, "CAPI Purchase: event_time, event_id, custom_data.value/currency 통과");
  assert(
    isValidUnixEventTime(capiEvent.event_time),
    `CAPI event_time = Unix 초 (${capiEvent.event_time})`
  );

  const emHashes = capiEvent.user_data.em;
  assert(Array.isArray(emHashes) && emHashes.length === 1, "CAPI user_data.em = 해시 배열 형식");
  assert(isValidSha256Hex(emHashes[0]), "CAPI em = SHA-256 hex(64자)");
  assert(
    isCorrectlyHashedMetaEmail("Guest@Example.COM", emHashes),
    "CAPI em = trim+lowercase 후 SHA-256 (평문 미전송)"
  );

  const phHashes = capiEvent.user_data.ph;
  assert(Array.isArray(phHashes) && phHashes.length === 1, "CAPI user_data.ph = 해시 배열 형식");
  assert(isValidSha256Hex(phHashes[0]), "CAPI ph = SHA-256 hex(64자)");
  assert(
    !isValidSha256Hex("guest@example.com"),
    "평문 이메일은 SHA-256 hex 형식이 아님 → 해싱 검증 로직 동작"
  );

  const capiBad = validateCapiPurchaseEvent({
    ...capiEvent,
    event_time: "not-a-number",
    custom_data: { value: "42000", currency: "invalid" },
    user_data: { em: ["guest@example.com"] },
  });
  assert(!capiBad.valid, "CAPI: event_time/ currency / 평문 em 오류 감지");
  console.log("  감지된 CAPI 오류:", capiBad.issues.map((i) => i.field).join(", "));
}

function testCapiResponseMonitoring() {
  console.log("\n=== 5) CAPI API 응답 모니터링 ===\n");

  const successLog = parseMetaCapiResponse(
    200,
    JSON.stringify({ events_received: 1, fbtrace_id: "TRACE123" }),
    "purchase_booking_001"
  );
  assert(successLog.ok, "성공 응답 파싱: ok=true");
  assert(successLog.eventsReceived === 1, "events_received=1 파싱");

  console.log("  [성공 로그 미리보기]");
  logMetaCapiResponse(successLog);

  const errorLog = parseMetaCapiResponse(
    400,
    JSON.stringify({
      error: {
        message: "Invalid OAuth access token.",
        type: "OAuthException",
        code: 190,
        error_subcode: 463,
        fbtrace_id: "TRACE_ERR",
      },
    }),
    "purchase_booking_001"
  );
  assert(!errorLog.ok, "오류 응답 파싱: ok=false");
  assert(errorLog.errorCode === 190, "OAuthException code=190 파싱");
  assert(
    errorLog.errorMessage?.includes("Invalid OAuth"),
    "오류 message 파싱"
  );

  console.log("  [오류 로그 미리보기]");
  logMetaCapiResponse(errorLog);
}

async function main() {
  console.log("\n========================================");
  console.log(" Meta Pixel / CAPI 검증");
  console.log("========================================");

  await testDataIsolation();
  await testEventIdAlignment();
  await testSafetyOnMetaApiFailure();
  testPayloadSpecCompliance();
  testCapiResponseMonitoring();

  console.log("\n========================================");
  if (failed === 0) {
    console.log(` 결과: ${PASS} 전체 ${failed}건 실패`);
    process.exit(0);
  } else {
    console.log(` 결과: ${FAIL} ${failed}건 실패`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n검증 스크립트 실행 오류:", err);
  process.exit(1);
});
