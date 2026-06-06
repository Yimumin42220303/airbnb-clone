#!/usr/bin/env node
/**
 * ============================================================
 * Meta CAPI ↔ Beds24 하네스 스크립트 (사이드카 패턴)
 * ============================================================
 *
 * 목적:
 *   Beds24 API에서 실시간 가격 데이터를 가져와
 *   Meta Conversions API (CAPI)로 ViewContent 이벤트를 전송하는
 *   독립적인 미들웨어 레이어. 기존 Next.js 앱 코드를 일절 수정하지 않음.
 *
 * 비침습 원칙:
 *   - 기존 DB (Prisma) 미접근
 *   - 기존 Next.js 모듈 미import
 *   - 동일 환경 변수(.env.local)만 공유
 *
 * 중복 제거 전략:
 *   - event_id = "vc_{listingId}_{dateKey}_{uuid}" 형식
 *   - 브라우저 Pixel이 동일 event_id로 발화 시 Meta가 48시간 내 중복 제거
 *   - 프로덕션에서는 브라우저 → /api/capi/* 경유 시 동일 ID 재사용
 *
 * 실행 방법:
 *   cp scripts/.env.harness.example scripts/.env.harness
 *   # .env.harness 편집 후:
 *   npm run meta:capi-harness
 *   # 또는 직접:
 *   node scripts/meta-capi-harness.js
 *
 * 환경 변수 우선순위: .env.harness > .env.local > .env
 * ============================================================
 */

"use strict";

// ── 환경 변수 로드 ──────────────────────────────────────────
// 하네스 전용 .env 우선, 없으면 앱과 동일한 .env.local 사용
const path = require("path");
const fs = require("fs");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // 따옴표 제거
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // 이미 설정된 값은 덮어쓰지 않음 (우선순위 유지)
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const rootDir = path.resolve(__dirname, "..");
// 우선순위: 하네스 전용 > .env.local > .env
loadEnvFile(path.join(__dirname, ".env.harness"));
loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env"));

// ── 설정 ────────────────────────────────────────────────────
const CONFIG = {
  // Beds24
  BEDS24_BASE: "https://beds24.com/api/v2",
  BEDS24_REFRESH_TOKEN: process.env.HARNESS_BEDS24_REFRESH_TOKEN ||
                        process.env.BEDS24_REFRESH_TOKEN_ASAHISTAY ||
                        process.env.BEDS24_REFRESH_TOKEN || "",
  BEDS24_PROP_ID: process.env.HARNESS_BEDS24_PROP_ID || "",
  BEDS24_ROOM_ID: process.env.HARNESS_BEDS24_ROOM_ID || "",
  // 조회 기간: 오늘부터 N일
  BEDS24_DAYS_AHEAD: parseInt(process.env.HARNESS_BEDS24_DAYS_AHEAD || "30", 10),

  // Meta CAPI
  META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID || "1382135537313085",
  META_ACCESS_TOKEN: process.env.META_CAPI_ACCESS_TOKEN || "",
  META_TEST_EVENT_CODE: process.env.META_CAPI_TEST_EVENT_CODE || "",
  META_GRAPH_VERSION: "v21.0",

  // 하네스 설정
  LISTING_ID: process.env.HARNESS_LISTING_ID || "asahi-stay-tokyo",
  LISTING_NAME: process.env.HARNESS_LISTING_NAME || "Asahi Stay Tokyo",
  EVENT_SOURCE_URL: process.env.HARNESS_EVENT_SOURCE_URL || "https://tokyominbak.net",
  CURRENCY: "JPY",

  // 실행 모드: "test" (테스트 이벤트 코드 사용) | "dry-run" (전송 안 함) | "production"
  MODE: process.env.HARNESS_MODE || "test",
};

// ── 유틸리티 ─────────────────────────────────────────────────
const crypto = require("crypto");

/** UUID v4 생성 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * 중복 제거용 event_id 생성.
 *
 * 형식: "vc_{listingId}_{dateKey}_{uuid}"
 *
 * 브라우저 Pixel과 CAPI가 동일한 event_id를 공유해야 Meta가
 * 중복 집계를 제거합니다. 프로덕션에서는 브라우저가 생성한 ID를
 * 서버로 전달하는 방식으로 연동합니다.
 *
 * 하네스 테스트에서는 합성 ID를 생성합니다(브라우저 매칭 없음).
 */
