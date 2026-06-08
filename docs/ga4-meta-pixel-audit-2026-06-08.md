# 도쿄민박 GA4 / Meta Pixel 측정 현황 점검 보고서

**작성일:** 2026-06-08  
**대상:** PM  
**목적:** 광고 성과 판단 및 전환 퍼널 분석을 위한 현황 파악 및 개선 제안  
**범위:** GA4, Meta Pixel, Meta CAPI, GTM 여부 코드 기준 점검 (코드 수정 없음)

---

## 한 줄 결론

GA4는 gtag.js 직접 삽입 방식으로 구현되어 있으며, 전자상거래 핵심 이벤트(view_item · add_to_cart · begin_checkout · purchase)는 수동 발화로 잘 구성되어 있다.  
그러나 **form_start / form_submit은 어떤 폼인지 구분이 불가능**하고, **추천 AI(recommend) 이벤트 18종은 GTM 없이는 GA4에 도달하지 않는 구조적 결함**이 있다.

---

## 1. 기술 구성 개요

| 항목 | 내용 |
|---|---|
| GA4 삽입 방식 | gtag.js 직접 삽입 (`<script>` 태그, GTM 미사용) |
| GA4 Measurement ID 환경변수 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| GA4 ID 폴백 | 환경변수 미설정 시 코드 내 하드코딩 ID로 자동 폴백 |
| Meta Pixel 삽입 방식 | `<head>` 동기 스크립트 (fbq 스텁) + 별도 PageView 컴포넌트 |
| Meta Pixel ID 환경변수 | `NEXT_PUBLIC_META_PIXEL_ID` |
| Meta Pixel ID 폴백 | 환경변수 미설정 시 코드 내 하드코딩 ID로 자동 폴백 |
| Meta CAPI | 서버 사이드 구현 (`META_CAPI_ACCESS_TOKEN` 환경변수) |
| GTM | **미사용** |
| production / staging 구분 | 환경변수로 구분 가능하나, 미설정 시 양 환경 모두 동일 ID 사용 |

---

## 2. 이벤트별 현황 요약

### GA4

| 이벤트 | 발화 위치 | 실제 의미 | 주요 파라미터 | 신뢰도 |
|---|---|---|---|---|
| `page_view` | GoogleAnalyticsScript (초기) + GoogleAnalyticsPageView (SPA 라우팅) | 페이지 조회 | page_path | 중간 |
| `view_item` | Ga4ViewContent.tsx → 숙소 상세 페이지 마운트 시 | 숙소 상세 조회 | currency=JPY, value, item_id, item_name, area, max_guests | 중간 |
| `add_to_cart` | booking-analytics.ts → 예약 CTA 버튼 클릭 시 | 날짜·요금 확인 후 "예약하기" 클릭 | currency=JPY, value, booking_type, nights, items[] | 중간 |
| `begin_checkout` | BookingConfirmContent.tsx → /booking/confirm 진입 시 | 예약 확인 화면 진입 (결제 직전) | currency=JPY, value, nights, items[] | 높음 |
| `add_payment_info` | BookingPayContent.tsx → /booking/[id]/pay 진입 시 | 결제 페이지 진입 | currency=JPY, value, booking_id, items[] | 높음 |
| `purchase` | Ga4Purchase.tsx → /booking/complete 진입 시 (sessionStorage 기반) | 결제 완료 | transaction_id=bookingId, currency=JPY, value, items[] | 중간 |
| `booking_request_start` | booking-analytics.ts → add_to_cart와 동시 발화 | 예약 버튼 클릭 (add_to_cart와 의미 중복) | listing_id, booking_type, value, nights | — |
| `form_start` | **코드 없음 — Enhanced Measurement 자동 수집 추정** | **불명확** (예약·추천·로그인 폼 전체 합산) | 자동 | **낮음** |
| `form_submit` | **코드 없음 — Enhanced Measurement 자동 수집 추정** | **불명확** (전체 폼 합산) | 자동 | **낮음** |
| `scroll` | Enhanced Measurement 자동 | 페이지 90% 스크롤 도달 | 자동 | 높음 |
| `user_engagement` | GA4 자동 | 10초 이상 체류 등 | 자동 | 높음 |
| `recommend_*` (18종) | recommend-analytics.ts → dataLayer.push만 | 추천 AI 퍼널 각 단계 | travel_type, guest_count, listing_id 등 | **미도달** |

