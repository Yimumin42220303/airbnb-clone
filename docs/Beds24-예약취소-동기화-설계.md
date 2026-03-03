# Beds24 예약 취소 동기화 — 설계·구현 방향

예약이 도쿄민박에서 취소될 때 Beds24 캘린더에도 해당 일정이 해제(블록 해제)되도록 반영하는 기능의 설계 및 구현 방향을 정리한 문서입니다.

---

## 1. 현황

| 구분 | 내용 |
|------|------|
| **예약 생성** | 도쿄민박에서 확정 시 `postBeds24Booking()`으로 Beds24 `POST /bookings` 호출 → Beds24가 해당 기간 블록 |
| **예약 취소** | 도쿄민박 DB만 `cancelled` 처리, **Beds24 API 미호출** → Beds24에는 블록 유지 |
| **Beds24 예약 ID** | `POST /bookings` 호출 시 응답의 새 예약 ID를 저장하지 않음 (`refererId`만 우리 예약 ID로 전달) |

따라서 **취소 시 Beds24에 알리려면 (1) 생성 시 Beds24 예약 ID 보관, (2) 취소 시 해당 ID로 Beds24 취소/삭제 API 호출**이 필요합니다.

---

## 2. 목표

- 도쿄민박에서 예약이 취소되면(게스트 취소 / 호스트 취소) **Beds24 캘린더에서도 해당 기간이 해제**되도록 한다.
- Beds24 API V2를 사용하며, 기존 `POST /bookings` 전송 로직은 유지한다.

---

## 3. Beds24 API 정리 (참고)

- **POST /bookings**  
  - 요청: 예약 생성 시 `propId`, `roomId`, `arrival`, `departure`, `refererId`(도쿄민박 예약 ID) 등 전송.  
  - 응답: Wiki 기준으로 응답 배열 각 항목에 **New** 필드가 있으며, 여기에 **새로 생성된 예약의 id(bookId)** 가 담긴다.  
  - → 이 **id**를 DB에 저장해야 취소 시 사용 가능.

- **취소 반영 방법 (선택지)**  
  - **DELETE /bookings**  
    - Wiki: "Delete bookings by id."  
    - 예약 ID로 삭제 가능하면, 취소 시 이 엔드포인트 호출로 블록 해제 가능.  
  - **POST /bookings (수정)**  
    - "Create or update bookings."  
    - 기존 예약을 수정할 수 있다면, `id` + `status: "Cancelled"` 등으로 취소 상태로 변경하는 방식도 가능.  
  - 구현 전에 **Beds24 API V2 Swagger** (`https://beds24.com/api/v2/#/`) 에서 실제 응답 스키마와 DELETE/POST 수정 가능 여부를 확인하는 것을 권장.

### 3.1 구현 전 확인 — Swagger(apiV2.yaml) 확인 결과

Beds24 API V2 스펙(`https://beds24.com/api/v2/`, `apiV2.yaml`) 기준으로 확인한 내용입니다.

| 확인 항목 | 결과 |
|-----------|------|
| **POST /bookings 응답 — 새 예약 ID 위치** | 응답은 **배열**. 각 항목 스키마는 `multiplePostResponse`. 새 예약 생성 시 해당 항목에 **`booking`** 객체가 포함되며, **`booking.id`** (integer)가 Beds24 예약 ID. 따라서 **`bookId = response[0].booking.id`** 로 추출. (한 건 생성 시 `res[0].booking?.id`) |
| **예약 취소/삭제 방식** | **DELETE /bookings** 지원. 파라미터: **`id`** (query, array of integer). 호출 예: `DELETE /v2/bookings?id=12345`. **대안**: POST /bookings로 기존 예약 수정 시 body에 `{ "id": 7654321, "status": "cancelled" }` 전송 가능(공식 예제에 동일 예시 있음). |
| **권장** | 취소 시 **DELETE /bookings?id={bookId}** 사용. 단순하고 캘린더 블록 해제에 부합. |

