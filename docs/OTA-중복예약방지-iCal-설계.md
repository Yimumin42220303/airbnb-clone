# Airbnb 등 타 OTA와의 중복 예약 방지 — iCal/ICS 설계

같은 숙소를 **이 플랫폼**과 **Airbnb·구글캘린더** 등에 동시에 올렸을 때, 한쪽에서 예약된 날짜를 다른 쪽에서 막는 기능 설계입니다.

---

## 1. 왜 iCal/ICS인가

- **Airbnb·부킹닷컴 등**은 대부분 **캘린더 가져오기(import)** 와 **캘린더 내보내기(export)** 를 지원합니다.
- 표준 형식이 **iCalendar (.ics)** 이라서, 우리가 **ICS URL을 하나만 만들면** 여러 OTA에 같은 주소만 연결해 주면 됩니다.
- **구글 캘린더**도 ICS로 공개/비공개 주소를 줄 수 있어, “구글 캘린더 = Airbnb + 우리 + 기타”처럼 **한 캘린더를 허브**로 쓸 수도 있습니다.

---

## 2. 양방향 동기화 개념 (최소 필요 조합)

| 방향 | 의미 | 누가 제공 | 누가 소비 |
|------|------|------------|-----------|
| **내보내기 (Export)** | 우리 예약을 외부에 알림 | 우리 서비스 | Airbnb 등 OTA |
| **가져오기 (Import)** | 외부 예약을 우리가 반영 | Airbnb·구글 등 | 우리 서비스 |

- **Export만** 하면: 우리에서 예약 → Airbnb 쪽에 반영됨 ✅ / Airbnb에서 예약 → 우리는 모름 ❌  
- **Import만** 하면: Airbnb 예약 → 우리에서 막힘 ✅ / 우리 예약 → Airbnb는 모름 ❌  
- **둘 다** 해야 **진짜 중복 예약 방지**가 됩니다.

---

## 3. 제안 구조 요약

1. **우리 → OTA (Export)**  
   - 숙소별 **ICS URL 1개** 제공.  
   - 이 URL에는 **이 플랫폼에서 확정된 예약**만 VEVENT로 넣음.  
   - 호스트가 이 URL을 Airbnb·부킹닷컴·구글캘린더 등에 “외부 캘린더”로 등록.

2. **OTA → 우리 (Import)**  
   - 숙소별로 **가져올 ICS URL 목록** (Airbnb 내보내기 주소, 구글캘린더 ICS 등) 저장.  
   - **예약 가능 여부 계산 시** 이 ICS를 주기적으로/캐시해서 가져와, 그 기간을 **예약 불가**로 처리.

3. **캐시**  
   - Import한 ICS는 **요청마다 바로 fetch하지 않고**, 15~30분 정도 캐시해서 사용 (외부 서버 부하·지연 방지).

---

## 4. 상세 설계

### 4-1. Export (우리 예약을 ICS로 내보내기)

- **API**: `GET /api/listings/[id]/calendar.ics`
  - 쿼리: 선택적으로 `?secret=xxx` (비공개용 토큰, 나중에 추가 가능)
- **응답**: `Content-Type: text/calendar`, 본문은 iCalendar 형식
  - `status !== 'cancelled'` 이고 (필요하면 `paymentStatus === 'paid'` 만) 인 **Booking**만 조회
  - 각 예약을 **VEVENT** 한 개로:
    - `DTSTART`, `DTEND`: 체크인/체크아웃 날짜 (종일 이벤트면 `DATE` 형식)
    - `SUMMARY`: 예: "예약 (도쿄민박)"
    - `UID`: 예: `booking-{bookingId}@yourdomain.com`
- **호스트 안내**:  
  “숙소 설정 → 캘린더 연동” 화면에서 위 URL을 복사해, Airbnb의 **캘린더 동기화 → 캘린더 가져오기**에 붙여넣기 하라고 안내.

