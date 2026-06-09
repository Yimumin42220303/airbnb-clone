# 도쿄민박 UX/UI 개선 — 개발PM 검토 보고서 (Rev.2)

작성일: 2026-06-08 (Rev.2 업데이트: 디자이너 조건 10항 반영)
작성 기준: 코드베이스 직접 분석 + 디자이너 확인 조건

---

## 이번 스프린트 범위 요약

| 구분 | 이번 스프린트 포함 | 제외 (별도 승인 필요) |
|------|-----------------|-------------------|
| 스키마 변경 | **없음** | nearestStation, walkMinutes, floorNumber, hasElevator, transitInfo 컬럼 추가 |
| 데이터 정비 | P0-A title/location 수동 정비 (샘플 3~5개 → 승인 후 전체) | bulk update, production 직접 일괄 수정 |
| 코드 변경 | P1 가격 문구 / P2 카드 스펙·배지 / P3 예약 박스 / P5 추천 페이지 / P6 블로그 CTA | — |
| 보류 항목 | P4 ReviewSummaryAI 자동 fetch (별도 승인 후 진행) | 엘리베이터·층수 배지 |

---

## 1. 현황 진단표 (업데이트)

| 영역 | 대상 파일 | 문제 | 심각도 | 수정 난이도 | 이번 스프린트 |
|------|-----------|------|--------|------------|--------------|
| 숙소 title/location 정합성 | DB 데이터 | `location` 자유 텍스트 — title의 역명/도보시간과 충돌 가능 | 높음 | 중 (데이터 정비) | P0-A: 샘플 정비 후 승인 시 전체 |
| 엘리베이터·층수 현황 파악 | DB amenity/houseRules | 전용 컬럼 없음 | 높음 | 해당 없음 (파악만) | P0-B: 조사만, 스키마 변경 없음 |
| 가격 표시 문구 | `ListingCard.tsx`, `BookingForm.tsx`, `BlogListingCard.tsx` | 날짜 미선택 시 청소비·총액 맥락 없음 | 중 | 낮음 | **P1: 진행** |
| 숙소 카드 스펙·배지 | `ListingCard.tsx`, `ListingBadge.tsx` | areaSqm·baths·instantBooking·cancellationPolicy 미표시 | 중 | 낮음~중 | **P2: 진행 (기존 필드만)** |
| 예약 박스 신뢰 UX | `BookingForm.tsx`, `MobileStickyBookingBar.tsx` | 카드 미저장·결제 보안·총액 재확인 문구 누락 | 중 | 낮음 | **P3: 진행** |
| 리뷰 요약 자동 노출 | `ReviewSummaryAI.tsx` | 버튼 클릭 시에만 로드 | 중 | 낮음 | **P4: 버튼 개선만 (자동 fetch 보류)** |
| 추천 페이지 단계 흐름 | `RecommendLandingSections.tsx`, `RecommendPageContent.tsx` | 4단계 흐름 시각화 없음, reason 노출 약함 | 중 | 낮음 | **P5: 진행** |
| 블로그 CTA 문구 | `BlogListingCard.tsx`, `blog-listing-shortcode.ts` | generic/placeholder 문구 존재 | 낮~중 | 낮음 | **P6: 진행** |

---

## 2. 실행 순서 (확정)

```
1. P0-A  숙소 title/location 정합성 QA 테이블 제출 → 샘플 3~5개 → 승인 → 나머지
2. P1    가격 표시 문구 통일 (3개 파일)
3. P3    예약 박스 신뢰 UX 강화
4. P2    숙소 카드 스펙·배지 (기존 DB 필드만)
5. P5    /recommend 단계 흐름 + 추천 이유 노출
6. P6    블로그 CTA 문구 정비
7. P4    리뷰 요약 버튼 개선 (자동 fetch 없음)

병렬: P0-B 엘리베이터·층수 현황 파악 (스키마 변경 없음)
```

---

## 3. P0-A 숙소 title/location 정합성 정비 절차

### 3-1. 위험 등급 재분류

이전 보고서에서 "리스크 없음"으로 기술했으나 **프로덕션 콘텐츠 수정**으로 재분류합니다.

