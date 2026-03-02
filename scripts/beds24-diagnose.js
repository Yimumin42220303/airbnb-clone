#!/usr/bin/env node
/**
 * Beds24 연동 진단 스크립트
 * - BEDS24_REFRESH_TOKEN 확인
 * - Beds24 연동 숙소 목록 조회
 * - 각 숙소별 가격 API 테스트
 *
 * 사용: npm run beds24:diagnose
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BEDS24_BASE = "https://beds24.com/api/v2";

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

async function getAccessToken() {
  const refreshToken = process.env.BEDS24_REFRESH_TOKEN?.trim();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BEDS24_BASE}/authentication/token`, {
      method: "GET",
      headers: { Accept: "application/json", refreshToken },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || null;
  } catch {
    return null;
  }
}

async function getBeds24CalendarPrices(propId, roomId, fromDate, toDate, offerIndex = 4, verbose = false) {
  const token = await getAccessToken();
  const result = new Map();
  if (!token) return result;

  const priceKey = `price${Math.min(16, Math.max(1, offerIndex))}`;
  const url = new URL(`${BEDS24_BASE}/inventory/rooms/calendar`);
  url.searchParams.set("propertyId", propId);
  url.searchParams.set("roomId", roomId);
  url.searchParams.set("startDate", toDateKey(fromDate));
  url.searchParams.set("endDate", toDateKey(toDate));
  url.searchParams.set("includePrices", "true");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", token },
      signal: AbortSignal.timeout(30000),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error(`JSON 파싱 실패: ${text.slice(0, 200)}`);
    }
    const items = Array.isArray(raw?.data) ? raw.data : [];

    const extractPrices = (key) => {
      const map = new Map();
      for (const item of items) {
        const ranges = item.calendar;
        if (!Array.isArray(ranges)) continue;
        for (const range of ranges) {
          const fromStr = range.from;
          const toStr = range.to;
          const price = range[key];
          if (typeof price !== "number" || price <= 0 || !fromStr || !toStr) continue;
          const fromD = new Date(fromStr);
          const toD = new Date(toStr);
          if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) continue;
          const dateKeys = getDateKeysBetween(fromD, toD);
          for (const dk of dateKeys) map.set(dk, Math.round(price));
        }
      }
      return map;
    };

    let primary = extractPrices(priceKey);
    let usedFallback = null;
    if (primary.size === 0) {
      for (let i = 1; i <= 16; i++) {
        const fallback = extractPrices(`price${i}`);
        if (fallback.size > 0) {
          primary = fallback;
          usedFallback = i;
          break;
        }
      }
    }

    primary.forEach((v, k) => result.set(k, v));
    if (verbose && items.length > 0 && usedFallback) {
      console.log(`  [진단] 설정된 가격컬럼(${offerIndex})에 데이터 없음 → price${usedFallback} 사용 중 (beds24OfferIndex를 ${usedFallback}로 변경 권장)`);
    }
  } catch (err) {
    throw err;
  }
  return result;
}

async function main() {
  console.log("\n=== Beds24 연동 진단 ===\n");

  const hasToken = !!process.env.BEDS24_REFRESH_TOKEN?.trim();
  console.log("1. BEDS24_REFRESH_TOKEN:", hasToken ? "설정됨 ✓" : "미설정 ✗");
  if (!hasToken) {
    console.log("\n   → .env에 BEDS24_REFRESH_TOKEN을 추가하세요.");
    console.log("   → Vercel: Settings → Environment Variables");
    process.exit(1);
  }

  const token = await getAccessToken();
  console.log("   토큰 획득:", token ? "성공 ✓" : "실패 ✗ (Refresh Token 만료/잘못됨)");
  if (!token) process.exit(1);

  const listings = await prisma.listing.findMany({
    where: {
      beds24PropId: { not: null },
      beds24RoomId: { not: null },
    },
    select: {
      id: true,
      title: true,
      beds24Enabled: true,
      beds24PropId: true,
      beds24RoomId: true,
      beds24OfferIndex: true,
    },
  });

  console.log("\n2. Beds24 연동 숙소:", listings.length, "개");
  if (listings.length === 0) {
    console.log("   → 숙소 수정에서 Prop ID, Room ID를 설정하세요.");
    process.exit(0);
  }

  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(fromDate);
  toDate.setMonth(toDate.getMonth() + 2);

  console.log("\n3. 가격 API 테스트 (", toDateKey(fromDate), "~", toDateKey(toDate), ")");
  console.log("-".repeat(60));

  for (const l of listings) {
    const propId = l.beds24PropId?.trim();
    const roomId = l.beds24RoomId?.trim();
    const offerIdx = Math.min(16, Math.max(1, l.beds24OfferIndex ?? 4));

    if (!propId || !roomId) {
      console.log(`\n[${l.title}] (${l.id})`);
      console.log("  → Prop ID 또는 Room ID 누락");
      continue;
    }

    try {
      const verbose = true;
      const prices = await getBeds24CalendarPrices(propId, roomId, fromDate, toDate, offerIdx, verbose);
      const sample = Array.from(prices.entries()).slice(0, 5);

      console.log(`\n[${l.title}] (${l.id})`);
      console.log(`  Prop: ${propId}, Room: ${roomId}, 가격컬럼: ${offerIdx}`);
      console.log(`  가져온 날짜 수: ${prices.size}일`);

      if (prices.size === 0) {
        console.log("  ⚠️ Beds24에서 가격 데이터 없음 (price1~16 모두 비어있음)");
      } else {
        console.log("  샘플:", sample.map(([d, p]) => `${d}: ¥${p}`).join(", "));
      }
    } catch (err) {
      console.log(`\n[${l.title}] (${l.id})`);
      console.log("  ✗ 오류:", err instanceof Error ? err.message : String(err));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("진단 완료.\n");
}

main()
  .catch((e) => {
    console.error("진단 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
