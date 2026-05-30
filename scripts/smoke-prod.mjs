#!/usr/bin/env node
/**
 * Production smoke test (read-only GET). No DB writes.
 */
const BASE = process.env.SMOKE_BASE || "https://tokyominbak.net";

const STATIC_PATHS = [
  "/",
  "/search",
  "/blog",
  "/about",
  "/trust",
  "/policy",
  "/agreement",
  "/recommend",
  "/lp/host",
  "/auth/signin",
  "/auth/verify-request",
  "/messages",
  "/mypage",
  "/wishlist",
  "/my-bookings",
  "/notifications",
  "/host",
  "/help/beds24-calendar",
  "/mock",
];

const ERROR_PATTERNS = [
  /Application error/i,
  /Internal Server Error/i,
  /500\s*-\s*Internal/i,
  /This page could not be found/i, // only flag if unexpected
];

async function fetchPath(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    redirect: opts.followRedirect !== false ? "follow" : "manual",
    headers: {
      "User-Agent": "tokyominbak-smoke/1.0",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  return { path, url, status: res.status, text, headers: res.headers };
}

function extractHrefs(html, pattern) {
  const out = [];
  const re = pattern || /href="(\/[^"#?]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const p = m[1].replace(/&amp;/g, "&");
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

async function main() {
  const results = [];
  const failures = [];
  const warnings = [];

  console.log(`\n=== Smoke test: ${BASE} ===\n`);

  // 1) Static routes
  for (const path of STATIC_PATHS) {
    try {
      const r = await fetchPath(path);
      const ok = r.status >= 200 && r.status < 400;
      results.push({ path, status: r.status, ok });
      if (!ok) failures.push({ path, status: r.status, issue: "bad status" });
      for (const pat of ERROR_PATTERNS) {
        if (pat.test(r.text) && r.status === 200) {
          warnings.push({ path, issue: `body matches ${pat}` });
        }
      }
    } catch (e) {
      failures.push({ path, issue: e.message });
    }
  }

  // 2) Homepage → listing links
  const home = await fetchPath("/");
  const listingPaths = extractHrefs(home.text, /href="(\/listing\/[^"#?]+)/g).slice(0, 5);
  for (const path of listingPaths) {
    try {
      const r = await fetchPath(path);
      results.push({ path, status: r.status, ok: r.status === 200 });
      if (r.status !== 200) failures.push({ path, status: r.status, issue: "listing not 200" });
      if (/Application error/i.test(r.text)) {
        failures.push({ path, issue: "Application error in body" });
      }
    } catch (e) {
      failures.push({ path, issue: e.message });
    }
  }

  // 3) Blog slugs
  const blogList = await fetchPath("/blog");
  const blogPaths = extractHrefs(blogList.text, /href="(\/blog\/[^"#?]+)/g);
  for (const path of blogPaths) {
    try {
      const r = await fetchPath(path);
      results.push({ path, status: r.status, ok: r.status === 200 });
      if (r.status !== 200) failures.push({ path, status: r.status, issue: "blog slug not 200" });
    } catch (e) {
      failures.push({ path, issue: e.message });
    }
  }

  // 4) Login-only pages metadata
  for (const path of ["/messages", "/mypage", "/wishlist"]) {
    const r = await fetchPath(path);
    const hasNoindex =
      r.text.includes('name="robots"') &&
      (r.text.includes("noindex") || r.text.includes('"noindex"'));
    const hasLogin =
      r.text.includes("로그인") || r.text.includes("signin") || r.text.includes("Sign in");
    if (!hasNoindex) warnings.push({ path, issue: "robots noindex not found in HTML" });
    if (!hasLogin) warnings.push({ path, issue: "login prompt/signin hint not found" });
  }

  // 5) about/trust duplicate step numbers
  for (const path of ["/about", "/trust"]) {
    const r = await fetchPath(path);
    if (/\b1\.\s*1\b/.test(r.text) || />\s*1\.\s*1\s*</.test(r.text)) {
      warnings.push({ path, issue: "possible duplicate step number '1. 1'" });
    }
  }

  // 6) API health (if exists)
  for (const path of ["/api/health", "/api/auth/session"]) {
    try {
      const r = await fetchPath(path);
      results.push({ path, status: r.status, ok: r.status < 500 });
      if (r.status >= 500) failures.push({ path, status: r.status, issue: "api 5xx" });
    } catch {
      /* optional */
    }
  }

  // Report
  const byStatus = {};
  for (const r of results) {
    const k = String(r.status);
    byStatus[k] = (byStatus[k] || 0) + 1;
  }

  console.log("--- Status summary ---");
  Object.entries(byStatus)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([s, n]) => console.log(`  HTTP ${s}: ${n} routes`));

  console.log(`\n--- Tested ${results.length} dynamic + static routes ---`);
  console.log(`Listings sampled: ${listingPaths.length}`);
  console.log(`Blog slugs: ${blogPaths.length}`);

  if (failures.length) {
    console.log("\n❌ FAILURES:");
    failures.forEach((f) => console.log(`  ${f.path || "?"} — ${f.issue}${f.status ? ` (${f.status})` : ""}`));
  } else {
    console.log("\n✅ No HTTP failures (5xx / unexpected errors)");
  }

  if (warnings.length) {
    console.log("\n⚠️  WARNINGS:");
    warnings.forEach((w) => console.log(`  ${w.path} — ${w.issue}`));
  }

  // Print all non-200 for transparency
  const notable = results.filter((r) => r.status !== 200);
  if (notable.length) {
    console.log("\n--- Non-200 responses (may be expected) ---");
    notable.forEach((r) => console.log(`  ${r.status} ${r.path}`));
  }

  console.log("");
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
