# PWA + 웹 푸시 구현 순서 (호스트 결제 알림)

아이폰(및 안드로이드)에서 **홈 화면에 추가**한 뒤 **푸시 알림**을 받으려면 아래 순서로 진행하면 됩니다.  
(iOS 16.4+ 에서 웹 푸시 지원)

---

## 사용 방법 (4단계)

1. **VAPID 키**
   - 터미널에서 `npm run push:vapid-keys` 실행.
   - 출력된 값을 `.env`에 `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 로 설정.

2. **마이그레이션**
   - 아직 적용하지 않았다면 `npm run db:migrate` 실행.

3. **호스트**
   - 로그인 후 **알림** 페이지로 이동.
   - **푸시 알림 켜기** 버튼 클릭.
   - **iOS**: Safari에서 **홈 화면에 추가**한 뒤 알림을 허용해야 합니다.

4. **테스트**
   - 해당 호스트 숙소로 게스트가 결제를 완료하면, 호스트 기기에서 푸시 알림 수신 여부를 확인.

자세한 순서와 주의사항은 아래 본문을 참고하면 됩니다.

---

## 구현 완료 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| Manifest | ✅ | `public/manifest.json`, layout `metadata.manifest` |
| PWA 아이콘 | ✅ | `public/icon.png` 192/512 참조 |
| VAPID | ✅ | `.env.example` 주석. `npm run push:vapid-keys`로 발급 |
| 서비스 워커 | ✅ | `public/sw.js` (push, notificationclick) |
| DB | ✅ | `PushSubscription` 모델 + 마이그레이션 `20260308000000_add_push_subscription` |
| 구독 API | ✅ | `POST /api/push/subscribe` |
| 클라이언트 | ✅ | `PushSubscribeBlock` → 알림 페이지 상단 |
| 서버 푸시 | ✅ | `src/lib/web-push.ts` → `sendPushToUser()` |
| 결제 완료 푸시 | ✅ | `onPaymentVerified`에서 호스트에게 발송 |

**운영 전 할 일**: (1) `npm run push:vapid-keys`로 VAPID 키 발급 후 `.env`에 `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 설정. (2) DB 마이그레이션 미적용 시 로컬에서 `npm run db:migrate` 실행 후 배포.

---

## 전체 흐름 요약

1. **Manifest** → “홈에 추가” 시 앱처럼 보이게 + 설치 가능
2. **서비스 워커** → 백그라운드에서 푸시 수신
3. **VAPID 키** → 푸시 구독/발송용 인증
4. **DB에 구독 저장** → 사용자별 푸시 구독 정보 저장
5. **클라이언트: 권한 요청 + 구독** → 알림 허용 후 구독 객체를 서버로 전송
6. **서버: 푸시 발송** → 결제 완료 등 이벤트 시 `web-push`로 발송

---

## 1단계: Web App Manifest

**목적**: 브라우저/OS가 “앱으로 설치”할 수 있게 하고, 홈 화면 아이콘·이름·테마 색을 정함.

- **파일**: `public/manifest.json` (또는 `manifest.webmanifest`)
- **내용 예시**:
  - `name`, `short_name`: "도쿄민박"
  - `start_url`: `/` (또는 `/host` 등)
  - `display`: `standalone` (주소창 없이 앱처럼)
  - `icons`: 192x192, 512x512 (필수). 현재 `public/icon.png`가 있으면 192/512 버전 추가 또는 동일 파일을 배열로 등록
  - `theme_color`, `background_color`: 기존 `layout.tsx`의 themeColor와 맞추기
- **연결**: `layout.tsx`의 `<head>`에  
  `<link rel="manifest" href="/manifest.json" />`  
  (Next.js 14에서는 `metadata`에 `manifest: "/manifest.json"` 추가 가능하면 추가)

**확인**: Chrome 개발자도구 → Application → Manifest에서 오류 없이 로드되는지 확인.

---

## 2단계: 아이콘 (PWA용)

- **필요 크기**: 192x192, 512x512 (PNG 권장).  
  이미지가 없으면 `public/icon.png`를 192/512로 리사이즈한 파일을 두거나, manifest에서 같은 URL을 두 크기로 지정할 수 있으면 지정.
