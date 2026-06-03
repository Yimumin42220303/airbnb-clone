/**
 * batch-price vs 단건 price API 정합성 검증
 *
 * 실행 예:
 *   node scripts/verify-batch-price.mjs
 *   BASE_URL=https://tokyominbak.net LISTING_ID=... CHECK_IN=2026-06-24 CHECK_OUT=2026-06-26 GUESTS=2 node scripts/verify-batch-price.mjs
 *
 * 환경변수:
 *   BASE_URL   — 기본 http://localhost:3000 (운영/프리뷰/로컬)
 *   LISTING_ID — 검증 숙소 ID
 *   CHECK_IN, CHECK_OUT, GUESTS
 */
const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const LISTING_ID = process.env.LISTING_ID ?? "cmpgv3pt60001sqj38hspf109";
const CHECK_IN = process.env.CHECK_IN ?? "2026-06-24";
const CHECK_OUT = process.env.CHECK_OUT ?? "2026-06-26";
const GUESTS = Number(process.env.GUESTS ?? "2");

async function readJson(res, label) {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(`${label}: empty body (HTTP ${res.status})`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `${label}: non-JSON HTTP ${res.status}: ${text.slice(0, 200)}`
    );
  }
}

function nightsFromSingle(single) {
  return Array.isArray(single.nights) ? single.nights.length : 0;
}

async function main() {
  console.log("BASE_URL:", BASE);
  console.log("listing:", LISTING_ID, CHECK_IN, "->", CHECK_OUT, "guests:", GUESTS);

  const singleUrl = `${BASE}/api/listings/${LISTING_ID}/price?checkIn=${encodeURIComponent(CHECK_IN)}&checkOut=${encodeURIComponent(CHECK_OUT)}&guests=${GUESTS}`;

  const [singleRes, batchRes] = await Promise.all([
    fetch(singleUrl, { cache: "no-store" }),
    fetch(`${BASE}/api/listings/batch-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingIds: [LISTING_ID],
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        guests: GUESTS,
      }),
    }),
  ]);

  const single = await readJson(singleRes, "single");
  const batch = await readJson(batchRes, "batch");
  const batchItem = batch.prices?.[LISTING_ID];

  const singleNights = nightsFromSingle(single);
  console.log("single:", singleRes.status, {
    totalPrice: single.totalPrice,
    nights: singleNights,
    allAvailable: single.allAvailable,
  });
  console.log("batch:", batchRes.status, batchItem
    ? {
        totalPrice: batchItem.totalPrice,
        nights: batchItem.nights,
        allAvailable: batchItem.allAvailable,
      }
    : batch.error ?? "missing listing");

  if (!singleRes.ok) {
    console.error("single error:", single.error);
    process.exit(1);
  }
  if (!batchRes.ok || !batchItem) {
    console.error("batch error:", batch.error ?? "missing listing in prices");
    process.exit(1);
  }

  const checks = [
    ["totalPrice", single.totalPrice === batchItem.totalPrice],
    ["nights", singleNights === batchItem.nights],
    ["allAvailable", single.allAvailable === batchItem.allAvailable],
  ];

  let ok = true;
  for (const [field, pass] of checks) {
    if (!pass) {
      ok = false;
      console.error(
        `FAIL ${field}: single=${JSON.stringify(single[field] ?? singleNights)} batch=${JSON.stringify(batchItem[field])}`
      );
    }
  }

  if (ok) {
    console.log("OK: totalPrice, nights, allAvailable 일치");
  }
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
