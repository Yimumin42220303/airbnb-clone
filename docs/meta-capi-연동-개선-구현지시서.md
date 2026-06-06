# Meta CAPI 연동 개선 구현 지시서

## 배경 및 목적

현재 Meta Pixel(브라우저)과 CAPI(서버)의 연동 상태는 아래와 같다.

| 이벤트 | 브라우저 Pixel | CAPI (서버) |
|--------|:---:|:---:|
| PageView | ✅ | ❌ |
| ViewContent | ✅ | ❌ |
| Search | ❌ | ❌ |
| AddToWishlist | ❌ | ❌ |
| Schedule (예약생성) | ✅ | ❌ |
| InitiateCheckout | ✅ | ❌ |
| Purchase | ✅ | ✅ |
| Lead (추천펀넬 완료) | ❌ | ❌ |

또한 Purchase CAPI에 `em`, `ph`만 전송 중이며 `fbc`, `fbp` 쿠키와 `fn`, `ln`, `country` 등의 Advanced Matching 필드가 누락되어 EMQ(이벤트 매칭 품질)가 낮다.

목표: **퍼널 전체에 CAPI 미러링 + Advanced Matching 강화**로 Meta 알고리즘의 어트리뷰션 정확도를 높이고 광고 효율을 극대화한다.

---

## 기존 구현 파악 (수정 전 반드시 읽을 것)

- `src/lib/meta-pixel.ts` — 브라우저 Pixel 이벤트 헬퍼
- `src/lib/meta-capi.ts` — CAPI Purchase 전송 로직 (Graph API 호출, 재시도 포함)
- `src/lib/meta-purchase.ts` — Purchase 전체 파이프라인 (eventId 생성, stash, trigger)
- `src/lib/meta-user-data.ts` — 전화번호 정규화·해싱
- `src/lib/meta-payload-validator.ts` — 페이로드 검증 유틸
- `src/app/api/payments/verify/route.ts` — Purchase CAPI 발화 지점 (기존 패턴 참고)
- `src/components/analytics/MetaPixelPurchase.tsx` — 브라우저 Pixel Purchase 컴포넌트 (기존 패턴 참고)

---

## 구현 작업 목록

아래 작업을 **우선순위 순서대로** 구현한다.

---

### 작업 1. `fbc` / `fbp` 쿠키 수집 유틸 추가 (우선순위: 즉시)

**파일**: `src/lib/meta-user-data.ts`

`fbc`와 `fbp`는 Meta Pixel이 브라우저 쿠키에 심는 값이다. CAPI 전송 시 포함하면 EMQ가 크게 향상된다. **해싱하지 않고 평문으로 전달**한다.

```typescript
// Request 객체에서 fbc, fbp 쿠키를 추출하는 함수 추가
export function extractMetaCookies(request: Request): {
  fbc: string | undefined;
  fbp: string | undefined;
} {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=')];
    })
  );
  return {
    fbc: cookies['_fbc'] || undefined,
    fbp: cookies['_fbp'] || undefined,
  };
}
```

---

### 작업 2. Advanced Matching 필드 보강 (우선순위: 즉시)

**파일**: `src/lib/meta-capi.ts`

`MetaCapiPurchaseInput` 타입과 `buildMetaCapiPurchasePayload` 함수를 확장하여 아래 필드를 추가한다.

추가할 입력 필드:
```typescript
userFirstName?: string | null;
userLastName?: string | null;
fbc?: string | null;   // 평문 전달
fbp?: string | null;   // 평문 전달
```

`user_data` 빌드 로직 추가:
```typescript
if (input.userFirstName?.trim()) {
  userData.fn = [hashSha256(input.userFirstName.trim().toLowerCase())];
}
if (input.userLastName?.trim()) {
  userData.ln = [hashSha256(input.userLastName.trim().toLowerCase())];
}
// 서비스 특성상 한국 게스트 고정
userData.country = [hashSha256('kr')];

// fbc, fbp는 해싱 없이 평문 전달
if (input.fbc) userData.fbc = input.fbc;
if (input.fbp) userData.fbp = input.fbp;
```

