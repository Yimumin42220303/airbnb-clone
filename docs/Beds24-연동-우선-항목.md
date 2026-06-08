# Beds24 API 연동 시 우선 적용 항목 (빨간 사각형 영역 기준)

숙소 수정 폼 중 **요금·인원·숙박일수·월별 배수·침실·침대·욕실·프로모션** 등이 있는 영역에서, Beds24 연동 시 **Beds24 정보가 우선**되는 항목을 코드 기준으로 정리했습니다.

---

## Beds24가 우선되는 항목

### 1. **1박 요금 (JPY)** — 날짜별 적용 금액

- **위치**: `src/lib/availability.ts` → `getNightlyAvailability()`
- **동작**:
  - Beds24 연동 시(`beds24Enabled` 또는 `beds24PropId`/`beds24RoomId` 설정) **Beds24 Calendar API**에서 해당 기간의 **일별 가격(price1)** 을 조회해 사용합니다.
  - 해당 날짜에 Beds24 가격이 있으면 그 금액(× Beds24용 월별 배수)이 적용되고, 폼에 입력한 「1박 요금」은 **Beds24 데이터가 없을 때만** fallback으로 사용됩니다.
- **정리**: 실제 예약·검색에 쓰이는 **날짜별 1박 요금**은 **Beds24가 우선**입니다.

### 2. **월별 요금 배수** — Beds24용 배수만 적용

- **동작**:
  - Beds24 연동 시 일별 가격 계산에 쓰는 배수는 **beds24JanuaryFactor ~ beds24DecemberFactor**(및 `beds24PriceMultiplier`)입니다.
  - 폼의 일반 「월별 요금 배수」(januaryFactor 등)는 **Beds24 미연동**일 때만 `pricePerNight × 배수`에 사용됩니다.
- **정리**: Beds24 연동 시에는 **기준 금액이 Beds24**이므로, “요금 금액” 관점에서는 **Beds24가 우선**이고, 도쿄민박에 입력한 **Beds24용 월별 배수**만 그 위에 곱해집니다.

### 3. **예약 불가(블록) 날짜 — 가용성**

- **위치**: `src/lib/ical.ts` → `getExternalBlockedDateKeys()`
- **동작**:
  - Beds24 연동 시 **Beds24 API**로 해당 기간의 블록(예약 불가) 날짜를 조회해, iCal 블록과 합쳐서 사용합니다.
  - `getListingBlockedDateKeys()` → `getExternalBlockedDateKeys()` 경로로 예약 가능 여부·캘린더 블록 표시에 반영됩니다.
- **정리**: **어떤 날이 예약 불가인지(가용성)** 는 **Beds24 블록이 우선** 반영됩니다. (폼에는 “블록”이 캘린더/별도 UI에 있을 수 있음.)

---

## Beds24가 우선되지 않는 항목 (도쿄민박 폼 값 사용)

다음 항목은 Beds24 API에서 가져오지 않으며, **항상 도쿄민박 DB(폼 입력값)** 이 사용됩니다.

| 항목 | 비고 |
|------|------|
| **기본 숙박 인원(명)** | `baseGuests` — 예약·요금 계산에 그대로 사용 |
| **최대 인원(명)** | `maxGuests` |
| **추가 인원 1인당 1박 요금 (JPY)** | `extraGuestFee` |
| **청소비 (JPY)** | `cleaningFee` |
| **최소 숙박 일수** | `minStayNights` |
| **최대 숙박 일수** | `maxStayNights` |
| **침실 / 침대 / 욕실** | 정적 속성, Beds24와 동기화 없음 |
| **프로모션대상(직영숙소)** | 플랫폼 내부 표시용 |
| **숙소 소개 영상** | Beds24와 무관 |

---

## 참고 코드 위치

- **일별 가격·Beds24 우선 여부**: `src/lib/availability.ts` 139–230행  
  (`useBeds24Prices`, `getBeds24CalendarPrices`, Beds24 가격 × beds24 월별 배수)
- **Beds24 블록 반영**: `src/lib/ical.ts` 217–231행  
  (`getExternalBlockedDateKeys` 내 Beds24 블록 merge)
- **Beds24 Calendar API**: `src/lib/beds24.ts`  
  `getBeds24CalendarPrices()`, `getBeds24BlockedDateKeys()` / `getBeds24BlockedDateKeysCached()`
- **Cron 동기화**: `src/app/api/cron/beds24-price-sync/route.ts`  
  Beds24 일별 가격 → `ListingAvailability.pricePerNight` 저장 (API 실패 시 이 값이 fallback으로 사용됨)