- **경로**: 예) `public/icons/icon-192.png`, `public/icons/icon-512.png`  
  manifest의 `icons[]`에서 해당 경로 참조.

---

## 3단계: VAPID 키 생성 및 환경 변수

**목적**: 웹 푸시는 VAPID 키로 “이 서버가 보내는 푸시”임을 증명합니다.

- **생성** (한 번만):
  ```bash
  npx web-push generate-vapid-keys
  ```
  또는 Node 스크립트에서 `web-push`의 `generateVAPIDKeys()` 호출.
- **저장**:
  - **Public Key**: 클라이언트에서 푸시 구독 시 사용 → `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (또는 API로 내려줘도 됨)
  - **Private Key**: 서버에서 푸시 발송 시 사용 → `VAPID_PRIVATE_KEY` (`.env`에만, Git 제외)
- **문서**: `.env.example`에 `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` 예시(값 비움) 추가.

---

## 4단계: 서비스 워커 (푸시 수신)

**목적**: 브라우저가 백그라운드에서 푸시 이벤트를 받아 알림을 띄움.

- **파일**: `public/sw.js` (또는 `public/static/sw.js` 등 Next가 그대로 서빙하는 경로).
- **내용** (최소):
  - `self.addEventListener('push', (e) => { ... })` → `e.data.json()`으로 제목/본문 파싱 후 `self.registration.showNotification(title, options)` 호출.
  - `self.addEventListener('notificationclick', ...)` → 알림 클릭 시 `clients.openWindow(url)` 로 사이트 열기.
- **등록**: 클라이언트(예: 호스트 레이아웃 또는 전역 푸시 설정 페이지)에서:
  - `navigator.serviceWorker.register('/sw.js')`
  - 지원 여부: `'serviceWorker' in navigator`, `'PushManager' in window` 체크.

**주의**: Next.js는 `public/`을 그대로 서빙하므로 `public/sw.js`면 `https://도메인/sw.js`로 접근 가능해야 함.  
Next가 빌드 시 sw를 수정하지 않도록 해당 파일은 제외되는지 확인.

---

## 5단계: DB — 푸시 구독 저장

**목적**: 사용자(호스트)별로 “어떤 브라우저/기기로 푸시 보낼지” 저장.

- **모델 추가** (Prisma 예시):
  ```prisma
  model PushSubscription {
    id        String   @id @default(cuid())
    userId    String
    endpoint  String   // PushSubscription.endpoint (unique per device)
    p256dh    String   // 키 (암호화용)
    auth      String   // 키 (암호화용)
    userAgent String?  // 선택: 기기 구분
    createdAt DateTime @default(now())

    user User @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@unique([userId, endpoint]) // 같은 기기 중복 방지
    @@index([userId])
  }
  ```
- **User 모델**에 `pushSubscriptions PushSubscription[]` 관계 추가.
- 마이그레이션: `npm run db:migrate` (이름 예: `add_push_subscription`).

---

## 6단계: API — 구독 등록

**목적**: 클라이언트가 “알림 허용” 후 받은 구독 객체를 서버에 보냄.

- **엔드포인트**: `POST /api/push/subscribe` (또는 `/api/notifications/push-subscribe`).
- **인증**: 세션 필수 (호스트만 허용할지, 게스트도 할지 정책에 따라).
- **Body**: `{ endpoint, keys: { p256dh, auth } }` (PushSubscription의 endpoint와 keys).
- **로직**: 세션의 `userId`로 위 모델에 `upsert` (같은 endpoint면 갱신, 없으면 생성).  
  기기별로 endpoint가 다르므로 한 사용자가 여러 행을 가질 수 있음.

---

## 7단계: 클라이언트 — 권한 요청 + 구독

**목적**: 호스트가 “푸시 켜기”를 한 번 하면, 이후 결제 완료 시 해당 기기로 푸시가 감.