function generateEventId(listingId, dateKey) {
  const uuid = generateUUID();
  return `vc_${listingId}_${dateKey.replace(/-/g, "")}_${uuid}`;
}

/** SHA-256 해시 (Meta 사용자 데이터 해싱용) */
function sha256(value) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** 날짜 → YYYYMMDD (Beds24 API 형식) */
function toBeds24Date(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

/** 날짜 → YYYY-MM-DD */
function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** from~to 사이 날짜 키 배열 (to 제외) */
function getDateKeysBetween(fromDate, toDate) {
  const keys = [];
  const cur = new Date(fromDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  while (cur < end) {
    keys.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

/** 컬러 로그 */
const log = {
  info:    (msg, data) => console.log(`\x1b[36m[harness]\x1b[0m ${msg}`, data !== undefined ? data : ""),
  ok:      (msg, data) => console.log(`\x1b[32m[harness ✓]\x1b[0m ${msg}`, data !== undefined ? data : ""),
  warn:    (msg, data) => console.warn(`\x1b[33m[harness ⚠]\x1b[0m ${msg}`, data !== undefined ? data : ""),
  error:   (msg, data) => console.error(`\x1b[31m[harness ✗]\x1b[0m ${msg}`, data !== undefined ? data : ""),
  section: (msg)       => console.log(`\n\x1b[1m\x1b[35m══ ${msg} ══\x1b[0m`),
};

// ── Beds24 인증 ──────────────────────────────────────────────
let _accessTokenCache = null;

/**
 * Beds24 Refresh Token → Access Token 교환.
 * 기존 beds24.ts와 동일한 엔드포인트/헤더 사용.
 */
async function getBeds24AccessToken() {
  if (_accessTokenCache && Date.now() < _accessTokenCache.expiresAt - 60_000) {
    return _accessTokenCache.token;
  }

  if (!CONFIG.BEDS24_REFRESH_TOKEN) {
    throw new Error("BEDS24_REFRESH_TOKEN이 설정되지 않았습니다. .env.harness를 확인하세요.");
  }

  log.info("Beds24 Access Token 교환 중...");
  const res = await fetch(`${CONFIG.BEDS24_BASE}/authentication/token`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      refreshToken: CONFIG.BEDS24_REFRESH_TOKEN,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Beds24 인증 실패 (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error("Beds24 응답에 token 없음");

  const expiresIn = typeof data.expiresIn === "number" ? data.expiresIn : 86400;
  _accessTokenCache = { token: data.token, expiresAt: Date.now() + expiresIn * 1000 };
  log.ok("Beds24 Access Token 획득 완료");
  return data.token;
}

// ── Beds24 가격 조회 ─────────────────────────────────────────
/**
 * Beds24 Calendar API에서 일별 가격 조회 (price1 = AirBnB 기준가).
 * @returns Map<YYYY-MM-DD, 가격(JPY)>
 */
async function fetchBeds24Prices(propId, roomId, fromDate, toDate) {
  const token = await getBeds24AccessToken();

  // Beds24 endDate = 체크아웃 전날
  const lastNight = new Date(toDate);
  lastNight.setDate(lastNight.getDate() - 1);

  // 60일 패딩 (Beds24 부분 구간 응답 대비)
  const padStart = new Date(fromDate);
  padStart.setDate(padStart.getDate() - 60);
  const padEnd = new Date(lastNight);
  padEnd.setDate(padEnd.getDate() + 60);

  const url = new URL(`${CONFIG.BEDS24_BASE}/inventory/rooms/calendar`);
  url.searchParams.set("propertyId", propId);
  url.searchParams.set("roomId", roomId);
  url.searchParams.set("startDate", toDateKey(padStart));
  url.searchParams.set("endDate", toDateKey(padEnd));
  url.searchParams.set("includePrices", "true");

  log.info(`Beds24 캘린더 조회: propId=${propId} roomId=${roomId} ${toDateKey(fromDate)}~${toDateKey(toDate)}`);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", token },
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Beds24 캘린더 조회 실패 (${res.status}): ${body.slice(0, 200)}`);
  }

  const raw = await res.json();
  const items = Array.isArray(raw?.data) ? raw.data : [];
  const result = new Map();

  for (const item of items) {
    const ranges = item.calendar;
    if (!Array.isArray(ranges)) continue;
    for (const range of ranges) {
      const price = range.price1;
      const fromStr = range.from;
      const toStr = range.to;
      if (typeof price !== "number" || price <= 0 || !fromStr || !toStr) continue;
      const fromD = new Date(fromStr);
      const toD = new Date(toStr);
      if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) continue;
      // Beds24 "to"는 inclusive → 다음 날을 exclusive end로
      const toExclusive = new Date(toD);
      toExclusive.setDate(toExclusive.getDate() + 1);
      for (const dk of getDateKeysBetween(fromD, toExclusive)) {
        result.set(dk, Math.round(price));
      }
    }
  }

  log.ok(`가격 데이터 수신: ${result.size}일치`);
  return result;
}

// ── Meta CAPI 이벤트 빌드 ────────────────────────────────────
/**
 * ViewContent CAPI 페이로드 빌드.
 *
 * 중복 제거:
 *   - event_id를 브라우저 Pixel과 동일하게 설정하면 Meta가 자동 중복 제거.
 *   - 하네스 테스트 모드에서는 합성 UUID 사용 (실제 브라우저 이벤트와 매칭 없음).
 *
 * @param {object} opts
 * @param {string} opts.eventId       - 중복 제거용 ID (브라우저 Pixel과 동일해야 함)
 * @param {string} opts.listingId     - 콘텐츠 ID
 * @param {string} opts.listingName   - 콘텐츠 이름
 * @param {number} opts.pricePerNight - 1박 가격 (JPY)
 * @param {string} opts.dateKey       - 해당 날짜 (YYYY-MM-DD)
 */
function buildViewContentPayload(opts) {
  const { eventId, listingId, listingName, pricePerNight, dateKey } = opts;

  // 사용자 데이터: 하네스는 익명 이벤트 (국가만 고정)
  const userData = {
    country: [sha256("jp")], // 도쿄 소재 숙소 → 일본 사용자 타겟
    client_user_agent: "MetaCAPIHarness/1.0 (Beds24PriceSync)",
  };

  return {
    event_name: "ViewContent",
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: `${CONFIG.EVENT_SOURCE_URL}/listing/${listingId}?date=${dateKey}`,
    user_data: userData,
    custom_data: {
      content_ids: [listingId],
      content_type: "product",
      content_name: listingName,
      content_category: "vacation_rental",
      value: pricePerNight,
      currency: CONFIG.CURRENCY,
      // 하네스 메타데이터 (Meta 무시, 디버깅용)
      _harness_date: dateKey,
      _harness_source: "beds24_price_sync",
    },
  };
}

// ── Meta CAPI 전송 ───────────────────────────────────────────
/**
 * Meta CAPI에 이벤트 배치 전송.
 *
 * 모드별 동작:
 *   - "dry-run": 실제 전송 없이 페이로드만 출력
 *   - "test": META_CAPI_TEST_EVENT_CODE 포함하여 전송 (Events Manager 테스트 탭에서 확인)
 *   - "production": 실제 전송 (META_CAPI_ACCESS_TOKEN 필요)
 */
async function sendToMetaCapi(events) {
  const endpoint = `https://graph.facebook.com/${CONFIG.META_GRAPH_VERSION}/${CONFIG.META_PIXEL_ID}/events`;

  const body = {
    data: events,
  };

  // 토큰 설정
  if (CONFIG.META_ACCESS_TOKEN) {
    body.access_token = CONFIG.META_ACCESS_TOKEN;
  }

  // 테스트 이벤트 코드 (토큰 없어도 test_event_code만으로 Events Manager 확인 가능)
  if (CONFIG.META_TEST_EVENT_CODE) {
    body.test_event_code = CONFIG.META_TEST_EVENT_CODE;
  }

  // dry-run 모드: 전송 없이 페이로드 출력
  if (CONFIG.MODE === "dry-run") {
    log.warn("DRY-RUN 모드: 실제 전송 안 함");
    console.log("\n[dry-run 페이로드]");
    console.log(JSON.stringify(body, null, 2));
    return { dryRun: true, eventsCount: events.length };
  }

  // 토큰도 없고 테스트 코드도 없으면 전송 불가
  if (!CONFIG.META_ACCESS_TOKEN && !CONFIG.META_TEST_EVENT_CODE) {
    throw new Error(
      "META_CAPI_ACCESS_TOKEN 또는 META_CAPI_TEST_EVENT_CODE 중 하나 이상 필요합니다.\n" +
      "→ 2단계 인증 문제 해결 전: META_CAPI_TEST_EVENT_CODE를 .env.harness에 설정하세요.\n" +
      "→ Events Manager → 데이터 소스(픽셀) → 테스트 이벤트 탭에서 코드 확인"
    );
  }

  log.info(`Meta CAPI 전송 중... (${events.length}건, 모드: ${CONFIG.MODE})`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  const rawBody = await res.text().catch(() => "");
  let parsed = null;
  try { parsed = rawBody ? JSON.parse(rawBody) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const errMsg = parsed?.error?.message || rawBody.slice(0, 300);
    throw new Error(`Meta CAPI 전송 실패 (${res.status}): ${errMsg}`);
  }

  return {
    httpStatus: res.status,
    eventsReceived: parsed?.events_received,
    fbtrace_id: parsed?.fbtrace_id,
    messages: parsed?.messages,
    testMode: Boolean(CONFIG.META_TEST_EVENT_CODE),
  };
}

// ── 메인 실행 ────────────────────────────────────────────────
async function main() {
  log.section("Meta CAPI ↔ Beds24 하네스 시작");
  console.log(`모드: \x1b[1m${CONFIG.MODE}\x1b[0m`);
  console.log(`Pixel ID: ${CONFIG.META_PIXEL_ID}`);
  console.log(`테스트 이벤트 코드: ${CONFIG.META_TEST_EVENT_CODE || "(없음 — .env.harness에서 설정)"}`);
  console.log(`액세스 토큰: ${CONFIG.META_ACCESS_TOKEN ? "✓ 설정됨" : "✗ 미설정 (2단계 인증 해결 후 설정)"}`);
  console.log(`Beds24 토큰: ${CONFIG.BEDS24_REFRESH_TOKEN ? "✓ 설정됨" : "✗ 미설정"}`);
  console.log(`숙소: propId=${CONFIG.BEDS24_PROP_ID || "(미설정)"} roomId=${CONFIG.BEDS24_ROOM_ID || "(미설정)"}`);

  // ── Step 1: 설정 검증 ──────────────────────────────────────
  log.section("Step 1: 설정 검증");
  const errors = [];
  if (!CONFIG.BEDS24_REFRESH_TOKEN) errors.push("BEDS24_REFRESH_TOKEN (또는 HARNESS_BEDS24_REFRESH_TOKEN)");
  if (!CONFIG.BEDS24_PROP_ID)      errors.push("HARNESS_BEDS24_PROP_ID");
  if (!CONFIG.BEDS24_ROOM_ID)      errors.push("HARNESS_BEDS24_ROOM_ID");
  if (CONFIG.MODE !== "dry-run" && !CONFIG.META_ACCESS_TOKEN && !CONFIG.META_TEST_EVENT_CODE) {
    errors.push("META_CAPI_ACCESS_TOKEN 또는 META_CAPI_TEST_EVENT_CODE");
  }

  if (errors.length > 0) {
    log.error("필수 환경 변수 누락:");
    errors.forEach((e) => log.error(`  → ${e}`));
    log.warn("scripts/.env.harness.example을 복사하여 값을 채워주세요:");
    log.warn("  cp scripts/.env.harness.example scripts/.env.harness");
    process.exit(1);
  }
  log.ok("설정 검증 완료");

  // ── Step 2: Beds24 가격 조회 ───────────────────────────────
  log.section("Step 2: Beds24 가격 데이터 조회");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + CONFIG.BEDS24_DAYS_AHEAD);

  let priceMap;
  try {
    priceMap = await fetchBeds24Prices(
      CONFIG.BEDS24_PROP_ID,
      CONFIG.BEDS24_ROOM_ID,
      today,
      endDate
    );
  } catch (err) {
    log.error("Beds24 가격 조회 실패:", err.message);
    process.exit(1);
  }

  if (priceMap.size === 0) {
    log.warn("Beds24에서 가격 데이터가 없습니다. propId/roomId를 확인하세요.");
    if (CONFIG.MODE === "dry-run") {
      // dry-run에서는 더미 데이터로 계속 진행
      log.warn("dry-run: 더미 가격(5000 JPY)으로 계속 진행합니다.");
      priceMap.set(toDateKey(today), 5000);
    } else {
      process.exit(1);
    }
  }

  // 가격 샘플 출력
  const priceSample = [...priceMap.entries()].slice(0, 5);
  log.ok(`가격 샘플 (최대 5일):`);
  priceSample.forEach(([date, price]) => {
    console.log(`    ${date}: ${price.toLocaleString()} JPY`);
  });

  // ── Step 3: CAPI 이벤트 생성 ──────────────────────────────
  log.section("Step 3: CAPI 이벤트 생성 (ViewContent + 중복 제거 ID)");

  /**
   * 이벤트 생성 전략:
   * - 각 날짜별 가격 변동을 ViewContent로 CAPI에 전송
   * - Meta 동적 광고가 최신 가격을 참조할 수 있도록 함
   * - 배치 한도: Meta CAPI는 요청당 최대 1,000건 (여기서는 50건으로 제한)
   */
  const BATCH_SIZE = 50;
  const targetDateKeys = [...priceMap.keys()]
    .filter((dk) => dk >= toDateKey(today)) // 오늘 이후만
    .sort()
    .slice(0, BATCH_SIZE);

  const events = targetDateKeys.map((dateKey) => {
    const price = priceMap.get(dateKey);
    const eventId = generateEventId(CONFIG.LISTING_ID, dateKey);

    log.info(`  생성: ${dateKey} | ${price.toLocaleString()} JPY | eventId: ${eventId}`);

    return buildViewContentPayload({
      eventId,
      listingId: CONFIG.LISTING_ID,
      listingName: CONFIG.LISTING_NAME,
      pricePerNight: price,
      dateKey,
    });
  });

  log.ok(`이벤트 ${events.length}건 생성 완료`);

  // ── Step 4: Meta CAPI 전송 ────────────────────────────────
  log.section("Step 4: Meta CAPI 전송");

  // 배치 분할 전송 (안전을 위해 최대 50건씩)
  const SEND_BATCH = 50;
  let totalSent = 0;
  let totalReceived = 0;

  for (let i = 0; i < events.length; i += SEND_BATCH) {
    const batch = events.slice(i, i + SEND_BATCH);
    log.info(`배치 ${Math.floor(i / SEND_BATCH) + 1}: ${batch.length}건 전송 중...`);

    try {
      const result = await sendToMetaCapi(batch);
      if (result.dryRun) {
        totalSent += batch.length;
        continue;
      }

      totalSent += batch.length;
      totalReceived += result.eventsReceived || 0;

      log.ok(`배치 완료: events_received=${result.eventsReceived} fbtrace_id=${result.fbtrace_id}`);
      if (result.testMode) {
        log.warn("테스트 모드: Events Manager → 데이터 소스(픽셀) → 테스트 이벤트 탭에서 확인하세요.");
      }
      if (result.messages?.length) {
        result.messages.forEach((m) => log.warn(`  Meta 메시지: ${m}`));
      }
    } catch (err) {
      log.error(`배치 전송 실패:`, err.message);
      // 부분 실패 허용 — 다음 배치 계속 진행
    }
  }

  // ── 결과 요약 ──────────────────────────────────────────────
  log.section("실행 결과 요약");
  console.log(`  Beds24 가격 데이터: ${priceMap.size}일`);
  console.log(`  전송 대상 이벤트: ${events.length}건`);
  console.log(`  전송 완료: ${totalSent}건`);
  if (CONFIG.MODE !== "dry-run") {
    console.log(`  Meta 수신 확인: ${totalReceived}건`);
  }
  console.log(`  모드: ${CONFIG.MODE}`);

  if (CONFIG.META_TEST_EVENT_CODE) {
    console.log(`\n\x1b[33m[다음 단계]\x1b[0m`);
    console.log(`  1. Meta Events Manager → 데이터 소스 → 테스트 이벤트 탭 열기`);
    console.log(`  2. 테스트 이벤트 코드 "${CONFIG.META_TEST_EVENT_CODE}" 입력`);
    console.log(`  3. ViewContent 이벤트 ${events.length}건 수신 확인`);
    console.log(`  4. 2단계 인증 해결 후 META_CAPI_ACCESS_TOKEN 설정 → HARNESS_MODE=production으로 변경`);
  }

  if (CONFIG.MODE === "dry-run") {
    console.log(`\n\x1b[33m[dry-run 완료]\x1b[0m 실제 전송을 위해 HARNESS_MODE=test로 변경하세요.`);
  }

  log.section("하네스 종료");
}

main().catch((err) => {
  log.error("예상치 못한 오류:", err.message);
  if (process.env.HARNESS_DEBUG === "1") {
    console.error(err.stack);
  }
  process.exit(1);
});
