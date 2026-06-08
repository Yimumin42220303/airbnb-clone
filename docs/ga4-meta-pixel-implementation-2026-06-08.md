# GA4 / Meta Pixel 측정 개선 구현 완료 보고서

**작업일**: 2026-06-08  
**대상 프로젝트**: tokyominbak.net

---

## 결론

6개 개선 작업 전부 완료. `npx tsc --noEmit` 오류 없음. 비즈니스 로직(예약, 결제, Beds24, webhook, cron, DB 스키마) 미변경.

---

## 변경 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/recommend-analytics.ts` | `window.gtag("event")` 추가, `cleanParams()` 추가 |
| `src/lib/ga4-events.ts` | `trackGa4BookingFormStart()` / `trackGa4BookingRequestSubmit()` 추가, `trackGa4ViewItem()` 에 `value_type:"nightly"` 추가 |
| `src/lib/meta-pixel.ts` | `trackMetaLead()` 추가 |
| `src/components/analytics/Ga4ViewContent.tsx` | value 소스를 항상 `pricePerNight`으로 고정, `waitForTotalPrice` 대기 로직 제거 |
| `src/components/listing/BookingForm.tsx` | `booking_form_start` / `booking_request_submit` 발화 추가 |
| `src/components/channel/ListingChannelInquiryButton.tsx` | `channel_talk_click` (GA4) + `Lead` (Meta Pixel) 발화 추가 |
| `src/app/api/payments/mock-verify/route.ts` | CAPI Purchase를 `META_CAPI_TEST_EVENT_CODE` 미설정 시 차단 |

---

## 작업별 상세

### 작업 1 — recommend 이벤트 GA4 도달 수정

**문제**: `window.dataLayer.push()` 만 호출 → GTM 미설치 환경에서 GA4 미도달.

**수정** (`recommend-analytics.ts`):
```ts
// 기존 유지
window.dataLayer.push({ event: name, ...clean });
// 추가
window.gtag("event", name, clean);
```
`cleanParams()` 헬퍼로 `undefined`/`null` 파라미터 사전 제거.

---

### 작업 2 — 예약 폼 이벤트 추가

**추가 이벤트**:

| 이벤트명 | 발화 시점 | 주요 파라미터 |
|----------|-----------|--------------|
| `booking_form_start` | 날짜/인원 버튼 첫 클릭 (컴포넌트당 1회) | listing_id, booking_type, check_in, check_out, guests |
| `booking_request_submit` | 유효성 검증 통과 후 `/booking/confirm` 이동 직전 | 위 + nights, value(총액), value_type="total" |

`formStartFiredRef` ref로 중복 발화 방지.

---

### 작업 3 — 채널톡 클릭 이벤트 추가

**추가 이벤트**:

| 이벤트 | 위치 | 파라미터 |
|--------|------|---------|
| GA4 `channel_talk_click` | `ListingChannelInquiryButton.tsx` | listing_id, listing_name, page_path, source_page, button_location |
| Meta Pixel `Lead` | 동일 | content_name, content_category="listing_inquiry" |

측정 오류가 채널톡 동작을 막지 않도록 각각 `try/catch` 격리.

---

### 작업 4 — mock 결제 이벤트 오염 방지

**수정** (`mock-verify/route.ts`):

```
META_CAPI_TEST_EVENT_CODE 미설정
→ CAPI Purchase 발화 안 함
→ 응답에 metaPurchaseEventId 없음
→ 클라이언트 sessionStorage stash 안 됨
→ GA4 purchase / Meta Pixel Purchase 미발화
```

테스트 시 `META_CAPI_TEST_EVENT_CODE` 설정하면 Meta 테스트 이벤트 도구로 격리된 환경에서만 발화.

---

### 작업 5 — CAPI Purchase 중복 리스크 분석 (코드 변경 없음)

**현황**: verify route + webhook route 모두 `createMetaPurchaseEventId(bookingId)` = `"purchase_${bookingId}"` 사용. 동일 event_id → Meta 서버측 중복 제거.

추가 DB 상태 체크: webhook은 `booking.paymentStatus !== "paid"` 확인 후 스킵.

**리스크 수준**: 낮음. 현재 완화책으로 충분. 장기적으로는 `capiPurchaseSentAt` DB 컬럼 추가 권고.

---

### 작업 6 — view_item value 기준 통일

**수정**: `Ga4ViewContent.tsx`에서 value 소스를 항상 `pricePerNight`으로 고정.

```
Before: totalPrice가 있으면 totalPrice, 없으면 pricePerNight (기준 혼재)
After:  항상 pricePerNight (value_type="nightly" 고정)
```

`begin_checkout` / `purchase` 는 기존대로 총 결제금액(value_type="total") 유지.

---

## 테스트 방법

1. **recommend 이벤트**: `/recommend` 퍼널 진행 → GA4 DebugView에서 `recommend_*` 이벤트 수신 확인
2. **예약 폼 이벤트**: 숙소 상세 → 날짜 또는 인원 버튼 클릭 → `booking_form_start` 확인. 예약 버튼 클릭 → `booking_request_submit` 확인
3. **채널톡 클릭**: 숙소 상세 채널톡 버튼 → GA4 `channel_talk_click` + Meta Events Manager `Lead` 확인
4. **mock 결제 오염 방지**: `NEXT_PUBLIC_ENABLE_MOCK_PAYMENT=1` + `META_CAPI_TEST_EVENT_CODE` 미설정 → 결제 완료 후 GA4/Meta purchase 이벤트 미발화 확인
5. **view_item value**: 숙소 상세 진입 → GA4 DebugView `view_item.value` = 1박 요금 확인

---

## 미해결 / 향후 과제

- `add_to_cart` / `booking_request_start` 이벤트: `booking_form_start` / `booking_request_submit`와 중복 가능성. 퍼널 데이터 안정화 후 정리 검토
- CAPI Purchase `capiPurchaseSentAt` DB 컬럼: 이중 발화 완전 방지용 (현재는 Meta event_id dedup으로 충분)
- GTM 도입 여부: 현재 gtag.js 직접 주입 방식 유지. GTM 도입 시 `dataLayer.push()` 경로가 자동 활성화됨