- **bookId 추출(구현 시)**: `POST /bookings` 성공 시 `const first = Array.isArray(data) ? data[0] : null; const bookId = first?.booking?.id;`
- **cancelBeds24Booking(bookId)**: `DELETE ${BEDS24_BASE}/bookings?id=${bookId}` (헤더에 `token` 포함)

---

## 4. DB 변경

- **Booking** 모델에 Beds24 예약 ID 저장용 필드 추가.

| 필드 | 타입 | 설명 |
|------|------|------|
| `beds24BookId` | `String?` | Beds24에서 부여한 예약 ID. `POST /bookings` 성공 시 응답에서 추출해 저장. 없으면 null(미연동·전송 실패 등). |

- 마이그레이션: `ALTER TABLE "Booking" ADD COLUMN "beds24BookId" TEXT;`
- **기존 예약**: 모두 `beds24BookId = null`. 이전에 Beds24로 보낸 예약은 ID를 알 수 없으므로, 취소 시 Beds24 동기화는 하지 않음(도쿄민박만 취소 처리).

---

## 5. 구현 방향

### 5-1. 예약 생성·동기화 시 — Beds24 예약 ID 저장

**대상 코드**

- `src/lib/beds24.ts` — `postBeds24Booking()`
- `src/lib/bookings.ts` — `createBooking()` 내 Beds24 전송 후 처리
- `src/lib/bookings.ts` — `syncBookingToBeds24()` (결제 확정 등에서 호출)

**방향**

1. **`postBeds24Booking()`**
   - `POST /bookings` 응답 본문을 파싱한다.
   - Swagger 기준 응답은 **배열**이며, 새 예약 생성 시 첫 번째 항목에 **`booking.id`** 가 있음. `bookId = Array.isArray(data) ? data[0]?.booking?.id : undefined`
   - 반환값을 `{ ok: boolean; error?: string; bookId?: string | number }` 형태로 확장하여, 성공 시 **bookId**를 함께 반환한다.

2. **호출부에서 DB 저장**  
   - `createBooking()` 안에서 Beds24 전송 후 `result.bookId`가 있으면, 해당 `booking.id`에 대해 `prisma.booking.update({ where: { id: booking.id }, data: { beds24BookId: String(result.bookId) } })` 실행.  
   - `syncBookingToBeds24()`에서도 동일: 전송 성공 시 반환된 `bookId`로 해당 `bookingId`의 `beds24BookId`를 업데이트.  
   - Beds24 전송 실패 또는 `bookId` 미반환 시에는 `beds24BookId`를 넣지 않음(기존처럼 로그만 남기고 진행).

### 5-2. 예약 취소 시 — Beds24에 취소 반영

**대상 코드**

- `src/app/api/bookings/[id]/refund/route.ts` — 게스트 예약 취소
- `src/app/api/host/bookings/[id]/route.ts` — 호스트 예약 거절/취소

**방향**

1. **Beds24 취소 API 래퍼 추가** (`src/lib/beds24.ts`)
   - `cancelBeds24Booking(bookId: string): Promise<{ ok: boolean; error?: string }>`
   - **DELETE /bookings** 사용 (Swagger 확인됨): `DELETE ${BEDS24_BASE}/bookings?id=${bookId}`, 헤더에 `token` 포함.
   - 실패 시 `{ ok: false, error }` 반환, 성공 시 `{ ok: true }`.
   - (대안) POST /bookings로 `[{ id: bookId, status: "cancelled" }]` 전송도 가능하나, DELETE가 단순하므로 DELETE 권장.