- title/location은 SEO title, meta description, JSON-LD, 카드·상세 모든 UI에 직접 반영됩니다.
- 잘못 수정 시 검색 순위 하락, 사용자 위치 오인, 예약 분쟁으로 이어질 수 있습니다.

### 3-2. 작업 절차

**Step 1 — 전체 백업 (작업 전 필수)**

```sql
-- Prisma Studio 또는 DB 직접 접속
SELECT id, title, location, updatedAt FROM Listing ORDER BY createdAt;
```

백업 파일명: `listing_backup_YYYYMMDD.csv` — Git에 커밋하지 않고 별도 보관.

**Step 2 — QA 테이블 작성 및 제출**

작업 전 아래 형식으로 전체 숙소 QA 테이블을 제출하고 승인을 받습니다.

| 숙소 ID | 현재 title | 현재 location | title 역명 | title 도보분 | location 파싱 역명 | location 파싱 도보분 | 충돌 여부 | 수정 방향 | 데이터 확인 필요 |
|---------|----------|-------------|----------|------------|-----------------|------------------|---------|---------|----------------|
| (예시) | "이케부쿠로역 도보 5분 …" | "주조역 도보 8분" | 이케부쿠로역 | 5분 | 주조역 | 8분 | **충돌** | location 기준 유지, title에서 교통 카피 제거 | 실제 도보 확인 필요 |

**Step 3 — 샘플 3~5개 수정**

충돌이 가장 명확한 숙소 3~5개를 먼저 수정하고 아래를 확인합니다.

- 카드에서 location 표시 정상 확인
- 상세 페이지 위치 표시 확인
- SEO title 예상값 vs 실제 생성값 비교 (`buildListingTitle()` 함수 기준)
- Google Search Console에서 페이지 인덱스 상태 이상 없음 확인

**Step 4 — 승인 후 나머지 반영**

샘플 확인 후 승인을 받고 남은 숙소를 한 건씩 수정합니다. **일괄 bulk update 금지.**

### 3-3. location 필드 통일 기준

| 항목 | 기준 | 예시 |
|------|------|------|
| location 필드 | 가장 가까운 역 + 도보 시간만 | `주조역 도보 4분` |
| 주요 지역 이동 시간 | description 또는 houseRules로 이동 | `이케부쿠로까지 전철 5분, 신주쿠 10분` |
| title | 고유 숙소명 중심, 교통 카피 제거 | `이케부쿠로 디지털 노마드 3` |
| SEO title 자동 생성 | `buildListingTitle()` 함수가 location 기준으로 생성 — location만 정확하면 SEO도 자동 수정됨 | — |

### 3-4. P0-B 엘리베이터·층수 현황 파악 (병렬 진행)

```sql
SELECT id, title, houseRules FROM Listing
WHERE houseRules LIKE '%엘리베이터%' OR houseRules LIKE '%층%';
```

어메니티 테이블에서 "엘리베이터" 키워드 포함 항목 확인:

```sql
SELECT a.name, COUNT(la.listingId) as cnt
FROM Amenity a
JOIN ListingAmenity la ON a.id = la.amenityId
WHERE a.name LIKE '%엘리베이터%' OR a.name LIKE '%elevator%'
GROUP BY a.name;
```

파악 결과를 표로 정리하고, 전용 컬럼 추가 필요성을 별도 마이그레이션 티켓으로 제안합니다.
**이번 스프린트에서 `prisma/schema.prisma` 수정 없음.**

---

## 4. P1 가격 표시 정책 (확정)

### 4-1. 상태별 표시 기준 (확정 문구)

