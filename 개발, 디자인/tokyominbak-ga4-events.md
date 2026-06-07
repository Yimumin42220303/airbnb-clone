# 도쿄민박 GA4 이벤트 추가 작업 지시서

## 목표

마케팅 유입(네이버 블로그·카페, 인스타그램, 메타 광고)이 추천 제출 → 상담 → 예약으로 이어지는 흐름을 GA4에서 추적할 수 있도록 이벤트를 추가한다.

---

## 절대 금지 사항

- 예약/결제/Beds24/webhook/cron 로직 수정 금지
- DB 마이그레이션 실행 금지
- 기존 이벤트 이름·파라미터 변경 금지 (GTM 연동 깨질 수 있음)
- ChannelTalk boot/shutdown/updateUser 로직 수정 금지

---

## 현재 상태 (코드 확인 완료)

### 이미 추적 중인 이벤트

| 이벤트 | 파일 | 상태 |
|---|---|---|
| `recommend_submit` | `RecommendPageContent.tsx` `handleSubmit` | ✅ 이미 있음 |
| `recommend_result_view` | `RecommendPageContent.tsx` useEffect | ✅ 이미 있음 |
| `booking_complete` (`purchase`) | `Ga4Purchase.tsx` → `BookingCompletePurchaseTracker.tsx` | ✅ 이미 있음 |
| `add_to_cart` (예약 CTA) | `booking-analytics.ts` `booking_cta_clicked` 분기 | ✅ 이미 있음 |

### 추가 또는 수정이 필요한 항목

| 요청 이벤트 | 현재 상태 | 작업 |
|---|---|---|
| `channel_talk_open` | recommend 퍼널 내부만 추적됨 (`recommend_channeltalk_open`) | 전역 채널톡 버튼 오픈 시 GA4 이벤트 추가 |
| `booking_request_start` | `add_to_cart`만 발송됨 | 별도 GA4 이벤트 추가 |
| `view_item` 파라미터 보강 | `listing_id`, `item_name`, `item_category`, `value`만 전송 | `area`, `max_guests` 추가 |

---

## 작업 1 — `channel_talk_open` GA4 이벤트 추가

**파일:** `src/components/channel/ChannelTalk.tsx`

현재 ChannelTalk 버튼은 `customLauncherSelector`로 SDK가 클릭을 직접 처리한다.
`ChannelIO("onShow", callback)` 콜백을 활용해 채팅창이 실제로 열릴 때 GA4 이벤트를 발송한다.

**추가할 코드:**
`boot` 호출 이후에 아래 콜백 등록을 추가한다.

```ts
window.ChannelIO!("onShow", () => {
  try {
    sendGa4Event("channel_talk_open", { source: "launcher" });
  } catch { /* ignore */ }
});
```

`sendGa4Event`를 import해야 한다:
```ts
import { sendGa4Event } from "@/lib/ga4-events";
```

단, `sendGa4Event`가 현재 `ga4-events.ts`에서 export되지 않으므로 함께 export 처리한다 (아래 작업 3 참고).

---

## 작업 2 — `booking_request_start` GA4 이벤트 추가

### 2-1. `ga4-events.ts`에 함수 추가

**파일:** `src/lib/ga4-events.ts`

기존 함수 뒤에 추가:

```ts
/** 예약 요청 시작 (예약 버튼 클릭) */
export function trackGa4BookingRequestStart(params: {
  listingId: string;
  bookingType?: string;
  value?: number;
  nights?: number;
}) {
  sendGa4Event("booking_request_start", {
    listing_id: params.listingId,
    ...(params.bookingType ? { booking_type: params.bookingType } : {}),
    ...(params.value != null && Number.isFinite(params.value) ? { value: params.value, currency: "JPY" } : {}),
    ...(params.nights != null ? { nights: params.nights } : {}),
  });
}
```

### 2-2. `booking-analytics.ts`에서 호출

**파일:** `src/lib/booking-analytics.ts`

`trackGa4AddToCart` import에 `trackGa4BookingRequestStart`를 추가하고,
`booking_cta_clicked` 분기 안에서 함께 호출한다:

```ts
import { trackGa4AddToCart, trackGa4BookingRequestStart } from "@/lib/ga4-events";

// booking_cta_clicked / mobile_sticky_cta_clicked 분기 안에 추가
if (
  name === "booking_cta_clicked" ||
  name === "mobile_sticky_cta_clicked"
) {
  trackGa4BookingRequestStart({
    listingId: params.listing_id,
    bookingType: params.booking_type,
    value: params.total_price,
    nights: params.nights,
  });
  // 기존 trackGa4AddToCart 호출은 그대로 유지
}
```

---

## 작업 3 — `view_item` 파라미터 보강 (`area`, `max_guests`)

### 3-1. `ga4-events.ts` 함수 시그니처 수정

**파일:** `src/lib/ga4-events.ts`

`trackGa4ViewItem` params에 `area`와 `maxGuests` 추가:

```ts
export function trackGa4ViewItem(params: {
  listingId: string;
  itemName: string;
  itemCategory?: string;
  value: number;
  area?: string;          // 추가
  maxGuests?: number;     // 추가
}) {
  if (!Number.isFinite(params.value) || params.value < 0) return;
  sendGa4Event("view_item", {
    currency: "JPY",
    value: params.value,
    ...(params.area ? { area: params.area } : {}),
    ...(params.maxGuests != null ? { max_guests: params.maxGuests } : {}),
    items: buildItems({
      item_id: params.listingId,
      item_name: params.itemName,
      item_category: params.itemCategory,
      price: params.value,
    }),
  });
}
```

### 3-2. `Ga4ViewContent.tsx` props 추가

**파일:** `src/components/analytics/Ga4ViewContent.tsx`

Props에 `area`와 `maxGuests` 추가 후 `trackGa4ViewItem` 호출 시 전달:

```ts
type Props = {
  listingId: string;
  itemName: string;
  itemCategory?: string;
  pricePerNight: number;
  totalPrice?: number | null;
  waitForTotalPrice?: boolean;
  area?: string;       // 추가
  maxGuests?: number;  // 추가
};
```

```ts
trackGa4ViewItem({
  listingId,
  itemName,
  itemCategory,
  value: totalPrice ?? pricePerNight,
  area,         // 추가
  maxGuests,    // 추가
});
```

### 3-3. `ListingDetailContent.tsx` 호출부 수정

**파일:** `src/app/listing/[id]/ListingDetailContent.tsx`

`<Ga4ViewContent>` 컴포넌트에 `area`와 `maxGuests` 전달:
- `area`는 `listing.location` (이미 있음)
- `maxGuests`는 `listing.maxGuests` (이미 있음)

```tsx
<Ga4ViewContent
  listingId={listing.id}
  itemName={listing.title}
  itemCategory={listing.location}
  pricePerNight={listing.pricePerNight}
  totalPrice={priceSummary?.totalPrice}
  waitForTotalPrice={!!(resolvedCheckIn && resolvedCheckOut)}
  area={listing.location}       // 추가
  maxGuests={listing.maxGuests} // 추가
/>
```

---

## 작업 4 — `sendGa4Event` export 처리

**파일:** `src/lib/ga4-events.ts`

작업 1에서 `ChannelTalk.tsx`가 직접 사용할 수 있도록 `sendGa4Event`를 export한다:

```ts
export function sendGa4Event(eventName: string, params: Record<string, unknown>) {
  // 기존 구현 그대로
}
```

(`function` 앞에 `export` 추가만 하면 됨)

---

## 최종 이벤트 정리

작업 완료 후 GA4에서 추적되는 이벤트:

| GA4 이벤트명 | 발생 시점 | 파일 |
|---|---|---|
| `page_view` | 페이지 로드 | 기존 |
| `view_item` | 숙소 상세 조회 | `Ga4ViewContent.tsx` |
| `view_item` 파라미터 | + `area`, `max_guests` | 이번 추가 |
| `recommend_submit` | 추천 조건 제출 | `RecommendPageContent.tsx` |
| `recommend_result_view` | 추천 결과 화면 조회 | `RecommendPageContent.tsx` |
| `channel_talk_open` | 채널톡 오픈 (전역) | `ChannelTalk.tsx` |
| `booking_request_start` | 예약 버튼 클릭 | `booking-analytics.ts` |
| `add_to_cart` | 예약 버튼 클릭 (기존 유지) | `booking-analytics.ts` |
| `begin_checkout` | 예약 확인 페이지 진입 | 기존 |
| `add_payment_info` | 결제 페이지 | 기존 |
| `purchase` (`booking_complete`) | 결제 완료 | `Ga4Purchase.tsx` |

---

## QA

```bash
npm run lint
npm run build
```

**로컬 확인:**
- 브라우저 콘솔에서 `[ga4]` 로그 확인 (개발 환경에서 자동 출력됨)
- 숙소 상세 진입 → `view_item` 로그에 `area`, `max_guests` 포함 여부
- 추천 폼 제출 → `recommend_submit` 로그 확인
- 추천 결과 노출 → `recommend_result_view` 로그 확인
- 채널톡 버튼 클릭 → `channel_talk_open` 로그 확인
- 예약 버튼 클릭 → `booking_request_start` + `add_to_cart` 동시 발송 확인
- 예약 완료 페이지 → `purchase` 로그 확인

**확인 항목:**
- 기존 이벤트(`add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`) 정상 발송 여부
- `channel_talk_open`이 recommend 퍼널 외부(메인, 숙소 상세 등)에서도 발송되는지
- TypeScript 에러 없는지

---

## 보고 형식

1. 수정 파일 목록
2. 변경 요약
3. 기존 이벤트 영향 없음 확인
4. lint/build 결과
5. 콘솔 로그 스크린샷 또는 텍스트 (이벤트별 파라미터 포함)
