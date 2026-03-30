# Discord 결제 알림 설정

게스트가 결제를 완료하면 지정한 **Discord 채널**로 메시지가 전송됩니다.

---

## 1. Discord 웹후크 URL 발급

1. **Discord**에서 알림을 받을 **서버** 선택.
2. 알림 받을 **채널**에서 **채널 설정**(톱니바퀴) 클릭.
3. 왼쪽 **연동** → **웹후크** → **새 웹후크** (또는 **웹후크 만들기**).
4. 이름(예: 도쿄민박 알림) 입력 후 **웹후크 URL 복사**.
   - 형식: `https://discord.com/api/webhooks/숫자/토큰`

---

## 2. 환경 변수 설정

- **로컬**: `.env`에 추가.
  ```
  DISCORD_WEBHOOK_URL="여기에_복사한_웹후크_URL"
  ```
- **Vercel**: Settings → Environment Variables에서 `DISCORD_WEBHOOK_URL` 추가 후 재배포.

---

## 3. 동작

- **설정한 경우**: 결제 확정 시 Discord 채널에 예시처럼 전송됩니다.
  ```
  💰 **결제 완료** 홍길동님이 **신주쿠 숙소** 예약 확정 (체크인 2026-03-15 ~ 2026-03-18)
  https://tokyominbak.net/host/bookings
  ```
- **미설정**: `DISCORD_WEBHOOK_URL`이 없으면 전송을 건너뛰고, 결제·이메일 등은 그대로 동작합니다.

휴대폰 Discord 앱 알림으로도 결제 완료를 바로 확인할 수 있습니다.
