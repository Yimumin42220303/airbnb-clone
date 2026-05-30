#!/usr/bin/env node
/**
 * Beds24 캘린더 블록 수정 검증 (배포 후)
 * node scripts/verify-beds24-calendar-fix.js
 */
require("dotenv").config({ path: ".env" });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const LISTING_ID = "cmo6h6as9002dj9es8w08evnt";
const PAID_BOOKING_ID = "cmpsamk1y0001dciffq3mqrdg";
const BEDS24_BASE = "https://beds24.com/api/v2";

async function beds24Token(accountKey) {
  const k = (accountKey || "").trim();
  const refresh =
    (k && process.env[`BEDS24_REFRESH_TOKEN_${k}`]?.trim()) ||
    process.env.BEDS24_REFRESH_TOKEN?.trim();
  if (!refresh) return null;
  const res = await fetch(`${BEDS24_BASE}/authentication/token`, {
    headers: { Accept: "application/json", refreshToken: refresh },
  });
  const data = await res.json();
  return res.ok && data.token ? data.token : null;
}

async function beds24Blocked(propId, roomId, accountKey, from, to) {
  const token = await beds24Token(accountKey);
  if (!token) return { error: "no_token" };
  const url = `${BEDS24_BASE}/inventory/rooms/availability?propId=${propId}&roomId=${roomId}&from=${from.replace(/-/g, "")}&to=${to.replace(/-/g, "")}`;
  const res = await fetch(url, { headers: { Accept: "application/json", token } });
  const j = await res.json();
  const avail = j.data?.[0]?.availability || {};
  const keys = ["2026-06-18", "2026-06-19", "2026-06-20", "2026-06-21", "2026-06-22"];
  const snap = {};
  for (const k of keys) snap[k] = avail[k];
  return { snap, blockedFalseMeansBlocked: true };
}

async function main() {
  const listing = await prisma.listing.findUnique({
    where: { id: LISTING_ID },
    select: { beds24PropId: true, beds24RoomId: true, beds24AccountKey: true },
  });
  const paid = await prisma.booking.findUnique({
    where: { id: PAID_BOOKING_ID },
    select: { beds24BookId: true, paymentStatus: true, checkIn: true, checkOut: true },
  });

  let prodBlocked = null;
  try {
    const res = await fetch(
      `https://tokyominbak.net/api/listings/${LISTING_ID}/blocked-dates?from=2026-06-01&to=2026-06-30`,
      { signal: AbortSignal.timeout(15000) }
    );
    prodBlocked = { status: res.status, body: await res.json() };
  } catch (e) {
    prodBlocked = { error: e.message };
  }

  const beds24 = listing
    ? await beds24Blocked(
        listing.beds24PropId,
        listing.beds24RoomId,
        listing.beds24AccountKey,
        "2026-06-01",
        "2026-06-30"
      )
    : null;

  const june20blocked =
    beds24?.snap?.["2026-06-20"] === false && beds24?.snap?.["2026-06-21"] === false;
  const prodHasJune20 =
    Array.isArray(prodBlocked?.body?.blockedDateKeys) &&
    prodBlocked.body.blockedDateKeys.includes("2026-06-20");

  console.log(
    JSON.stringify(
      {
        deploy: "https://tokyominbak.net (Ef8MujjJNudQnLxCQrorqFrZvYpp)",
        paidBooking: paid,
        beds24JuneAvailability: beds24,
        productionBlockedDatesApi: prodBlocked,
        verification: {
          rootCauseFixedInCode: "POST body array + new.id parse + idempotent sync",
          beds24ShowsPaidNightsBlocked: june20blocked,
          tokyominbakSiteShowsJune20Blocked: prodHasJune20,
          calendarBlockIssueResolved:
            june20blocked && prodHasJune20 && !!paid?.beds24BookId,
          noteAirbnb:
            "Airbnb는 Beds24 채널 동기화 지연 가능. Beds24에 블록되면 코드 경로는 정상.",
        },
      },
      null,
      2
    )
  );
}

main().finally(() => prisma.$disconnect());
