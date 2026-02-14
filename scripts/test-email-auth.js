/**
 * 이메일 회원가입 → 인증 플로우 테스트
 * 실행: node scripts/test-email-auth.js
 */
const BASE = process.env.TEST_BASE_URL || "http://localhost:3002";
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "testpassword123";

async function main() {
  console.log("\n=== 이메일 회원가입/인증 테스트 ===\n");
  console.log("Base URL:", BASE);
  console.log("Test email:", TEST_EMAIL);

  // 1. 회원가입
  console.log("\n1. 회원가입...");
  const signupRes = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      name: "테스트유저",
    }),
  });
  const signupData = await signupRes.json();
  if (!signupRes.ok) {
    console.error("❌ 회원가입 실패:", signupData);
    process.exit(1);
  }
  console.log("✅ 회원가입 성공:", signupData.message);

  // 2. DB에서 verification token 조회
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const vt = await prisma.verificationToken.findFirst({
    where: { identifier: `signup:${TEST_EMAIL}` },
  });
  if (!vt) {
    console.error("❌ VerificationToken을 찾을 수 없음");
    process.exit(1);
  }

  // 3. 이메일 인증
  console.log("\n2. 이메일 인증...");
  const verifyRes = await fetch(`${BASE}/api/auth/verify-email?token=${vt.token}`, {
    redirect: "manual",
  });
  if (verifyRes.status !== 302 && verifyRes.status !== 307) {
    console.error("❌ 인증 실패: status", verifyRes.status);
    process.exit(1);
  }
  const location = verifyRes.headers.get("location") || "";
  if (!location.includes("verified=1")) {
    console.error("❌ 인증 후 verified=1 리다이렉트 아님:", location);
    process.exit(1);
  }
  console.log("✅ 이메일 인증 성공");

  // 4. DB에서 사용자 emailVerified 확인
  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
    select: { email: true, emailVerified: true, password: true },
  });
  if (!user?.emailVerified) {
    console.error("❌ 사용자 emailVerified 미설정");
    process.exit(1);
  }
  console.log("✅ 사용자 emailVerified 확인됨");

  // 5. 로그인 가능 여부 확인 (비밀번호 검증)
  const { scrypt } = require("crypto");
  const { promisify } = require("util");
  const scryptAsync = promisify(scrypt);
  const [salt, key] = user.password.split(":");
  const derived = (await scryptAsync(TEST_PASSWORD, salt, 64)).toString("hex");
  if (derived !== key) {
    console.error("❌ 비밀번호 검증 실패");
    process.exit(1);
  }
  console.log("✅ 비밀번호 검증 성공 (로그인 가능)");

  await prisma.$disconnect();
  console.log("\n=== 모든 테스트 통과 ===");
  console.log("→ 브라우저에서", BASE + "/auth/signin", "접속 후");
  console.log("  이메일:", TEST_EMAIL, "/ 비밀번호:", TEST_PASSWORD, "로 로그인 가능\n");
}

main().catch((err) => {
  console.error("테스트 실패:", err);
  process.exit(1);
});
