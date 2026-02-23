/**
 * Beds24 Invite Code → Refresh Token 발급
 * 사용: node scripts/beds24-get-refresh-token.js "YOUR_INVITE_CODE"
 *
 * 출력: refreshToken (이 값을 .env의 BEDS24_REFRESH_TOKEN에 설정)
 */

const inviteCode = process.argv[2]?.trim();
if (!inviteCode) {
  console.error("사용법: node scripts/beds24-get-refresh-token.js \"YOUR_INVITE_CODE\"");
  process.exit(1);
}

async function main() {
  const url = "https://beds24.com/api/v2/authentication/setup";
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      code: inviteCode,
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("응답 파싱 실패:", text.slice(0, 200));
    process.exit(1);
  }

  if (!res.ok) {
    console.error("오류:", res.status, data.error || data.message || text);
    process.exit(1);
  }

  const { token, expiresIn, refreshToken } = data;
  if (!refreshToken) {
    console.error("refreshToken이 응답에 없습니다:", data);
    process.exit(1);
  }

  console.log("=== Beds24 Refresh Token 발급 완료 ===");
  console.log("Access Token (유효시간):", expiresIn, "초");
  console.log("");
  console.log("아래 값을 .env 파일의 BEDS24_REFRESH_TOKEN에 설정하세요:");
  console.log("");
  console.log('BEDS24_REFRESH_TOKEN="' + refreshToken + '"');
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