| 상태 | 위치 | 확정 문구 |
|------|------|---------|
| 날짜 미선택 (카드) | `ListingCard.tsx` showPricePlaceholder | `날짜를 선택하면 청소비 포함 총액을 확인할 수 있어요.` |
| 날짜 선택 후 (카드) | 현행 유지 | `총 ¥XX,XXX (N박)` + `1인당 약 ¥XX,XXX` |
| 예약 박스 날짜 미선택 | `BookingForm.tsx` | `날짜를 선택하면 청소비·수수료 포함 총액을 확인할 수 있어요.` |
| 예약 박스 날짜 선택 후 | `BookingForm.tsx` | `최종 결제 전 금액을 다시 확인한 뒤 예약을 진행합니다.` |
| 블로그 숙소 카드 | `BlogListingCard.tsx` CTA 버튼 위 | `날짜·인원 선택 후 청소비 포함 총액을 확인할 수 있어요.` |
| 랜딩/추천 결과 카드 | `RecommendResultPrice` 등 | `기준가 ¥XX,XXX〜 / 날짜·인원에 따라 달라집니다.` |

### 4-2. 금지 표현 (grep 후 제거)

```bash
grep -r "무조건 최저가\|에어비앤비보다\|가장 저렴\|항상.*저렴\|무조건.*저렴" src/
```

현재 소스 코드에서는 미발견. 단, 블로그 자동 생성 프롬프트(`lib/blog-daily-prompt.ts`)에 아래 주석을 추가하는 것을 권장합니다.

```typescript
// 금지 표현: "무조건 최저가", "에어비앤비보다 항상 저렴", "가장 저렴"
// 권장 표현: "날짜·인원 선택 후 총액 확인", "청소비·수수료 포함 기준 비교 권장"
```

### 4-3. 수정 대상 파일 목록 (P1)

| 파일 | 수정 내용 | 변경 범위 |
|------|---------|---------|
| `src/components/ui/ListingCard.tsx` | showPricePlaceholder 문구 교체 | 1행 문구 |
| `src/components/listing/BookingForm.tsx` | 날짜 미선택/선택 후 안내 문구 추가 | 1~2줄 추가 |
| `src/components/blog/BlogListingCard.tsx` | CTA 버튼 위 가격 기준 문구 추가 | 1줄 추가 |

---

## 5. P2 숙소 카드 스펙·배지 강화 (확정 범위)

### 5-1. 이번 스프린트에서 추가하는 항목 (기존 DB 필드만)

| 항목 | DB 필드 | 표시 방식 | 비고 |
|------|--------|---------|------|
| 면적 | `areaSqm` (Listing) | 스펙 라인: `NN㎡` | null이면 생략 |
| 욕실 수 | `baths` (Listing) | 스펙 라인: `욕실 N` | — |
| 리뷰 수 | `reviewCount` (카드 prop) | 별점 옆 `(N)` — 현행과 동일 구조, 0이면 미표시 | 현재 이미 있으나 일부 경로에서 미전달 |
| 자동확정 배지 | `instantBooking` (Listing) | 배지: `⚡ 자동확정` | — |
| 취소정책 배지 | `cancellationPolicy` (Listing) | 아래 5-2 참고 | 신중한 문구 처리 필요 |

**확정 스펙 라인 구조:**

```
최대 N인 · 침실 N · 침대 N · 욕실 N · NN㎡
```

### 5-2. 취소정책 배지 문구 기준 (신중 처리)

디자이너 조건에 따라 "무료취소" 단독 표기는 피하고 아래 기준으로 표시합니다.

| cancellationPolicy 값 | 배지 표시 | 근거 |
|----------------------|---------|------|
| `"flexible"` | `취소정책 확인 가능` | flexible이더라도 체크인 전 며칠까지 무료인지 조건이 숙소마다 다를 수 있음 — 단정 금지 |
| `"moderate"` | `취소정책 확인 가능` | 동일 |
| `"strict"` | `취소정책 확인 가능` | 동일 |
| 정책 + 체크인 날짜가 확정된 경우 | `N일 전까지 무료취소` | BookingForm 내 RefundSchedule에서만 구체 날짜 계산 후 표시. 카드 레벨에서는 사용 안 함. |

**배지 표시 우선순위 (ListingBadge):**
1. `isVerified` → 인증 배지 (기존 유지)
2. `instantBooking === true` → `⚡ 자동확정`
3. `cancellationPolicy` 값 있음 → `취소정책 확인 가능`
4. `reviewCount >= 1` → `후기 있음`

### 5-3. 엘리베이터·층수 배지 — 이번 스프린트 제외