**파일**: `src/app/api/payments/verify/route.ts`

`triggerMetaPurchaseConversionAsync` 호출부에 새 필드를 전달하도록 수정한다.

```typescript
// booking include에 user name 필드 추가
include: { user: { select: { email: true, phone: true, name: true } } }

// fbc, fbp 쿠키 추출 후 전달
const { fbc, fbp } = extractMetaCookies(request);
const metaPurchase = await triggerMetaPurchaseConversionAsync({
  ...기존파라미터,
  userFirstName: ...,  // booking.user.name에서 파싱 또는 booking.guestName 사용
  fbc,
  fbp,
});
```

`src/lib/meta-purchase.ts`의 `MetaPurchaseTriggerInput` 타입과 `sendMetaPurchaseCapi` 함수도 동일하게 새 필드를 전달하도록 수정한다.

---

### 작업 3. CAPI 공통 헬퍼 확장 (우선순위: 즉시)

**파일**: `src/lib/meta-capi.ts`

Purchase 전용으로만 쓰이던 CAPI 전송 로직을 다른 이벤트(ViewContent, InitiateCheckout, Schedule)에도 재사용할 수 있도록 범용 함수를 추가한다.

```typescript
export type MetaCapiEventInput = {
  eventName: 'ViewContent' | 'InitiateCheckout' | 'Schedule' | 'Lead' | 'Search';
  eventId: string;
  eventSourceUrl: string;
  contentIds?: string[];
  value?: number;
  currency?: string;
  customData?: Record<string, unknown>;
  clientIpAddress?: string;
  clientUserAgent?: string;
  userEmail?: string | null;
  userPhone?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  fbc?: string | null;
  fbp?: string | null;
};

export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<void>
```

내부 구현은 기존 `sendMetaPurchaseEvent`와 동일한 패턴(Graph API 호출, 토큰 없으면 skip, ops 로깅)을 따른다.

---

### 작업 4. ViewContent CAPI 미러링 (우선순위: 즉시)

**파일**: `src/app/api/listings/[id]/view/route.ts` (새 파일)

숙소 상세 페이지 진입 시 CAPI ViewContent를 전송할 API route를 생성한다.

```
POST /api/listings/[id]/view
Body: { eventId: string }
```

- `eventId`는 클라이언트에서 `crypto.randomUUID()`로 생성하여 전달
- 브라우저 Pixel의 `ViewContent` eventID와 동일한 값을 사용해 중복 제거
- `fbc`, `fbp` 쿠키를 서버에서 직접 읽어 CAPI에 포함
- 세션에서 유저 정보 조회 후 `userEmail`, `userPhone` 포함
- `sendMetaCapiEvent` 호출 (작업 3에서 만든 범용 함수 사용)

**파일**: `src/app/listing/[id]/ListingDetailContent.tsx`

컴포넌트 마운트 시 위 API를 호출하도록 수정한다. 기존 `trackMetaViewContent` 호출과 동일한 `eventId`를 생성하여 Pixel과 CAPI 양쪽에 동일 ID를 전달한다.

---

### 작업 5. InitiateCheckout CAPI 미러링 (우선순위: 즉시)

**파일**: `src/app/api/capi/initiate-checkout/route.ts` (새 파일)

```
POST /api/capi/initiate-checkout
Body: { eventId: string; bookingId: string; value: number }
```

- bookingId로 listing 정보를 조회하여 `contentIds` 구성
- `fbc`, `fbp` 쿠키 포함
- `sendMetaCapiEvent({ eventName: 'InitiateCheckout', ... })` 호출

**파일**: `src/app/booking/[id]/pay/BookingPayContent.tsx`

결제 페이지 진입(useEffect) 시 위 API를 호출하도록 수정. 기존 `trackMetaInitiateCheckout` 호출과 동일한 `eventId` 사용.

---

### 작업 6. Schedule CAPI 미러링 (우선순위: 단기)

