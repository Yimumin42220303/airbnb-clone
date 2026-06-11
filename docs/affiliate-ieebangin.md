# 나는이방인이다 × 도쿄민박 어필리에이트 협업 기획서

> 작성일: 2026-06-11  
> 상태: 검토 중

---

## 1. 협업 개요

### 채널 프로필

| 항목 | 내용 |
|------|------|
| 채널명 | 나는이방인이다 (I'm a Foreigner) |
| 핸들 | @Ieebangin |
| 채널 ID | UCB5bxWzwZLcqqIpz161RlcQ |
| 콘텐츠 주제 | 해외이민·유학·워홀·국제커플·해외취업·해외창업 |
| 핵심 시청자 | 일본 체류 중이거나 일본행을 계획 중인 한국인 |
| 연락처 | leebangin93@gmail.com |

### 협업 적합성

도쿄민박(`tokyominbak.net`)의 타겟 — **도쿄에 머무는 한국인 여행객** — 과 이 채널의 핵심 시청자층이 높은 수준으로 겹친다. 특히 워홀·유학·이민 준비 중에 단기 숙박 수요가 발생하는 시점과, 채널 콘텐츠 소비 시점이 자연스럽게 연결된다.

### 협업 방식

어필리에이트 방식으로 진행한다. 채널에서 도쿄민박을 소개하면, 해당 채널을 통해 유입된 예약에 커미션을 지급하고, 시청자에게는 전용 할인 쿠폰을 제공한다.

---

## 2. 비즈니스 조건

### 커미션 구조 (안)

| 지표 | 조건 |
|------|------|
| 커미션 기준 | 예약 확정 + 결제 완료 기준 (환불/취소 건 제외) |
| 커미션율 | 숙박비 합계의 **5%** (청소비 제외) |
| 최소 지급 기준 | 월 정산 누적 커미션 ¥5,000 이상 시 지급 (미달 시 이월) |
| 지급 주기 | 매월 말일 집계, 익월 10일 지급 |
| 지급 방법 | 은행 계좌 이체 또는 PayPal (유튜버 선택) |
| 어트리뷰션 윈도우 | 링크 클릭 후 **30일** 이내 예약 확정 시 커미션 인정 |
| 쿠키 만료 | 30일 (쿠폰 코드 병행으로 쿠키 없이도 추적 가능) |

> **조정 가능 항목**: 커미션율(3~7%), 어트리뷰션 윈도우(14~60일)는 협의 후 확정.

### 게스트 혜택 (쿠폰)

| 항목 | 내용 |
|------|------|
| 쿠폰 코드 | `IEEBANGIN` (대소문자 무관) |
| 할인 금액 | 숙박비 합계의 **5% 할인** (최대 ¥5,000 캡) |
| 적용 대상 | 첫 예약에만 적용 (재방문자 제외) |
| 유효 기간 | 협업 기간 중 상시 유효 (종료 시 30일 유예 후 만료) |
| 중복 적용 | 다른 프로모션과 중복 불가 |

### 협업 기간 및 종료 조건

- 초기 계약: **3개월** (2026-07 ~ 2026-09), 이후 1개월 단위 자동 갱신
- 어느 쪽이든 30일 전 서면(이메일) 통보 시 종료 가능
- 성과 최소 기준(월 3건 이상 확정 예약)을 연속 2개월 미달 시 조건 재협의

---

## 3. 콘텐츠 협업 방식

### 영상 기획 방향

| 영상 유형 | 예시 제목 | 목적 |
|-----------|-----------|------|
| 숙소 브이로그 | "도쿄 워홀러가 실제 살아보는 도쿄 민박 A to Z" | 숙소 현장감 전달 |
| 지역 안내 | "도쿄 신주쿠 vs 시부야 — 단기 체류 어디가 나을까?" | 검색 유입 + 숙소 연결 |
| Q&A/정보성 | "도쿄 단기 숙박 에어비앤비 vs 민박, 뭐가 다른가?" | 비교 콘텐츠로 신뢰 구축 |
| 협찬 태그 영상 | 협업 사실을 공개 고지하는 스폰서 영상 | 전환 중심 |

### 노출 방식

1. **영상 설명란**: 전용 링크(`tokyominbak.net/?ref=ieebangin`) + 쿠폰 코드 상단 고정
2. **영상 본문 언급**: "쿠폰 코드 IEEBANGIN으로 첫 예약 5% 할인" 자막/멘트 포함
3. **커뮤니티 게시글**: 월 1회 이상 쿠폰 코드 안내 포스팅
4. **핀 댓글**: 대표 영상에 할인 정보 핀 댓글 고정

### 협의 사항

- 촬영비·숙박비 지원 여부 (1~2박 무료 제공 vs 유상 검토)
- 영상 최종 편집본 사전 검토 여부 (사실 오류 확인 목적에 한정)
- 영상 게재 전 최소 사전 통보 기간 (권장: 3일)

---

## 4. 기술 구현 스펙

### 4-1. 개요

세 가지 레이어로 구성한다.

1. **추적 레이어** — UTM 파라미터 + 전용 레퍼럴 코드로 유입 경로 기록
2. **쿠폰 레이어** — 쿠폰 코드 검증·할인 적용·사용 이력 관리
3. **리포팅 레이어** — 어드민 대시보드에서 전환·커미션 조회

### 4-2. DB 변경

#### 신규 모델: `Coupon`

```prisma
model Coupon {
  id              String   @id @default(cuid())
  code            String   @unique  // 예: "IEEBANGIN"
  type            String   @default("percent") // "percent" | "fixed"
  value           Int      // percent: 할인율(5=5%), fixed: 할인금액(JPY)
  maxDiscount     Int?     // percent 타입 최대 할인 상한 (JPY). null=무제한
  minBookingPrice Int      @default(0) // 적용 최소 예약금액 (JPY)
  usageLimit      Int?     // 전체 사용 가능 횟수. null=무제한
  usedCount       Int      @default(0)
  firstTimeOnly   Boolean  @default(false) // true면 첫 예약만 적용
  referralCode    String?  // 연동 레퍼럴 코드 (UTM ref 값과 연결)
  startsAt        DateTime?
  expiresAt       DateTime?
  enabled         Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  bookings        Booking[]
  @@index([code])
  @@index([referralCode])
}
```

#### `Booking` 모델 필드 추가

```prisma
// Booking 모델에 추가
couponId        String?
coupon          Coupon?  @relation(fields: [couponId], references: [id])
discountAmount  Int      @default(0) // 쿠폰 할인 금액 (JPY)
referralCode    String?  // 예약 시점 레퍼럴 코드 스냅샷 (쿠키/쿼리 파라미터)
```

#### 신규 모델: `AffiliateClick` (클릭 추적, 선택)

```prisma
model AffiliateClick {
  id           String   @id @default(cuid())
  referralCode String
  sessionId    String?  // 브라우저 세션 식별자
  userId       String?  // 로그인 사용자 (있으면)
  utmSource    String?
  utmMedium    String?
  utmCampaign  String?
  landingPage  String?
  ipHash       String?  // 개인정보 비식별화를 위해 해시 처리
  createdAt    DateTime @default(now())

  @@index([referralCode, createdAt])
}
```

### 4-3. 마이그레이션 절차

```bash
# 1. schema.prisma 수정 후
npm run db:migrate        # 개발 환경 마이그레이션 생성·적용
npm run db:generate       # Prisma 클라이언트 재생성

# 2. 스테이징 검증 후 프로덕션 배포
npm run db:migrate:deploy  # CI/프로덕션 마이그레이션 적용
```

### 4-4. API 명세

#### 쿠폰 검증 API

```
POST /api/coupons/validate
```

**Request body**

```json
{
  "code": "IEEBANGIN",
  "listingId": "clxxx",
  "checkIn": "2026-08-01",
  "checkOut": "2026-08-04",
  "guests": 2,
  "basePrice": 90000
}
```

**Response (성공)**

```json
{
  "valid": true,
  "couponId": "clyyy",
  "discountAmount": 4500,
  "finalPrice": 85500,
  "message": "5% 할인이 적용됩니다."
}
```

**Response (실패)**

```json
{
  "valid": false,
  "error": "COUPON_EXPIRED" // COUPON_NOT_FOUND | COUPON_DISABLED | COUPON_EXHAUSTED | NOT_FIRST_BOOKING | BELOW_MIN_PRICE
}
```

#### 예약 생성 변경 (`POST /api/bookings`)

기존 body에 필드 추가:

```json
{
  "...기존 필드",
  "couponCode": "IEEBANGIN",
  "referralCode": "ieebangin"
}
```

서버 내부 처리 순서:
1. 쿠폰 코드 → `Coupon` 조회 및 유효성 검증
2. `discountAmount` 계산
3. `totalPrice = 원래가격 - discountAmount`로 결제 금액 산정
4. `Booking` 생성 시 `couponId`, `discountAmount`, `referralCode` 저장
5. 결제 완료 후 `Coupon.usedCount += 1` (트랜잭션 내 처리)

#### 어필리에이트 리포팅 API (어드민 전용)

```
GET /api/admin/affiliate/stats?referralCode=ieebangin&from=2026-07-01&to=2026-07-31
```

**Response**

```json
{
  "referralCode": "ieebangin",
  "period": { "from": "2026-07-01", "to": "2026-07-31" },
  "clicks": 312,
  "bookings": {
    "total": 18,
    "confirmed": 15,
    "cancelled": 3
  },
  "revenue": {
    "total": 1350000,
    "commissionBase": 1350000,
    "commissionAmount": 67500,
    "commissionRate": 0.05
  },
  "couponsUsed": 11,
  "totalDiscount": 49500
}
```

### 4-5. 레퍼럴 추적 (프론트엔드)

`src/components/layout/ReferralTracker.tsx` (신규, Client Component):

```tsx
"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// 레퍼럴 코드를 sessionStorage에 저장 (30일 쿠키로도 병행 저장)
export function ReferralTracker() {
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      document.cookie = `ref=${ref}; max-age=${60 * 60 * 24 * 30}; path=/; SameSite=Lax`;
      sessionStorage.setItem("referralCode", ref);
    }
  }, [params]);
  return null;
}
```

`src/app/layout.tsx`의 `<body>` 내부에 `<ReferralTracker />`를 추가한다.

예약 폼 제출 시 쿠키·sessionStorage에서 `referralCode`를 읽어 `POST /api/bookings` body에 포함:

```ts
const referralCode =
  sessionStorage.getItem("referralCode") ||
  document.cookie.match(/ref=([^;]+)/)?.[1] ||
  null;
```

### 4-6. 커스텀 랜딩 페이지

경로: `app/landing/ieebangin/page.tsx`

구성 요소:
- 히어로 섹션: "이방인 독자 전용 도쿄 숙소" 타이틀 + 쿠폰 코드 배너
- 추천 숙소 그리드 (기존 `getListings()` 재사용)
- 유튜버 소개 섹션 (채널 임베드 또는 썸네일 링크)
- CTA: "지금 예약하기" → `/search?ref=ieebangin` 또는 직접 숙소 링크

URL: `tokyominbak.net/landing/ieebangin` (영상 설명란에 삽입)

> SEO 인덱싱 제외 권장 (`noindex` 메타 태그). 랜딩 전용 페이지이므로 검색 노출 불필요.

### 4-7. 어드민 대시보드 통합

기존 `/admin` 패턴에 **어필리에이트 탭** 추가:

```
/admin/affiliate
  - 전체 어필리에이트 목록 (레퍼럴 코드별)
  - 기간별 클릭 수 / 예약 수 / 커미션 금액
  - 쿠폰 생성·수정·활성화/비활성화
  - CSV 다운로드 (정산용)
```

### 4-8. GA4 이벤트 추가

기존 `lib/ga4-events.ts`에 이벤트 추가:

```ts
// 쿠폰 적용 이벤트
export function trackCouponApplied(code: string, discountAmount: number) {
  gtag("event", "coupon_applied", {
    coupon_code: code,
    discount_amount: discountAmount,
  });
}

// 어필리에이트 유입 예약 완료
export function trackAffiliateConversion(referralCode: string, revenue: number) {
  gtag("event", "affiliate_conversion", {
    referral_code: referralCode,
    value: revenue,
    currency: "JPY",
  });
}
```

---

## 5. 운영 프로세스

### 월별 정산 플로우

```
매월 말일
  └─ 어드민 /admin/affiliate 에서 해당 월 CSV 다운로드
       └─ 확정 예약 건 커미션 합산
            └─ 지급 기준 충족 여부 확인 (¥5,000 이상)
                 └─ 익월 10일까지 계좌 이체
                      └─ 정산 내역 이메일 발송 (유튜버 확인용)
```

### 취소·환불 처리 원칙

- 게스트 취소 (환불 발생): 해당 예약 커미션 지급 제외
- 호스트 취소: 해당 예약 커미션 지급 제외 + 게스트 재예약 시 쿠폰 재사용 허용
- 부분 환불: 실제 결제된 금액 기준으로 커미션 재산정

### 지표 리포팅

월 1회, 아래 지표를 요약해 유튜버에게 공유 (신뢰 구축 및 콘텐츠 피드백 용도):

- 채널 유입 클릭 수
- 전환율 (예약 확정 / 클릭)
- 확정 예약 수·총 숙박 매출
- 지급 커미션 금액
- 쿠폰 사용 수

---

## 6. 구현 로드맵

| 단계 | 내용 | 예상 공수 | 우선순위 |
|------|------|-----------|----------|
| Phase 1 | UTM 추적 + `ReferralTracker` 컴포넌트 | 0.5일 | 즉시 |
| Phase 1 | `Coupon` 모델 + DB 마이그레이션 | 0.5일 | 즉시 |
| Phase 1 | `/api/coupons/validate` + 예약 API 쿠폰 적용 | 1일 | 즉시 |
| Phase 2 | 커스텀 랜딩 페이지 `/landing/ieebangin` | 1일 | 협업 시작 전 |
| Phase 2 | 어드민 어필리에이트 탭 + CSV 다운로드 | 1~2일 | 정산 전 |
| Phase 3 | `AffiliateClick` 클릭 추적 테이블 + 집계 | 1일 | 선택 |
| Phase 3 | GA4 커스텀 이벤트 + 전환 대시보드 | 0.5일 | 선택 |

**최소 런칭 범위 (Phase 1)**: 쿠폰 시스템 + 레퍼럴 코드 저장. GA4 UTM 추적은 즉시 가능하므로 Phase 1 시작 전에 먼저 적용.

---

## 7. 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| 쿠폰 코드 유출·남용 | 1인 1회 제한(`firstTimeOnly`) + 전체 사용 한도(`usageLimit`) 설정 |
| 어트리뷰션 분쟁 | 쿠폰 코드를 병행 사용해 쿠키 없이도 추적 가능하도록 이중화 |
| 채널 콘텐츠 브랜드 리스크 | 영상 사전 확인 조항 계약서에 명시 (사실 오류·브랜드 이미지 훼손 시 수정 요청권) |
| 정산 오류 | 어드민 CSV + Booking DB 크로스 체크 후 지급 |

---

*이 문서는 협상 초안으로, 최종 조건은 양측 합의 후 별도 계약서로 확정.*