전용 DB 컬럼(`hasElevator`, `floorNumber`)이 생기기 전까지 카드 배지 구현 없음.
P0-B 조사 완료 후 별도 마이그레이션 티켓에서 진행.

### 5-4. 수정 대상 파일 목록 (P2)

| 파일 | 수정 내용 |
|------|---------|
| `src/components/ui/ListingCard.tsx` | areaSqm·baths props 추가, 스펙 라인 업데이트 |
| `src/components/listing/ListingBadge.tsx` | instantBooking·cancellationPolicy·reviewCount 배지 추가 |
| `src/app/search/SearchResults.tsx` | 카드 호출 시 새 props 전달 |
| `src/components/home/HomeRecommendedSection.tsx` | 동일 |
| 기타 ListingCard 사용처 | grep으로 전체 확인 후 props 누락 없이 전달 |

---

## 6. P3 예약 박스 신뢰 UX (확정)

### 6-1. BookingForm에 추가할 내용

예약 버튼 근처(버튼 위 또는 아래)에 신뢰 체크리스트 블록을 추가합니다. 기존 `ListingTrustCard`를 덮어쓰는 것이 아니라 **예약 버튼 직전**에 간결하게 배치합니다.

**날짜 미선택 상태 안내 문구 (버튼 위):**
```
날짜를 선택하면 청소비·수수료 포함 총액을 확인할 수 있어요.
```

**날짜 선택 후 확인 문구 (버튼 위):**
```
최종 결제 전 금액을 다시 확인한 뒤 예약을 진행합니다.
```

**결제 보안 안내 (버튼 아래 또는 SafePaymentMarks 근처):**
```
결제 전 최종 총액 확인  ·  카드 정보는 도쿄민박 서버에 저장되지 않습니다  ·  KG이니시스 보안결제
```

```
체크인 안내를 한국어로 제공  ·  숙박 중 문제 접수 가능
```

`SafePaymentMarks` 컴포넌트(`src/components/booking/SafePaymentMarks.tsx`)가 이미 존재하므로 해당 컴포넌트를 BookingForm 내 예약 버튼 하단에 배치합니다. 컴포넌트 자체의 로직은 변경하지 않습니다.

### 6-2. MobileStickyBookingBar — 간결하게 유지

과도한 문구 삽입 없이 **한 줄만** 추가합니다.

날짜 선택 후: 기존 총액 표시 유지 + "결제 전 총액 확인" 문구를 작은 텍스트로 한 줄 표시.
날짜 미선택 상태: 기존 "날짜·인원 선택" 유도 버튼 유지, 별도 신뢰 문구 추가 없음.

### 6-3. 수정 대상 파일 목록 (P3)

| 파일 | 수정 내용 | 변경하지 않는 것 |
|------|---------|--------------|
| `src/components/listing/BookingForm.tsx` | 안내 문구 블록, SafePaymentMarks 배치 | 예약 생성/결제 로직 전체 |
| `src/components/listing/MobileStickyBookingBar.tsx` | 간결한 총액 확인 문구 1줄 | 기존 버튼·가격 표시 구조 |

---

## 7. P4 리뷰 요약 (제한 범위)

### 7-1. 이번 스프린트 범위 (자동 fetch 없음)

ReviewSummaryAI 자동 fetch는 **OpenAI API 비용 및 정확성 이슈로 별도 승인 후 진행**합니다.

이번 스프린트에서는 아래만 진행합니다.

- 리뷰 요약 버튼(`이용자 후기 요약 보기` 등)을 더 눈에 띄게 개선
- 버튼 클릭 후 표시되는 `pros`/`cons`/`recommendedFor` 배열을 칩(chip) 형태 UI로 표시 (API 응답 구조 변경 없음, UI만 개선)

**절대 금지:** 리뷰가 없거나 부족한 숙소에 임의 생성 요약, 가짜 후기 추가 금지.

리뷰 0개 숙소는 요약 버튼 자체를 숨기고, 플랫폼 전체 이용 후기 링크(`/trust`)로 대체합니다.

### 7-2. 자동 fetch 보류 사유 및 재검토 조건