2. **취소 API 라우트에서 호출**  
   - **refund (게스트 취소)**  
     - 예약을 조회한 뒤 `booking.beds24BookId`가 있으면, **DB 업데이트 및 환불 처리 전에** `cancelBeds24Booking(booking.beds24BookId)` 호출.  
     - 실패해도 도쿄민박 취소/환불은 진행하고, 로그만 남긴다(`console.error`). (Beds24는 나중에 수동 해제 가능)  
   - **host/bookings/[id] (호스트 거절/취소)**  
     - 동일하게 `booking.beds24BookId`가 있을 때만 `cancelBeds24Booking()` 호출, 실패 시 로그만 하고 도쿄민박 쪽 취소는 정상 처리.

3. **에러 처리**  
   - Beds24 취소/삭제 실패 시 사용자에게는 기존과 동일한 메시지(취소 완료 등)만 보여 주고, Beds24 동기화 실패는 서버 로그로만 처리.  
   - (선택) 관리자용으로 “Beds24 동기화 실패” 플래그나 알림을 두는 것은 별도 요구 시 검토.

---

## 6. 파일별 변경 요약

| 파일 | 변경 내용 |
|------|-----------|
| `prisma/schema.prisma` | `Booking`에 `beds24BookId String?` 추가 |
| `prisma/migrations/...` | `Booking.beds24BookId` 컬럼 추가 마이그레이션 |
| `src/lib/beds24.ts` | `postBeds24Booking()` 응답 파싱 후 `bookId` 반환; `cancelBeds24Booking(bookId)` 추가 |
| `src/lib/bookings.ts` | `createBooking()`·`syncBookingToBeds24()`에서 Beds24 성공 시 `bookId`로 `beds24BookId` 업데이트 |
| `src/app/api/bookings/[id]/refund/route.ts` | 취소 처리 시 `beds24BookId` 있으면 `cancelBeds24Booking()` 호출 |
| `src/app/api/host/bookings/[id]/route.ts` | reject/cancel 시 `beds24BookId` 있으면 `cancelBeds24Booking()` 호출 |

---

## 7. 확인·테스트

1. **POST /bookings 응답**
   - Swagger(apiV2.yaml) 확인 완료 → **3.1** 참고. `response[0].booking.id` 로 bookId 추출.
   - 실제 환경에서 예약 한 건 생성 후 응답 JSON이 위와 일치하는지 한 번 확인 권장.

2. **취소 API**
   - Swagger 확인 완료 → **DELETE /bookings?id={bookId}** 사용. 3.1 참고.

3. **시나리오**  
   - Beds24 연동 숙소에서 예약 생성 → DB에 `beds24BookId` 저장 확인.  
   - 같은 예약을 게스트/호스트 취소 → Beds24 캘린더에서 해당 기간 해제 확인.  
   - Beds24 미연동 숙소 또는 `beds24BookId`가 null인 예약 취소 → 기존처럼 도쿄민박만 취소, Beds24 호출 없음 확인.

---

## 8. 제약·참고

- **기존 예약**  
  - 이미 Beds24로 보낸 예약은 `beds24BookId`가 없으므로, 취소 시 Beds24에는 반영되지 않음.  
  - 필요 시 Beds24 쪽에서 수동으로 블록 해제하거나, Beds24의 `refererId`(도쿄민박 예약 ID)로 조회해 수동 매칭하는 방법만 가능.

- **Beds24 전송 실패**  
  - 생성 시 Beds24 전송이 실패하면 `beds24BookId`는 null로 남음.  
  - 이후 취소 시 Beds24 호출은 하지 않음(호출해도 대상이 없음).

- **동시성**  
  - 같은 예약에 대해 취소가 한 번만 호출된다고 가정.  
  - 중복 호출 시 Beds24가 이미 취소된 예약에 대해 에러를 돌려줄 수 있으므로, 실패 시 로그만 하고 사용자 플로우는 그대로 두는 방식이 안전함.

구현 시 **3.1**의 bookId 추출 경로와 DELETE 호출 방식을 그대로 사용하면 됩니다. 실제 Beds24 환경에서 한 번씩 호출해 보며 응답 형식이 동일한지 확인하면 더 안전합니다.
