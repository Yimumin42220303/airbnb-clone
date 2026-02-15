/**
 * QA 테스트 스크립트
 * 실행: node scripts/qa-test.js
 * 개발 서버가 localhost:3000에서 실행 중이어야 함
 */

const BASE = "http://localhost:3000";

async function fetchOk(url, options = {}) {
  const res = await fetch(url, options);
  return { ok: res.ok, status: res.status, url };
}

async function runTests() {
  const results = [];
  let passed = 0;
  let failed = 0;

  function add(name, ok, detail = "") {
    results.push({ name, ok, detail });
    if (ok) passed++;
    else failed++;
  }

  console.log("=== QA 테스트 시작 ===\n");

  // 1. 메인 페이지
  try {
    const r = await fetchOk(BASE + "/");
    add("메인 페이지 로드", r.ok, `status: ${r.status}`);
  } catch (e) {
    add("메인 페이지 로드", false, e.message);
  }

  // 2. AI 추천 섹션 (메인에 포함)
  try {
    const r = await fetchOk(BASE + "/");
    const html = await (await fetch(BASE + "/")).text();
    add("AI 추천 섹션 포함", html.includes("ai-recommend") || html.includes("AI 맞춤"), "");
  } catch (e) {
    add("AI 추천 섹션 포함", false, e.message);
  }

  // 3. 검색 페이지
  try {
    const r = await fetchOk(BASE + "/search");
    add("검색 페이지 로드", r.ok, `status: ${r.status}`);
  } catch (e) {
    add("검색 페이지 로드", false, e.message);
  }

  // 4. /recommend 리다이렉트
  try {
    const r = await fetch(BASE + "/recommend", { redirect: "manual" });
    add("/recommend 리다이렉트", r.status === 307 || r.status === 308, `status: ${r.status}`);
  } catch (e) {
    add("/recommend 리다이렉트", false, e.message);
  }

  // 5. 호스트 숙소 목록 (인증 필요 - 401 예상)
  try {
    const r = await fetchOk(BASE + "/api/host/listings");
    add("호스트 API 인증 필요", !r.ok && r.status === 401, `status: ${r.status} (401 예상)`);
  } catch (e) {
    add("호스트 API 인증 필요", false, e.message);
  }

  // 6. 숙소 등록 API (인증 필요 - 401 예상)
  try {
    const r = await fetch(BASE + "/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "test", location: "test", pricePerNight: 10000 }),
    });
    add("숙소 등록 API 인증 필요", !r.ok && r.status === 401, `status: ${r.status} (401 예상)`);
  } catch (e) {
    add("숙소 등록 API 인증 필요", false, e.message);
  }

  // 7. AI 추천 API (인증 불필요, 날짜 필수)
  try {
    const r = await fetch(BASE + "/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkIn: "", checkOut: "", adults: 1, children: 0, preferences: "" }),
    });
    const data = await r.json();
    add("AI 추천 API 날짜 검증", !r.ok && r.status === 400, `status: ${r.status}`);
  } catch (e) {
    add("AI 추천 API 날짜 검증", false, e.message);
  }

  // 8. 리스팅 목록 API
  try {
    const r = await fetchOk(BASE + "/api/listings");
    add("리스팅 목록 API", r.ok, `status: ${r.status}`);
  } catch (e) {
    add("리스팅 목록 API", false, e.message);
  }

  // 결과 출력
  console.log("\n=== 결과 ===\n");
  results.forEach(({ name, ok, detail }) => {
    const icon = ok ? "✓" : "✗";
    const msg = detail ? ` (${detail})` : "";
    console.log(`  ${icon} ${name}${msg}`);
  });
  console.log(`\n통과: ${passed} / 실패: ${failed} / 총: ${results.length}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error("테스트 실행 오류:", e.message);
  process.exit(1);
});