### Meta Pixel / CAPI

| 이벤트 | 발화 방식 | 발화 조건 | deduplication |
|---|---|---|---|
| `PageView` | 브라우저 Pixel | 모든 라우팅 변경 시 | 없음 |
| `ViewContent` | 브라우저 Pixel + CAPI (서버) | /listing/[id] 진입 시 | eventId로 중복 제거 |
| `InitiateCheckout` | 브라우저 Pixel | /booking/[id]/pay 진입 시 | eventId 선택적 적용 |
| `Schedule` | 브라우저 Pixel | 예약 생성 성공 시 | 없음 |
| `Purchase` | 브라우저 Pixel + CAPI (서버) | 결제 완료 시 | `purchase_{bookingId}`로 중복 제거 |

---

## 3. 발견된 리스크

### 🔴 높음

**[리스크 1] recommend 이벤트 18종 GA4 미도달**  
`recommend-analytics.ts`의 `trackRecommendEvent()`는 `window.dataLayer.push()`만 호출한다. GTM이 없는 환경에서는 dataLayer에 쌓인 이벤트가 GA4로 전달되지 않는다. GA4에서 recommend 관련 이벤트가 전혀 보이지 않는 것이 정상 증상이다.

**[리스크 2] form_start / form_submit 의미 불명확**  
코드 어디에도 GA4 `form_start` · `form_submit`을 수동으로 발화하는 코드가 없다. GA4 Enhanced Measurement가 자동으로 감지하는 것으로 추정된다. 예약 폼 · 로그인 폼 · 추천 AI 폼 · 검색 폼이 모두 합산되어 어떤 폼인지 구분이 불가능하다. 또한 form_start보다 form_submit 수가 많아질 수 있는 구조다.

### 🟡 중간

**[리스크 3] CAPI Purchase 중복 발화 가능성**  
`/api/payments/verify`와 `/api/webhooks/portone` 양쪽에서 CAPI Purchase가 호출된다. 정상 흐름에서는 verify가 먼저 실행되지만, 네트워크 상황에 따라 동시에 실행될 경우 2회 발화될 수 있다. eventId=`purchase_{bookingId}`로 결정적 생성되어 Meta 서버의 deduplication이 작동할 수 있으나, Meta deduplication은 1시간 window 내에서만 보장된다.

**[리스크 4] mock 결제 시 실제 이벤트 오염 가능성**  
`NEXT_PUBLIC_ENABLE_MOCK_PAYMENT=1` 환경(staging)에서 `/api/payments/mock-verify`도 CAPI Purchase를 발화한다. `META_CAPI_TEST_EVENT_CODE`가 설정되어 있으면 Meta 테스트 모드로 격리되지만, 미설정이면 실제 전환 데이터에 포함된다. GA4 purchase도 동일하게 오염된다.

**[리스크 5] GA4 purchase sessionStorage 유실 가능성**  
결제 완료 후 `/booking/complete`로 리다이렉트 전에 탭이 닫히거나 private 브라우저를 사용하면 sessionStorage가 유실되어 GA4 purchase가 발화되지 않는다. Meta CAPI는 서버에서 발화되므로 영향 없지만, GA4와 CAPI 수치 불일치의 원인이 된다.

**[리스크 6] view_item value 기준 불일치**  
날짜 미선택 시 value=1박 요금, 날짜 선택 시 value=총 요금이 사용된다. 동일 이벤트 내 value 기준이 달라 GA4 수익 분석 시 오해가 생길 수 있다.

### 🟢 낮음

**[리스크 7] GA / Pixel ID 하드코딩 폴백**  
환경변수 미설정 시 코드 내 하드코딩 ID로 폴백된다. staging · dev 환경에서 환경변수를 다르게 설정하지 않으면 production 데이터에 혼입된다.

---

## 4. 데이터 신뢰도 평가

