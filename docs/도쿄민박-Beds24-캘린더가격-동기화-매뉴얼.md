# 도쿄민박 ↔ Beds24 캘린더 및 가격 동기화 매뉴얼

도쿄민박과 Beds24를 연동하여 **캘린더(예약 가능 여부)**를 양방향으로 동기화하는 방법입니다.  
중복 예약을 방지하고, Airbnb·Booking.com 등 Beds24에 연결된 채널과 함께 안정적으로 운영할 수 있습니다.

---

## 1. 동기화 범위

| 구분 | 내용 | 비고 |
|------|------|------|
| **캘린더(공실)** | 도쿄민박 예약 ↔ Beds24 예약 | 양방향 동기화 |
| **가격** | 별도 관리 | 도쿄민박 가격, Beds24(OTA) 가격은 각각 설정 필요 |

- **캘린더**: 도쿄민박에서 예약이 들어오면 Beds24에 반영되고, Beds24(또는 Airbnb 등)에서 예약이 들어오면 도쿄민박에서 해당 기간은 예약 불가로 표시됩니다.
- **가격**: iCal/API는 가격 정보를 전달하지 않습니다. 도쿄민박 가격은 도쿄민박 숙소 편집에서, Beds24 가격은 Beds24 관리 화면에서 각각 설정합니다.  
  도쿄민박 가격을 Airbnb보다 3% 낮게 두려면 Beds24에서 **価格のリンク**의 **オフセット率**을 `-3`으로 설정하세요.

---

## 2. 연동 방식 선택

연동 방식은 두 가지가 있습니다. 숙소 상황에 맞게 선택하세요.

| 방식 | 적합한 경우 | 특징 |
|------|-------------|------|
| **iCal만** | Beds24 iCal 사용, 설정 단순 | Export URL + Import URL만 설정 |
| **Beds24 API** | Beds24와 직접 연동, 빠른 반영 | Prop ID·Room ID + 환경변수 필요 |

---

## 3. 시나리오 A: iCal만 사용하는 경우

Beds24 iCal Export/Import를 사용하는 방법입니다. 설정이 단순합니다.

### 3-1. 도쿄민박 예약을 Beds24에 반영하기 (Export)

1. 도쿄민박 로그인 → **숙소 수정** → **캘린더 연동**
2. **1단계 — Export** 아래 URL 복사  
   예: `https://tokyominbak.net/api/listings/[숙소ID]/calendar.ics`
3. Beds24 로그인
4. **プロパティ** → 해당 숙소 → **カレンダー** → **カレンダー取り込み (iCal Import)**
5. 복사한 URL을 추가하고 저장

→ 도쿄민박에서 예약이 확정되면 Beds24에 반영되고, Beds24에 연결된 Airbnb·Booking.com 등에도 공실이 업데이트됩니다.

### 3-2. Beds24 예약을 도쿄민박에 반영하기 (Import)

1. Beds24 로그인
2. **プロパティ** → 해당 숙소 → **カレンダー** → **カレンダーエクスポート (iCal Export)**
3. 표시된 **Export URL** 복사
4. 도쿄민박 **숙소 수정** → **캘린더 연동** → **2단계 — Import** 입력란
5. 한 줄에 URL 하나씩 입력 (Beds24 Export URL, 필요 시 Airbnb iCal URL 등 추가)
6. **저장** 버튼 클릭
7. (선택) **저장 후 새로고침** 버튼으로 캐시 즉시 갱신

→ Beds24·Airbnb·Booking.com 등에서 예약이 들어오면 도쿄민박 해당 기간이 예약 불가로 표시됩니다.

### 3-3. 주의사항 (iCal)

- **Airbnb iCal**: Airbnb 예약만 포함합니다. Booking.com 등 외부 예약이 Airbnb에 연결돼 있어도, 도쿄민박에 반영하려면 Booking.com iCal URL을 별도로 Import에 추가하세요.
- **반영 지연**: 최대 약 15분 정도 지연될 수 있습니다.
- **저장 필수**: Import URL을 입력한 뒤 반드시 **저장**을 눌러야 합니다.

---

## 4. 시나리오 B: Beds24 API를 사용하는 경우

Beds24 API로 직접 연동하는 방법입니다. 반영 속도가 빠르고 iCal보다 안정적입니다.

### 4-1. 사전 준비

