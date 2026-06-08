# Airbnb 숙소를 도쿄민박으로 가져오기

Airbnb에 등록된 숙소(사진, 설명 포함)를 도쿄민박에 등록하는 방법 정리입니다.

---

## 1. 가능한 방법 요약

| 방법 | 원클릭에 가까움 | 난이도 | 비고 |
|------|-----------------|--------|------|
| **A. Airbnb 개인 데이터 내보내기 → 파일 업로드** | 파일 1번 업로드 | 중 | 규정 준수, 당장 구현 가능 |
| **B. Airbnb 공식 Homes API 연동** | OAuth 후 한 번에 동기화 | 높음 | 파트너 승인 필요, 진짜 원클릭에 가까움 |

---

## 2. 방법 A: 개인 데이터 내보내기 파일로 가져오기 (권장)

Airbnb는 **개인 데이터 내보내기**를 지원합니다. 호스트가 요청하면 **JSON** 형식으로 받을 수 있고, 그 안에 **숙소 정보(Listings)**와 **images/listings** 폴더에 **숙소 사진**이 포함됩니다.

### 호스트가 할 일

1. [Airbnb 계정 → 개인정보 및 공유](https://www.airbnb.com/account-settings/privacy-and-sharing) 이동
2. **"내 데이터 요청"** 선택
3. 형식에서 **JSON** 선택 후 요청
4. 이메일로 받은 다운로드 링크에서 **ZIP 파일** 다운로드
5. 도쿄민박 호스트 대시보드에서 **「Airbnb에서 가져오기」** 메뉴로 들어가 **해당 ZIP 파일 업로드**

### 도쿄민박에서 구현할 내용

- **API**: `POST /api/listings/import-from-airbnb` (또는 `/api/listings/airbnb-import`)
  - `multipart/form-data`로 ZIP 파일 수신
  - ZIP 해제 후:
    - `JSON/` 폴더 안의 **listings 관련 JSON** 파싱 (파일명은 Airbnb 문서/실제 내보내기로 확인)
    - `images/listings/` 폴더의 사진 파일과 매칭 (JSON에 이미지 식별자/경로가 있을 가능성 있음)
  - 각 숙소에 대해:
    - 제목, 위치, 설명, 가격 등 → `CreateListingInput` 형태로 매핑
    - 사진: 업로드된 ZIP 내 이미지 파일을 **우리 스토리지(Vercel Blob, S3 등)에 업로드**한 뒤 URL 사용하거나, 당장은 ZIP 내 상대 경로를 서버에서 호스팅 가능한 URL로 서빙하는 방식은 권장하지 않음 → **스토리지 업로드 후 URL** 저장
  - `createListing(sessionUserId, input)` 호출로 숙소 생성 (이미지 URL은 `imageUrls` 배열로 전달)

- **UI**: 호스트 숙소 목록 또는 「숙소 등록」 페이지에 **「Airbnb에서 가져오기」** 버튼 → ZIP 선택 → 업로드 → 결과(성공/실패, 생성된 숙소 수) 표시

### 참고

- Airbnb 내보내기 ZIP 구조(공식 도움말 기준):
  - `readme.JSON`, `JSON/` (카테고리별 JSON), `attachments/`, `images/listings/` 등
- **Listings** 카테고리: "A summary of all of your current and past listings, including all of the images and personal information you've shared with Airbnb about them."
- JSON 내부 필드명/구조는 **실제 내보내기 파일 1개**를 받아서 확인한 뒤 매핑하는 것이 안전합니다. (문서에 필드별 스펙이 공개되어 있지 않음)

---

## 3. 방법 B: Airbnb 공식 Homes API (진짜 원클릭에 가까움)

Airbnb **Homes API**는 파트너/호스트가 자신의 리스팅을 **프로그램으로 관리**할 수 있게 합니다.  
- 리스팅 생성/수정, 설명·편의시설·사진, 가격·예약 가능일, 예약·메시지·리뷰 등

### 전제 조건

- [Airbnb API 파트너 포털](https://www.airbnb.com/partner)에서 **파트너 신청** 후 승인
- 승인 후 OAuth로 호스트가 **Airbnb 로그인** → 우리 앱이 **엑세스 토큰**으로 API 호출

### 흐름 (구현 시)

1. 호스트가 도쿄민박에서 **「Airbnb로 연결」** 클릭
2. Airbnb OAuth 로그인 → 콜백으로 토큰 저장
3. 우리 백엔드에서 Homes API로:
   - 호스트의 리스팅 목록 조회
   - 각 리스팅 상세(제목, 설명, 사진 URL, 가격, 인원 등) 조회
4. 도쿄민박 DB에 `createListing`로 생성  
   - **사진**: API가 준 URL을 그대로 `imageUrl`/`imageUrls`에 넣을 수 있는지 Airbnb 이용약관/API 정책 확인 필요. 외부 hotlink 금지면 우리 스토리지로 다운로드 후 업로드하는 단계 필요

이렇게 하면 **「Airbnb 연결 한 번 + 동기화 한 번」**으로 여러 숙소를 한꺼번에 가져오는 **원클릭에 가까운 경험**을 만들 수 있습니다. 다만 파트너 승인과 API 개발 비용이 있습니다.

---

## 4. 권장 순서

1. **단기**: **방법 A(개인 데이터 ZIP 업로드)**  
   - 호스트가 Airbnb에서 JSON 내보내기 받아서 ZIP 업로드 → 파싱 후 도쿄민박에 등록.  
   - 규정 준수하고, 별도 승인 없이 구현 가능.
2. **중장기**: **방법 B(Homes API)**  
   - 파트너 승인 후 OAuth + API로 동기화하면 진짜 원클릭에 가까운 UX 가능.

---

## 5. 도쿄민박 쪽 기존 구조와의 연결

- 숙소 생성: `src/lib/listings.ts`의 `createListing(userId, CreateListingInput)` 사용.
- `CreateListingInput`에 `title`, `location`, `description`, `pricePerNight`, `imageUrl`/`imageUrls`, `maxGuests`, `cleaningFee` 등 이미 있음.
- 다중 사진은 `imageUrls` 배열로 넘기면 `ListingImage`까지 생성됨.
- Airbnb 데이터에서 **편의시설(amenities)**·**카테고리**는 JSON 필드를 우리 `Amenity`/`ListingCategory`와 매핑하면 되고, 매핑 불가한 항목은 생략하거나 기본값 처리하면 됨.

이 문서를 기준으로 **방법 A**부터 API·UI 스펙을 잡고, 실제 Airbnb JSON 샘플을 하나 확보한 뒤 필드 매핑을 고정하는 순서로 구현하면 됩니다.