**장점**: 구현 단순, Airbnb·구글·다른 OTA가 모두 “iCal URL” 하나로 우리 예약을 막을 수 있음.

---

### 4-2. Import (OTA/구글 캘린더를 우리가 가져오기)

- **저장**
  - **Listing**에 필드 추가 (예: `icalImportUrls`, JSON 배열 또는 별도 테이블).
  - 예: `["https://www.airbnb.com/calendar/ical/...", "https://calendar.google.com/calendar/ical/.../basic.ics"]`
  - 호스트가 “캘린더 연동” 설정에서 URL 추가/삭제.

- **사용 시점**
  - **예약 가능 여부**를 볼 때마다 사용:
    - `lib/bookings.ts`의 **겹치는 예약 검사** (`hasOverlappingBooking`)
    - `lib/availability.ts`의 **일별 가용성** (`getNightlyAvailability`)
  - 두 곳 모두 “**우리 DB 예약** + **Import한 ICS에서 파싱한 기간**”을 합쳐서 “막힌 기간”으로 처리.

- **ICS 파싱**
  - 외부 URL fetch → VCALENDAR 내 VEVENT만 읽기.
  - 각 VEVENT의 `DTSTART` / `DTEND` (또는 `DTSTART;VALUE=DATE` 등) → 날짜 구간으로 변환.
  - 해당 구간에 포함되는 **날짜(YYYY-MM-DD)** 를 “외부 예약으로 막힌 날” 집합에 넣음.
  - 반복 이벤트(RRULE)는 1차적으로 생략하거나, “해당 월만” 확장하는 식으로 단순 처리 가능 (OTA 캘린더는 보통 단일 VEVENT가 많음).

- **캐시**
  - **옵션 A (권장)**: 메모리/Redis 캐시  
    - 키: `listing:{id}:ical:{url 해시}` 또는 `listing:{id}:external-blocked`  
    - 값: `{ dateKey[] }` 또는 `{ start, end }[]`  
    - TTL: 15~30분  
  - **옵션 B**: DB 캐시 테이블  
    - 예: `ExternalBlockedDate (listingId, date, sourceUrl, fetchedAt)`  
    - 크론/스케줄러로 15분마다 ICS fetch 후 갱신, 가용성 조회는 DB만 읽기.

Import까지 하면 “Airbnb에 잡힌 날은 우리 사이트에서 선택 불가”가 됩니다.

---

### 4-3. 우리 쪽 로직 수정 포인트

- **`hasOverlappingBooking`** (또는 그를 호출하는 `createBooking` 직전 검사)
  - 기존: `Booking` 테이블만 보고 겹침 여부 판단.
  - 변경: **동일 listingId**에 대해 “외부 막힌 날짜” 집합을 가져와서, `checkIn`~`checkOut` 구간이 **하나라도 막힌 날과 겹치면** true 반환 (이미 예약 있음으로 처리).

- **`getNightlyAvailability`**
  - 기존: `ListingAvailability` + (직접 사용하지는 않지만, 예약은 `createBooking`에서 별도 검사).
  - 변경: 위에서 쓴 “외부 막힌 날짜” 집합을 인자로 받거나 내부에서 조회해서, `nights[]`의 각 `date`가 그 집합에 있으면 `available: false`로 설정.  
  - 그러면 “선택한 날짜 중 예약 불가한 날이 있습니다” 메시지가 그대로 살아남음.

- **검색/목록** (`getListings` 등에서 checkIn/checkOut 필터)
  - 이미 `Booking` 기반으로 “그 기간에 예약 가능한 숙소”만 보여주고 있다면, **동일 기간에 대해 “외부 막힌 날”이 있는 숙소는 제외**하도록 같은 “외부 막힌 날” 집합을 사용하면 됩니다. (성능상 캐시 필수.)

---

## 5. 구글 캘린더를 “한 곳”으로 쓰는 경우

