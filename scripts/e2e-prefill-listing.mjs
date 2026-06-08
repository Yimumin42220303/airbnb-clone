import { chromium } from "playwright";

const BASE = "https://tokyominbak.net";
const LISTING_ID = "cmpgv3pt60001sqj38hspf109";
const QS =
  "checkIn=2026-06-24&checkOut=2026-06-26&adults=2&children=0&guests=2&sourcePage=recommend";

function hasCheckInText(t) {
  return /6월\s*24일|2026년\s*6월\s*24일|2026年6月24日|6月24日/.test(t);
}
function hasCheckOutText(t) {
  return /6월\s*26일|2026년\s*6월\s*26일|2026年6月26日|6月26日/.test(t);
}
function hasGuests2(t) {
  return /게스트\s*2명|ゲスト\s*2名|2\s*名/.test(t);
}
function hasAddDatePlaceholder(t) {
  return t.includes("날짜 추가") || t.includes("日付を追加");
}
function hasTotalPrice(t) {
  return (
    t.includes("총 숙박 요금") ||
    t.includes("총액") ||
    t.includes("合計") ||
    t.includes("宿泊料金") ||
    /¥[\d,]+/.test(t)
  );
}

async function readForm(page) {
  const form = page.locator("#booking-form");
  await form.waitFor({ timeout: 20000 });
  for (let i = 0; i < 60; i++) {
    const t = await form.innerText();
    const calculating = t.includes("計算中") || t.includes("계산 중");
    if (
      hasCheckInText(t) &&
      hasCheckOutText(t) &&
      !hasAddDatePlaceholder(t) &&
      (hasTotalPrice(t) || (!calculating && i > 15))
    ) {
      return { formText: t, form };
    }
    await page.waitForTimeout(1000);
  }
  return { formText: await form.innerText(), form };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const out = {};

  try {
    const p = await ctx.newPage();
    await p.goto(`${BASE}/listing/${LISTING_ID}?${QS}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    const { formText, form } = await readForm(p);
    out.A = {
      url: p.url(),
      urlOk:
        p.url().includes("checkIn=2026-06-24") &&
        p.url().includes("checkOut=2026-06-26") &&
        p.url().includes("sourcePage=recommend"),
      checkInDisplayed: hasCheckInText(formText),
      checkOutDisplayed: hasCheckOutText(formText),
      guests2: hasGuests2(formText),
      noAddDate: !hasAddDatePlaceholder(formText),
      totalPrice: hasTotalPrice(formText),
      snippet: formText.replace(/\s+/g, " ").slice(0, 400),
    };

    const guestBtn = form.getByRole("button").filter({ hasText: /게스트|ゲスト|名/ });
    await guestBtn.first().click();
    const inc = p.locator('[aria-label*="増やす"], [aria-label*="늘리기"]').first();
    if (await inc.isEnabled({ timeout: 5000 }).catch(() => false)) {
      await inc.click();
    }
    await p.keyboard.press("Escape");
    await p.waitForTimeout(2500);
    const after = await form.innerText();
    out.B = {
      guestsChanged: /게스트\s*3명|ゲスト\s*3名|3\s*名/.test(after),
      stillDates: hasCheckInText(after),
    };

    await form.locator('button[type="submit"]').click({ timeout: 10000 });
    await p.waitForURL(/\/booking\/confirm/, { timeout: 25000 });
    out.C = {
      url: p.url(),
      hasCheckIn: p.url().includes("checkIn=2026-06-24"),
      hasCheckOut: p.url().includes("checkOut=2026-06-26"),
      hasGuests: p.url().includes("guests="),
    };
  } catch (e) {
    out.ABC_error = String(e);
  }

  for (const [key, path] of [
    ["D", `?checkIn=abc&checkOut=xyz`],
    ["E", `?checkIn=2026-06-26&checkOut=2026-06-24&adults=2`],
    ["F", ""],
  ]) {
    try {
      const pg = await ctx.newPage();
      await pg.goto(`${BASE}/listing/${LISTING_ID}${path}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await pg.waitForTimeout(3000);
      const t = await pg.locator("#booking-form").innerText();
      out[key] = {
        ok: true,
        addDate: hasAddDatePlaceholder(t),
        hasJune24: hasCheckInText(t),
      };
    } catch (e) {
      out[key] = { ok: false, error: String(e) };
    }
  }

  await browser.close();
  console.log(JSON.stringify(out, null, 2));
  const pass =
    out.A?.checkInDisplayed &&
    out.A?.checkOutDisplayed &&
    out.A?.guests2 &&
    out.A?.noAddDate &&
    out.A?.totalPrice &&
    out.C?.hasCheckIn &&
    out.D?.ok &&
    !out.D?.hasJune24 &&
    out.E?.ok &&
    !out.E?.hasJune24;
  process.exit(pass ? 0 : 1);
}

main();