| 사유 | 재검토 조건 |
|------|-----------|
| OpenAI 비용 영향 불명확 | 월 API 비용 예산 확인 후 |
| 리뷰 3개 미만 숙소에서 정확성 이슈 | 리뷰 최소 5개 이상 숙소에 한정 적용 조건 확인 후 |
| LCP 영향 미측정 | Core Web Vitals 측정 후 |

---

## 8. P5 /recommend 단계 흐름 (확정)

### 8-1. 추가할 내용

`RecommendLandingSections.tsx` 내 `RecommendHero` 아래에 4단계 흐름 블록을 추가합니다.

**확정 문구 (form 상단 배치):**

```
1단계  일정·인원·지역 입력
2단계  조건에 맞는 후보 3곳 확인
3단계  최종 요금·예약 가능 여부 한국어 확인
4단계  예약 또는 카카오톡 상담
```

모바일(375px)에서 가로 스크롤 없이 세로 스택 또는 2×2 그리드로 표시.

### 8-2. 추천 결과 카드 reason 필드 노출 강화

`RecommendPageContent.tsx`의 `toRecommendItem()` 함수에서 `reason` 값이 이미 생성되나 카드 UI에서 명확히 노출되지 않습니다. 카드 내 "추천 이유" 섹션을 별도 블록으로 표시합니다.

```
[추천 이유] {reason 텍스트}
```

`reason`이 비어 있거나 null인 경우 해당 블록을 숨깁니다 (빈 레이블만 노출하는 것 방지).

### 8-3. 수정 대상 파일 목록 (P5)

| 파일 | 수정 내용 |
|------|---------|
| `src/components/recommend/RecommendLandingSections.tsx` | RecommendStepFlow 컴포넌트 추가 |
| `src/app/recommend/RecommendPageContent.tsx` | 결과 카드 reason 필드 노출 강화 |

---

## 9. P6 블로그 CTA 문구 정비 (확정)

### 9-1. anchorLabel 교체 기준

`BlogListingCard`의 `display.anchorLabel`이 shortcode 설정에서 옵니다. DB에서 아래 패턴을 검색해 교체합니다.

```sql
-- BlogPost body에서 shortcode anchorLabel 확인
SELECT id, title, body FROM BlogPost WHERE body LIKE '%anchorLabel%';
```

**교체 기준:**

| 기존 패턴 | 교체 문구 |
|---------|---------|
| `"자세히 보기"` 또는 `"{숙소명} 자세히 보기"` | `이 숙소 상세·요금 확인하기` |
| `"보기"` 단독 | `예약 가능 여부 확인하기` |
| 비어 있음 (`""`) | `도쿄민박에서 이 숙소 보기` |
| `"클릭"`, `"여기"` 등 | `이 숙소 상세·요금 확인하기` |

### 9-2. 블로그 본문 말미 CTA

`BlogRecommendCTA` 컴포넌트가 이미 존재합니다. 미사용 포스트를 확인해 추가합니다.

**블로그 → 전환 흐름 (우선순위순):**
1. 관련 숙소 카드 → 숙소 상세
2. 추천받기 → `/recommend`
3. 한국어 문의 → ChannelTalk

### 9-3. 수정 대상 파일 목록 (P6)

| 파일 | 수정 내용 |
|------|---------|
| `src/lib/blog-listing-shortcode.ts` | 빈 anchorLabel 기본값 설정, fallback 문구 정의 |
| DB BlogPost body | shortcode anchorLabel 값 일괄 확인 및 교체 (Prisma Studio) |

---

## 10. QA 체크리스트 (업데이트)

### 10-1. 필수 공통

- [ ] `npm run lint` 오류 없음
- [ ] `npm run build` 오류 없음
- [ ] 변경 파일 목록 확인 및 보고

### 10-2. 수정 전/후 비교

- [ ] P0-A 수정 대상 숙소: 수정 전 스크린샷 (카드, 상세, SEO title) 보관
- [ ] P0-A 수정 후: 동일 숙소 스크린샷 비교
- [ ] P1~P6 각 변경 영역: Before/After 스크린샷

### 10-3. 모바일 우선 확인 (375px)