- **위치**: 호스트 전용 레이아웃 또는 “설정” 페이지. 예: `/host` 레이아웃 또는 `/mypage`에 “푸시 알림 설정” 버튼.
- **순서**:
  1. `Notification.requestPermission()` → `granted`일 때만 다음 단계.
  2. `navigator.serviceWorker.ready` → 등록된 SW의 `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })` 호출.
  3. 구독 객체를 `POST /api/push/subscribe`로 전송 (endpoint, keys.p256dh, keys.auth).
- **저장**: 서버가 200이면 “푸시 알림이 켜졌습니다” 등 안내.  
  이미 허용된 경우에는 페이지 로드 시 한 번 구독 시도 후 서버에 보내도 됨.

**iOS**: Safari에서 “홈 화면에 추가”한 뒤에만 푸시 가능. 데스크톱/안드로이드 Chrome 등에서는 일반 탭에서도 가능한 경우 있음.

---

## 8단계: 서버 — 푸시 발송 유틸

**목적**: 결제 완료 등 이벤트 시 “해당 호스트의 모든 구독”에 푸시 전송.

- **패키지**: `web-push` (npm install web-push).
- **유틸 함수** (예: `src/lib/web-push.ts`):
  - `sendPushToUser(userId: string, payload: { title: string; body?: string; url?: string })`
  - 내부: DB에서 해당 `userId`의 모든 `PushSubscription` 조회.
  - 각 구독에 대해 `webpush.sendNotification(subscription, JSON.stringify(payload), { vapidKeys: { publicKey, privateKey } })` 호출.
  - 410 Gone / 404면 해당 구독은 삭제 (만료된 구독 정리).
- **환경 변수**: `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (또는 서버만 쓰면 private만).

---

## 9단계: 결제 완료 시 호스트에게 푸시

**목적**: 게스트 결제 완료 → 해당 예약의 호스트에게 푸시.

- **위치**: `onPaymentVerified(bookingId)` 내부 (이미 호스트 이메일·앱 내 알림 보내는 곳).
- **로직**:
  - `fullBooking.listing.userId` (호스트 ID) 획득.
  - `sendPushToUser(hostUserId, { title: "결제 완료", body: "○○님이 결제를 완료했어요. 예약이 확정되었습니다.", url: "/host/bookings" })` 호출.
- **실패 처리**: 푸시 실패해도 이메일·앱 내 알림·결제 처리에는 영향 없도록 try/catch로 감싼다.

---

## 10단계: 테스트 및 안내

- **테스트**:
  - 호스트 계정으로 로그인 → (필요 시) 홈 화면에 추가 → 푸시 권한 허용 → 구독 등록 확인.
  - 해당 호스트의 숙소로 게스트가 결제 완료 → 호스트 기기에서 푸시 수신 여부 확인.
- **사용자 안내**:  
  “아이폰에서 푸시를 받으려면 Safari로 도쿄민박을 열고, 공유 → ‘홈 화면에 추가’ 후 알림을 허용해 주세요.” 같은 문구를 도움말 또는 호스트 설정에 추가.

---

## 체크리스트 요약

| 순서 | 항목 | 산출물 |
|------|------|--------|
| 1 | Web App Manifest | `public/manifest.json`, layout에 링크 |
| 2 | PWA 아이콘 192/512 | `public/icons/` 또는 기존 아이콘 활용 |
| 3 | VAPID 키 생성·env | `.env`, `.env.example` |
| 4 | 서비스 워커 | `public/sw.js` (push + notificationclick) |
| 5 | DB 푸시 구독 테이블 | Prisma 모델 + 마이그레이션 |
| 6 | 구독 등록 API | `POST /api/push/subscribe` |
| 7 | 클라이언트 구독 UI | 호스트 설정/레이아웃에서 권한 요청 + subscribe 후 API 호출 |
| 8 | 서버 푸시 유틸 | `web-push` + `sendPushToUser()` |
| 9 | 결제 완료 시 푸시 | `onPaymentVerified` 내부에서 호스트에게 발송 |
| 10 | 테스트·안내 문구 | 도움말/설정 페이지 |

이 순서대로 구현하면 PWA로 “홈에 추가” 후 아이폰에서도 결제 완료 푸시를 받을 수 있습니다.