- Beds24에서 **Prop ID**, **Room ID** 확인  
  (Beds24 관리 화면 → 프로퍼티·룸 설정)
- 서버(Vercel) 환경변수 **BEDS24_REFRESH_TOKEN** 설정  
  (Beds24 계정 → API 토큰 발급)

### 4-2. 도쿄민박 설정

1. 도쿄민박 로그인 → **숙소 수정** → **캘린더 연동**
2. **연동 방식**에서 **Beds24 API (Beds24와 직접 연동)** 선택
3. **1단계 — Export**: URL이 표시되면 그대로 두기 (Beds24 iCal Import에 등록용)
4. **Beds24 API 설정**
   - **Prop ID**: Beds24 프로퍼티 ID 입력
   - **Room ID**: Beds24 룸 ID 입력
5. **2단계 — Import**: Airbnb·Booking.com 등 Beds24 외 채널의 iCal URL 입력  
   (Beds24 예약은 API로 자동 반영되므로 Beds24 Export URL은 불필요)
6. **저장** 클릭

### 4-3. Export URL 등록 (Beds24)

도쿄민박 예약을 Beds24에 보내려면:

1. 도쿄민박 **캘린더 연동**에서 Export URL 복사
2. Beds24 → **プロパティ** → 해당 숙소 → **カレンダー取り込み**
3. URL 등록 후 저장

### 4-4. 예약 자동 전송

Beds24 API 연동이 설정된 숙소에서 도쿄민박 예약이 확정되면, 해당 예약이 자동으로 Beds24에 전송되어 Beds24·Airbnb 등에서 해당 기간이 블록됩니다.

---

## 5. 가격 설정 (도쿄민박 vs Airbnb 3% 할인)

캘린더 동기화와 별도로, **가격**은 각 플랫폼에서 따로 설정합니다.

### 5-1. 도쿄민박 가격

- 도쿄민박 **숙소 수정** → **料金·収容人数** 에서 1박 가격 등 설정

### 5-2. Beds24에서 도쿄민박 가격을 Airbnb보다 3% 낮게 설정

1. Beds24 → **価格** → **日別料金詳細設定**
2. 해당 숙소·룸 선택 후 **tokyominbak** (도쿄민박용) 일별 요금 선택
3. **価格のリンク** 섹션:
   - **リンク元の部屋タイプ**: `日別料金 1: AirBnB` (또는 기준이 되는 가격) 선택
   - **オフセット率**: `-3` 입력 (3% 할인)
4. **セーブ** 클릭

→ Beds24 예약 페이지(도쿄민박 연동)에는 Airbnb 기준 대비 3% 낮은 가격이 적용됩니다.

---

## 6. 트러블슈팅

| 증상 | 확인 사항 | 해결 |
|------|-----------|------|
| 도쿄민박 예약이 Beds24에 안 보임 | Export URL이 Beds24에 등록됐는지 | Beds24 カレンダー取り込み에 URL 재등록 |
| Beds24 예약이 도쿄민박에서 막히지 않음 | Import URL 저장 여부 | Import URL 입력 후 반드시 **저장** |
| API 연동 시 블록이 안 됨 | Prop ID·Room ID·BEDS24_REFRESH_TOKEN | 값 확인, **연동 테스트(디버그)** 링크로 점검 |
| 신규 호스트 숙소가 다른 토큰을 써야 할 때 | 호스트 전용 Beds24 계정인지 | **8. 멀티 계정 (호스트별 Beds24 계정)** 섹션 참고 |
| 날짜가 하루 어긋남 | 타임존 | Beds24·도쿄민박 모두 JST 기준 확인 |

### 연동 테스트 (Beds24 API)

Beds24 API를 사용 중이라면:

1. 도쿄민박 **숙소 수정** → **캘린더 연동** → **연동 테스트 (디버그)** 링크 클릭
2. 응답 내용으로 Prop ID·Room ID·토큰 설정이 올바른지 확인

---

## 7. 참고 링크

- [Beds24 連携手順 (일본어)](./Beds24-連携手順.md)
- [OTA 중복예약방지 iCal 설계](./OTA-중복예약방지-iCal-설계.md)
- [환경변수 목록](./환경변수-목록.md) — BEDS24_REFRESH_TOKEN / BEDS24_REFRESH_TOKEN_{KEY}

---

## 8. 멀티 계정 (호스트별 Beds24 계정)

