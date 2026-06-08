# Beds24 가격 동기화 구현 검토 (옵션 A)

도쿄민박에 Beds24 일별 가격을 반영하기 위한 기술 검토입니다.

---

## 1. 방안 요약

| 항목 | 내용 |
|------|------|
| 데이터 소스 | Beds24 API |
| 저장 위치 | `ListingAvailability.pricePerNight` |
| 갱신 주기 | 6시간 (Beds24 권장) |

---

## 2. API 엔드포인트 선택

### 2-1. GET /inventory/rooms/offers

- **용도**: 체크인·체크아웃·인원 지정 시 해당 기간 가격·가용성 조회
- **특징**: 예약 직전 실시간 확인용
- **한계**: 날짜별로 호출해야 함 → 365일 동기화 시 365회 호출 (레이트 제한 위험)

### 2-2. GET /inventory/rooms/calendar (권장)

- **용도**: 최대 1년 분량 일별 가격·가용성 일괄 조회
- **특징**: 1회 호출로 많은 날짜 조회, Beds24에서 6시간마다 갱신 권장
- **적합**: 주기적 가격 동기화

**결론**: 가격 동기화에는 **/inventory/rooms/calendar** 사용 권장.

---

## 3. Beds24 응답 구조 (참고)

- **p1 ~ p16**: 최대 16개 가격 행 (레이트 플랜/채널별)
- **i**: 재고(가용 단위)
- **m, mx**: 최소/최대 숙박
- **o**: override (blackout 등)
- **x**: 배율

tokyominbak 레이트가 p1~p16 중 어느 인덱스에 매핑되는지는 Beds24 프로퍼티·룸 설정에 따라 다름.  
API 응답 또는 Beds24 문서에서 해당 인덱스 확인 필요.

---

## 4. 구현 설계

### 4-1. 대상 Listing

- `beds24Enabled = true`
- `beds24PropId`, `beds24RoomId` 존재

### 4-2. 동기화 주기

- **6시간마다** Cron 실행 (Beds24 권장)
- Vercel Cron: `vercel.json`에 `0 */6 * * *` 등 추가

### 4-3. 처리 흐름

1. beds24Enabled인 Listing 조회
2. 각 Listing에 대해 `GET /inventory/rooms/calendar?propId=…&roomId=…&from=…&to=…` 호출
3. 응답에서 tokyominbak 해당 가격 컬럼(pN) 추출
4. `ListingAvailability`에 `upsert` (listingId, date, pricePerNight)
   - `available`은 기존처럼 블록일(availability API) 기준 유지

### 4-4. DB 사용

- `ListingAvailability` 활용 (스키마 변경 없음)
- `listingId` + `date`로 upsert
- `pricePerNight`: Beds24에서 가져온 값
- `available`: 동기화 로직에서 변경하지 않음 (기존 blocked-dates 로직 유지)

---

## 5. 확인·해결 필요 사항

### 5-1. Beds24 calendar API 상세 스펙

- **요청 파라미터**: propId, roomId, from, to (형식 확인)
- **응답 구조**: 날짜별 객체 형식, p1~p16 키 이름
- **tokyominbak 매핑**: p1~p16 중 어느 인덱스인지 확인 방법

→ Beds24 Swagger(https://beds24.com/api/v2/#/) 또는 실제 호출로 검증 필요.

### 5-2. Listing·Beds24 매핑

- 1 Listing : 1 Beds24 room 가정
- 여러 Beds24 room을 하나의 Listing에 합치는 경우 추가 로직 필요

### 5-3. 통화

- 도쿄민박·Beds24 모두 JPY 가정
- Beds24가 다른 통화를 반환할 경우 환율 처리 필요 여부 확인

### 5-4. Listing.pricePerNight 처리

- **옵션 A**: `ListingAvailability`만 갱신, `Listing.pricePerNight`는 호스트가 수동 설정 (fallback용)
- **옵션 B**: Beds24 기본 가격으로 `Listing.pricePerNight`도 주기적 갱신

현재 `getNightlyAvailability`는 `ListingAvailability.pricePerNight`가 있으면 이를 우선 사용하므로, **옵션 A**만으로도 충분함.

### 5-5. 레이트 제한

- Beds24 API: 호출 수 제한 있음
- Listing 수 × 6시간당 1회 = 시간당 호출 수 예상 후 허용 범위 확인

---

## 6. 구현 단계 제안

| 단계 | 내용 |
|------|------|
| 1 | Swagger로 `GET /inventory/rooms/calendar` 호출, 응답 구조 및 tokyominbak 인덱스 확인 |
| 2 | `lib/beds24.ts`에 `getBeds24CalendarPrices(propId, roomId, from, to)` 구현 |
| 3 | Cron용 API route: `/api/cron/beds24-price-sync` (호출 주기 6시간) |
| 4 | Cron 내부: beds24Enabled Listing 순회 → calendar 조회 → ListingAvailability upsert |
| 5 | 테스트: 1개 Listing으로 동기화 검증 후 전체 적용 |

---

## 7. 대안: offers API 사용

- **GET /inventory/rooms/offers**를 사용하려면 날짜별 호출이 필요
- 365일 × N Listing이면 호출 수가 크게 증가 → 레이트 제한 리스크
- **실시간 예약 직전**에만 사용하는 편이 안전 (예: `getNightlyAvailability` 호출 시 Beds24 가격 보강)

---

## 8. 구현 완료 (2026-02)

- **lib/beds24.ts**: `getBeds24CalendarPrices(propId, roomId, fromDate, toDate, offerIndex)` 추가
- **api/cron/beds24-price-sync**: 6시간마다 Beds24 가격 → ListingAvailability 저장
- **Listing.beds24OfferIndex**: Beds24 p1~p16 중 사용할 컬럼 (1~16, tokyominbak 日別料金4면 4)
- **마이그레이션**: `prisma/migrations/20260219000000_add_beds24_offer_index`
  - 배포 전 `npx prisma migrate deploy` 실행 (또는 Neon 대시보드에서 SQL 수동 실행)

## 9. 정리

- **권장 엔드포인트**: `GET /inventory/rooms/calendar`
- **저장 대상**: `ListingAvailability.pricePerNight`
- **캐시/주기**: 6시간마다 Cron 실행
- **선행 작업**: Beds24 calendar 응답 구조 및 tokyominbak 가격 컬럼 확인