| 이벤트 | 신뢰도 | 판단 근거 |
|---|---|---|
| page_view | 중간 | SPA 라우팅 처리 완료. Enhanced Measurement 자동 page_view와 초기 1회 중복 가능 |
| view_item | 중간 | listingId 중복방지 완료. value 기준 혼재 |
| form_start | **낮음** | Enhanced Measurement 자동 수집 추정. 폼 종류 구분 불가 |
| form_submit | **낮음** | 동일. form_start보다 count가 많을 수 있는 구조 |
| begin_checkout | 높음 | 단일 진입점, firedRef 중복방지, 파라미터 완비 |
| purchase / revenue | 중간 | transaction_id 중복방지 구조 양호. sessionStorage 유실 · mock 오염 리스크 존재 |

---

## 5. 개선 제안 — 권장 이벤트 퍼널 재정의

### 추가 구현이 필요한 이벤트

| 권장 이벤트 | 현재 상태 | 의미 | 수정 파일 |
|---|---|---|---|
| `booking_form_start` | 없음 (Enhanced Measurement 자동으로만 수집) | 예약 폼 입력 시작 | BookingForm.tsx |
| `recommend_start` | dataLayer만 (GA4 미도달) | 추천 AI 퍼널 시작 | recommend-analytics.ts |
| `recommend_submit` | dataLayer만 | 추천 요청 제출 | recommend-analytics.ts |
| `recommend_listing_click` | dataLayer만 | 추천 결과 숙소 클릭 | recommend-analytics.ts |
| `channel_talk_click` | 없음 | 채널톡 상담 클릭 | ListingChannelInquiryButton.tsx |
| `generate_lead` | 없음 | 추천 폼 제출 (GA4 표준 Lead 이벤트 병기) | recommend-analytics.ts |

### 현재 이벤트 개선 사항

| 이벤트 | 현재 문제 | 개선 방향 |
|---|---|---|
| `form_start` / `form_submit` | 전체 폼 합산, 구분 불가 | 예약 폼에 `booking_form_start` 수동 발화 추가, Enhanced Measurement form tracking 비활성화 검토 |
| `view_item` | value 기준 혼재 | 날짜 선택 여부와 무관하게 1박 요금 또는 totalPrice로 기준 통일 |
| `purchase` | sessionStorage 기반 유실 가능 | 서버 사이드 GA4 Measurement Protocol 병행 검토 |
| CAPI Purchase 중복 | verify + webhook 양쪽 발화 | webhook 경로에서 CAPI 제거 또는 DB paid 플래그로 1회만 발화 보장 |
| mock 결제 오염 | TEST_EVENT_CODE 미설정 시 실 데이터 오염 | mock-verify에서 CAPI/GA4 발화 비활성화 또는 TEST_EVENT_CODE 강제 적용 |

---

## 6. 수정 필요 파일 목록

| 파일 | 수정 이유 | 우선순위 |
|---|---|---|
| `src/lib/recommend-analytics.ts` | `dataLayer.push` → `sendGa4Event` 병행 호출로 GA4 도달 처리 | 🔴 높음 |
| `src/components/listing/BookingForm.tsx` | `booking_form_start` 수동 이벤트 추가 | 🔴 높음 |
| `src/components/channel/ListingChannelInquiryButton.tsx` | 채널톡 클릭 시 GA4/Meta `channel_talk_click` 추가 | 🟡 중간 |
| `src/app/api/webhooks/portone/route.ts` | CAPI Purchase 중복 발화 방지 로직 보강 | 🟡 중간 |
| `src/app/api/payments/mock-verify/route.ts` | 테스트 결제 시 이벤트 오염 방지 | 🟡 중간 |
| `src/lib/ga4-events.ts` | `view_item` value 기준 통일 | 🟢 낮음 |
| `src/lib/google-analytics.ts` | 하드코딩 폴백 ID 제거 또는 환경 분리 전략 명확화 | 🟢 낮음 |
| `src/lib/meta-pixel.ts` | 동일 (하드코딩 폴백 ID) | 🟢 낮음 |

---

*이 보고서는 코드 정적 분석 기준으로 작성되었습니다. 코드 수정·커밋·배포는 포함되지 않습니다.*