호스트가 각자의 Beds24 계정을 소유하고, 마스터 계정으로 공유(Account Access)가 불가능한 경우 사용합니다.
기존 공용 토큰(`BEDS24_REFRESH_TOKEN`) 방식과 **완전히 호환**되며, 기존 숙소는 아무 조작 없이 기존대로 동작합니다.

### 동작 원리

- 숙소의 `beds24AccountKey` (관리자 전용 필드) 가 비어 있으면 공용 `BEDS24_REFRESH_TOKEN` 사용 (기존 숙소 동작 유지)
- 값이 `HOST_TANAKA` 면 Vercel env 의 `BEDS24_REFRESH_TOKEN_HOST_TANAKA` 사용
- 해당 env 가 없으면 자동으로 공용 `BEDS24_REFRESH_TOKEN` 으로 fallback
- (선택) 호스트가 많아지면 `BEDS24_REFRESH_TOKENS_JSON` 한 env 에 JSON 번들로 묶을 수 있음

### 신규 호스트 계정 등록 절차

1. **호스트 쪽 (Beds24)**
   - Beds24 로그인 → `Settings > Apps & Integrations > API (V2)` → `Generate Invite Code`
   - Scope: `read:bookings, write:bookings, read:inventory, write:inventory, read:properties`
   - Property Access: **All owned** 권장 (추후 숙소 추가 시 토큰 재발급 불필요)
   - Invite Code 는 수 분 내 만료 → 즉시 운영자에게 전달

2. **운영자 쪽 (Refresh Token 발급)**

```bash
curl -X GET "https://beds24.com/api/v2/authentication/setup" \
  -H "code: {INVITE_CODE}" \
  -H "deviceName: tokyominbak-{HOSTNAME}"
```

응답의 `refreshToken` 을 복사 (JSON 이스케이프 `\/` → `/` 로 치환).

3. **운영자 쪽 (Vercel env 등록)**

Vercel 대시보드 → `Settings > Environment Variables`:

```
KEY:   BEDS24_REFRESH_TOKEN_HOST_TANAKA   (대문자/숫자/밑줄만)
VALUE: (위에서 발급받은 refreshToken)
ENV:   Production, Preview 모두 체크
```

이후 `npm run deploy:cli` 또는 Vercel 대시보드에서 **재배포** 1회 필수.

4. **운영자 쪽 (숙소 편집)**
   - `/host/listings/{id}/edit` 접속 (관리자 계정)
   - Beds24 섹션에서 Prop ID / Room ID 입력
   - **Beds24 Account Key (관리자 전용)** 필드에 `HOST_TANAKA` 입력 → 저장
   - 저장 후 같은 화면의 **「연동 테스트(디버그)」** 링크 클릭
   - 응답의 `hasTokenForAccount: true`, `availabilityStatus: 200`, `blockedCount >= 0` 확인

### 디버그 응답 필드 (멀티 계정 관련)

| 필드 | 의미 |
|------|------|
| `accountKey` | 해당 숙소에 지정된 Account Key (없으면 `null`) |
| `tokenEnvName` | 실제 사용되는 env 키 이름 (예: `BEDS24_REFRESH_TOKEN_HOST_TANAKA`) |
| `hasTokenForAccount` | 해당 env 키가 Vercel/로컬에 세팅돼 있는지 (`true/false/null`) |
| `usingFallbackToken` | 공용 `BEDS24_REFRESH_TOKEN` 으로 fallback 중인지 |
| `hasToken` | 최종적으로 어떤 토큰이든 사용 가능한 상태인지 |

### 케이스별 동작 요약

| 케이스 | Account Key | env 상태 | 실제 사용 토큰 |
|--------|-------------|----------|---------------|
| 기존 숙소 (변경 없음) | `null` | 공용 토큰만 설정 | `BEDS24_REFRESH_TOKEN` |
| 신규 호스트, env 설정 완료 | `HOST_X` | `BEDS24_REFRESH_TOKEN_HOST_X` 존재 | `BEDS24_REFRESH_TOKEN_HOST_X` |
| Account Key 입력했지만 env 누락 | `HOST_X` | env 없음 | `BEDS24_REFRESH_TOKEN` (자동 fallback) |

> **주의**: env 신규 추가 시 **반드시 재배포** 후에만 반영됩니다. Vercel 대시보드에서 env 추가만 해도 기존 배포에는 적용되지 않습니다.
