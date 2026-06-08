/**
 * 프로덕션 BookingForm prefill 브라우저 E2E (일회성, package.json 미추가)
 * 실행: npx --yes -p playwright@1.49.1 node scripts/e2e-recommend-prefill.mjs
 */
import { chromium } from "playwright";

const BASE = "https://tokyominbak.net";
const LISTING_ID = "cmpgv3pt60001sqj38hspf109";

const out = { scenarios: {} };

async function waitForPrice(form) {
  for (let i = 0; i < 20; i++) {
    const text = await form.innerText();
    if (text.includes("총 숙박 요금") || text.includes("合計宿泊料")) return text;
    if (text.includes("계산 중")) {
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return await form.innerText();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: "ko-KR" });

  // A–C: /recommend → 상세 → confirm
  const page = await context.newPage();
  try {
    await page.goto(
      `${BASE}/recommend?checkIn=2026-06-24&checkOut=2026-06-26&guests=2`,
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );
    await page.getByRole("button", { name: "숙소 3곳 추천받기" }).click();
    const detailLink = page.getByRole("link", { name: "숙소 자세히 보기" }).first();
    await detailLink.waitFor({ timeout: 120000 });
    const href = await detailLink.getAttribute("href");
    out.scenarios.A = {
      href,
      hrefHasDates:
        !!href?.includes("checkIn=2026-06-24") &&
        !!href?.includes("checkOut=2026-06-26"),
    };
    await detailLink.click();
    await page.waitForURL(/\/listing\//, { timeout: 30000 });
    const form = page.locator("#booking-form");
    await form.waitFor({ timeout: 15000 });
    const formText = await waitForPrice(form);
    const url = page.url();
    out.scenarios.A = {
      ...out.scenarios.A,
      listingUrl: url,
      urlHasCheckIn: url.includes("checkIn=2026-06-24"),
      urlHasCheckOut: url.includes("checkOut=2026-06-26"),
      urlHasGuests: url.includes("guests=2"),
      urlHasSource: url.includes("sourcePage=recommend"),
      checkInDisplayed: /6월\s*24일|2026년\s*6월\s*24일/.test(formText),
      checkOutDisplayed: /6월\s*26일|2026년\s*6월\s*26일/.test(formText),
      guests2Displayed: /게스트\s*2명/.test(formText),
      noAddDatePlaceholder: !formText.includes("날짜 추가"),
      totalPriceDisplayed:
        formText.includes("총 숙박 요금") || formText.includes("청소비 포함"),
      priceHintGone: !(await page
        .getByText("체크인·체크아웃 선택 후 총 요금을 확인할 수 있어요")
        .isVisible()
        .catch(() => false)),
    };

    // B: 인원 변경
    await form.getByRole("button").filter({ hasText: /게스트/ }).click();
    await page.getByLabel("성인 늘리기").click();
    await page.getByRole("button", { name: "닫기" }).click();
    await new Promise((r) => setTimeout(r, 2500));
    const afterGuest = await form.innerText();
    out.scenarios.B = {
      guests3AfterChange: /게스트\s*3명/.test(afterGuest),
      stillHasDates: /6월\s*24일/.test(afterGuest) && /6월\s*26일/.test(afterGuest),
    };

    // C: 예약하기 → confirm
    const reserve = form.getByRole("button", { name: /예약하기|予約する/ });
    await reserve.click();
    await page.waitForURL(/\/booking\/confirm/, { timeout: 20000 });
    out.scenarios.C = {
      confirmUrl: page.url(),
      hasCheckIn: page.url().includes("checkIn=2026-06-24"),
      hasCheckOut: page.url().includes("checkOut=2026-06-26"),
      hasGuests: /guests=/.test(page.url()),
    };
  } catch (e) {
    out.scenarios.ABC_error = String(e);
  }

  // D: invalid query
  const pD = await context.newPage();
  try {
    await pD.goto(`${BASE}/listing/${LISTING_ID}?checkIn=abc&checkOut=xyz`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const ft = await pD.locator("#booking-form").innerText();
    out.scenarios.D = {
      noCrash: true,
      usesDefaultAddDate: ft.includes("날짜 추가"),
    };
  } catch (e) {
    out.scenarios.D = { noCrash: false, error: String(e) };
  }

  // E: reversed dates
  const pE = await context.newPage();
  try {
    await pE.goto(
      `${BASE}/listing/${LISTING_ID}?checkIn=2026-06-26&checkOut=2026-06-24&adults=2`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );
    const ft = await pE.locator("#booking-form").innerText();
    out.scenarios.E = {
      noCrash: true,
      datesIgnored:
        ft.includes("날짜 추가") ||
        (!/6월\s*24일/.test(ft) && !/6월\s*26일/.test(ft)),
    };
  } catch (e) {
    out.scenarios.E = { noCrash: false, error: String(e) };
  }

  // F: direct listing
  const pF = await context.newPage();
  try {
    await pF.goto(`${BASE}/listing/${LISTING_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await pF.locator("#booking-form").waitFor({ timeout: 15000 });
    out.scenarios.F = { ok: pF.url().includes(`/listing/${LISTING_ID}`) };
  } catch (e) {
    out.scenarios.F = { ok: false, error: String(e) };
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