**파일**: `src/app/api/bookings/route.ts`

`POST /api/bookings` 성공 직후(예약 생성 완료 후) CAPI Schedule 이벤트를 fire-and-forget으로 발화한다.

```typescript
// 예약 생성 성공 후
void sendMetaCapiEvent({
  eventName: 'Schedule',
  eventId: `schedule_${booking.id}`,
  eventSourceUrl: `${BASE_URL}/listing/${booking.listingId}`,
  contentIds: [booking.listingId],
  value: booking.totalPrice,
  currency: 'JPY',
  clientIpAddress: getClientIp(request),
  clientUserAgent: request.headers.get('user-agent') ?? undefined,
  userEmail: session.user.email,
  fbc, fbp,
}).catch(err => console.error('[capi] Schedule failed:', err));
```

---

### 작업 7. Lead 이벤트 — 추천 펀넬 완료 시 (우선순위: 단기)

**파일**: `src/app/api/capi/lead/route.ts` (새 파일)

```
POST /api/capi/lead
Body: { eventId: string; source: 'recommend' | 'signup' }
```

**파일**: `src/app/recommend/` (추천 완료 컴포넌트)

추천 결과가 렌더링되는 마지막 스텝에서 위 API를 호출한다.

---

### 작업 8. Commerce Catalog availability 실시간 반영 (우선순위: 단기)

**파일**: `src/app/api/cron/meta-catalog-build/route.ts`

현재 Catalog feed에 availability 필드가 누락되어 있거나 정적인 경우, 아래를 적용한다.

- Beds24 가격 동기화(6AM)와 Catalog 재빌드(7AM) 순서가 이미 맞으므로 타이밍은 유지
- 각 숙소의 향후 30일 내 예약 가능 날짜가 0일이면 `availability: "out of stock"`으로 설정
- `price` 필드가 DB의 최신 가격과 일치하는지 검증 로직 추가

---

## 공통 구현 규칙

1. **이벤트 중복 제거**: 브라우저 Pixel과 CAPI에 반드시 동일한 `eventId`를 전달한다. Meta가 서버·브라우저 양쪽에서 같은 이벤트를 받으면 `eventId`를 기준으로 중복을 자동 제거한다.

2. **fire-and-forget**: ViewContent, InitiateCheckout, Schedule은 CAPI 전송 실패가 사용자 UX에 영향을 주어선 안 된다. API route 응답을 기다리지 않거나, try/catch로 감싸서 에러를 삼킨다.

3. **토큰 미설정 시 skip**: 기존 `sendMetaPurchaseEvent`와 동일하게 `META_CAPI_ACCESS_TOKEN` 미설정 시 조용히 skip한다.

4. **로깅**: 기존 `logMetaCapiOps` 패턴을 재사용하여 success/failed/skipped를 기록한다.

5. **해싱 규칙**:
   - `em`, `fn`, `ln`, `ph`, `country`: SHA256 해싱 후 전달
   - `fbc`, `fbp`: **해싱 없이 평문** 전달
   - 해싱 함수는 기존 `hashMetaUserData`를 재사용한다

6. **currency**: 서비스 특성상 `JPY` 고정. 기존 구현과 동일.

7. **eslint/타입 검사**: 구현 후 `npm run check`로 빌드 오류 없는지 확인한다.

---

## 검증 방법

구현 완료 후 아래 순서로 검증한다.

1. **Meta Events Manager > Test Events 탭** 에서 `META_CAPI_TEST_EVENT_CODE` 설정 후 각 이벤트 수신 확인
2. 각 이벤트의 **EMQ(이벤트 매칭 품질) 점수** 확인 — 목표: Purchase 8점 이상, 나머지 6점 이상
3. `fbc`/`fbp` 포함 여부: Events Manager에서 이벤트 상세 > user_data 항목 확인
4. 중복 이벤트 없음 확인: 동일 `eventId`로 브라우저·서버 양쪽 발화 시 Events Manager에서 1건으로 집계되는지 확인