- 호스트가 **구글 캘린더 1개**에만 모든 예약을 모으고 싶다면:
  - **우리**: 예약 확정 시 **Google Calendar API**로 해당 캘린더에 이벤트 생성 (선택 기능).
  - **Airbnb**: 그 구글 캘린더를 “캘린더 가져오기”로 연결.
  - **우리**: 동일 구글 캘린더의 **ICS 내보내기 URL**을 우리 Import 목록에 넣음.
- 그러면 “구글 캘린더 = 단일 진실 공급원”이 되고, 우리와 Airbnb가 같은 소스를 보게 됩니다.  
- 다만 **Google API 인증(OAuth2·서비스 계정)** 이 필요하므로, 1단계는 **Export/Import ICS만** 구현하고, 구글 연동은 2단계로 두는 것을 권장합니다.

---

## 6. 구현 순서 제안

| 단계 | 내용 | 효과 |
|------|------|------|
| 1 | **Export** — `GET /api/listings/[id]/calendar.ics` 구현, 우리 Booking만 VEVENT로 내보내기 | Airbnb 등에 우리 예약 반영 가능 |
| 2 | **Listing에 Import URL 저장** — `icalImportUrls` 필드 또는 테이블 추가, 호스트 설정 UI (숙소 수정 화면) | 외부 캘린더 URL 보관 |
| 3 | **ICS 파싱 + 캐시** — URL fetch, VEVENT 파싱, 15~30분 캐시 (메모리 또는 DB) | 안정적인 Import |
| 4 | **가용성 로직에 반영** — `hasOverlappingBooking`, `getNightlyAvailability`에서 “외부 막힌 날” 사용 | 우리 사이트에서 OTA 예약과 중복 예약 방지 |
| 5 | (선택) 검색 시 checkIn/checkOut 필터에 외부 막힌 날 반영 | 검색 결과부터 정확 |
| 6 | (선택) 구글 캘린더 API로 우리 예약 자동 등록 | 구글을 허브로 쓰는 호스트 편의 |

---

## 7. 정리

- **최적의 아이디어**는 **iCal/ICS 기반 양방향**입니다.
  - **Export**: 우리 예약을 ICS 한 URL로 제공 → 타 OTA가 “가져오기”로 우리 예약을 막음.
  - **Import**: 타 OTA(또는 구글캘린더) ICS URL을 우리가 주기적으로 가져와, 그 기간을 예약 불가로 처리.
- **지금 검토 중인 “ical과 구글캘린더 ics”** 방향이 맞고, 위 순서대로 하면 단계적으로 도입 가능합니다.
- 1단계(Export)만 해도 “우리에서 잡은 예약이 Airbnb에 반영”되므로, 그다음에 Import를 붙이면 **완전한 중복 예약 방지**가 됩니다.

이 설계를 기준으로 API·DB 스키마·캐시 전략만 정하면 구현에 들어갈 수 있습니다.

---

## 8. 구현 완료 (임시 iCal/ICS)

- **DB**: `Listing.icalImportUrls` (JSON 배열) 추가.
- **Export**: `GET /api/listings/[id]/calendar.ics` — 확정 예약만 VEVENT로 내보내기.
- **Import**: 호스트가 입력한 ICS URL 목록을 15분 캐시로 fetch·파싱 후 `getExternalBlockedDateKeys()`로 막힌 날 반환.
- **가용성 반영**: `lib/bookings.ts`의 `createBooking`에서 `hasExternalBlockedOverlap()` 검사, `lib/availability.ts`의 `getNightlyAvailability`에서 외부 막힌 날을 `available: false`로 처리.
- **호스트 UI**: 숙소 수정 폼에 「캘린더 연동」 섹션 — Export URL 안내, Import URL 텍스트 영역 (한 줄에 URL 하나).
- **추후 Beds24 API**: `lib/ical.ts`의 `getExternalBlockedDateKeys()` 내부에서 Beds24 API를 호출해 같은 `Set<string>`에 merge하면 됨. 동일 blocked-dates 파이프라인 사용.