- [ ] 숙소 카드 1개 — 위치·인원·스펙·배지·가격 가독성
- [ ] 예약 박스 신뢰 UX — 버튼 근처 문구 잘림 없음
- [ ] /recommend 단계 흐름 — 세로 스택 정상
- [ ] 모바일 스티키 예약 바 — 간결한 문구 확인

### 10-4. 데스크톱 확인

- [ ] 동일 항목 반복 확인

### 10-5. 주요 URL 확인

- [ ] `/` — 홈 숙소 카드 스펙·배지
- [ ] `/search` — 날짜 미선택·선택 상태별 가격 표시
- [ ] `/listing/[id]` — 예약 박스 신뢰 문구, 리뷰 요약 버튼
- [ ] `/recommend` — 단계 흐름, 결과 카드 추천 이유
- [ ] `/blog/[slug]` — 숙소 카드 CTA, 가격 기준 문구

### 10-6. 예약 플로우 smoke test

- [ ] 날짜 선택 → 청소비 포함 가격 표시 확인
- [ ] 예약 요청 버튼 활성화 확인
- [ ] `/booking/confirm` 페이지 접근 확인
- [ ] `/booking/[id]/pay` 결제 페이지 진입 확인
- [ ] **실제 결제 진행하지 않음**

### 10-7. 미수정 영역 확인 (명시적 확인)

- [ ] `prisma/schema.prisma` — **미수정** (nearestStation, walkMinutes, floorNumber, hasElevator, transitInfo 미추가)
- [ ] `app/api/bookings/` — 미수정
- [ ] `app/api/payments/`, `app/api/webhooks/portone/` — 미수정
- [ ] `app/api/cron/` — 미수정
- [ ] `lib/beds24.ts`, `lib/portone.ts` — 미수정
- [ ] `lib/auth.ts` — 미수정
- [ ] `lib/aeo/listing-jsonld.ts` — 미수정 (JSON-LD 구조 유지)
- [ ] `app/sitemap.ts`, `app/robots.ts` — 미수정
- [ ] `lib/availability.ts`, `lib/bookings.ts` — 미수정

---

## 11. 별도 승인 필요 항목 (이번 스프린트 제외)

| 항목 | 담당 티켓 | 사유 |
|------|---------|------|
| `nearestStation`, `walkMinutes` 컬럼 추가 | 다음 스프린트 마이그레이션 티켓 | DB 마이그레이션, 기존 location 데이터 정비 스크립트 필요 |
| `floorNumber`, `hasElevator` 컬럼 추가 | P0-B 결과 확인 후 결정 | 현황 데이터 파악 선행 필요 |
| `transitInfo` 컬럼 추가 | 다음 스프린트 | description/houseRules 중복 정리 필요 |
| ReviewSummaryAI 자동 fetch | 별도 승인 후 | OpenAI 비용, LCP 영향 측정 필요 |
| 블로그 자동 생성 프롬프트 금지 표현 가이드라인 추가 | `blog-daily-prompt.ts` | 콘텐츠 정책 변경으로 별도 검토 |

---

## 12. 남은 이슈

- **P0-A QA 테이블:** 실제 DB 데이터 접근이 필요합니다. Prisma Studio(`npm run db:studio`) 또는 `/admin/listings`에서 전체 숙소 데이터를 추출한 후 QA 테이블을 제출합니다. 이 단계는 구현 전 반드시 승인을 받아야 합니다.
- **취소정책 배지의 세부 조건:** cancellationPolicy 값이 "flexible"이더라도 체크인 N일 전까지 무료인지 숙소마다 다를 수 있습니다. 이번 스프린트에서는 "취소정책 확인 가능" 배지만 사용하고, 구체 날짜 계산은 BookingForm 내 RefundSchedule에 위임합니다.
- **블로그 anchorLabel DB 현황:** 실제 어떤 값이 저장되어 있는지 Prisma Studio에서 확인 후 P6 작업 범위가 확정됩니다. 값이 대부분 적절하다면 수정 범위가 줄어들 수 있습니다.
- **네이버 블로그 후기 연결:** 외부 플랫폼 후기 임베드는 저작권 이슈가 있으므로 링크 유도 방식만 허용합니다.
