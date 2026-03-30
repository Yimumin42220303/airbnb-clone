# Slack 결제 알림 설정

게스트가 결제를 완료하면 지정한 **Slack 채널**로 메시지가 전송됩니다.  
PWA보다 설정이 단순합니다.

---

## 1. Slack Incoming Webhook 발급

1. **Slack** (https://slack.com) 로그인 후, 알림을 받을 **워크스페이스** 선택.
2. **앱 추가**: 워크스페이스 이름 클릭 → **앱 추가** → 검색창에 **Incoming Webhooks** 입력 후 추가.
3. **Incoming Webhooks** 앱 설정에서 **Add to Slack** (또는 "Slack에 추가") 클릭.
4. **알림을 받을 채널** 선택 (예: #예약알림, #general) 후 **Incoming Webhook 추가**.
5. 생성된 **Webhook URL** 을 복사. (형식: `https://hooks.slack.com/services/TXXXXX/BXXXXX/XXXXX`)

---

## 2. 환경 변수 설정

- **로컬**: `.env`에 다음 한 줄 추가.
  ```
  SLACK_WEBHOOK_URL="여기에_복사한_Webhook_URL_붙여넣기"
  ```
- **Vercel**: Settings → Environment Variables에서 `SLACK_WEBHOOK_URL` 추가 (Production, Preview 등 원하는 환경).

---

## 3. 동작

- **설정한 경우**: 결제 확정 시 Slack 채널에 아래와 비슷한 메시지가 전송됩니다.
  ```
  💰 *결제 완료* 홍길동님이 *신주쿠 숙소* 예약 확정 (체크인 2026-03-15 ~ 2026-03-18)
  https://tokyominbak.net/host/bookings
  ```
- **미설정**: `SLACK_WEBHOOK_URL`이 없으면 Slack 전송은 건너뛰고, 결제·이메일·앱 내 알림은 그대로 동작합니다.

---

이렇게 설정하면 휴대폰에서도 Slack 앱 알림으로 결제 완료를 바로 확인할 수 있습니다.
