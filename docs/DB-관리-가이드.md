# 숙소·호스트 DB 관리 가이드

숙소 정보, 호스트, 예약 등 DB를 관리하는 방법입니다.

---

## 1. 호스트용 웹 화면 (일반 호스트)

로그인 후 아래 주소에서 **본인이 등록한 숙소만** 관리할 수 있습니다.

| 주소 | 설명 |
|------|------|
| **/host/listings** | 내 숙소 목록 (등록·수정·삭제 링크) |
| **/host/listings/new** | 숙소 새로 등록 (로그인 없이도 접근 가능하도록 설정 가능) |
| **/host/listings/[숙소ID]/edit** | 숙소 정보 수정 (제목, 위치, 요금, 이미지, 편의시설 등) |
| **/host/listings/[숙소ID]/availability** | 예약 가능일·요금 설정 (캘린더) |
| **/host/calendar** | 예약 현황 캘린더 |
| **/host/bookings** | 내 숙소 예약 목록 |
| **/host/revenue** | 매출 요약 |

- **권한**: 해당 숙소의 소유자(userId)로 로그인한 경우에만 수정 가능  
- 개발 시 `DEV_SKIP_AUTH=1` 이면 로그인 없이 페이지 접근 가능 (이미 적용됨)

---

## 2. 관리자(Admin) 웹 화면

**admin** 권한이 있는 계정으로 로그인하면, 전체 데이터를 조회·이동할 수 있습니다.

| 주소 | 설명 |
|------|------|
| **/admin** | 대시보드 (회원 수, 숙소 수, 예약 수, 최근 목록) |
| **/admin/listings** | 전체 숙소 목록 (보기·수정 링크) |
| **/admin/users** | 전체 회원 목록 |
| **/admin/bookings** | 전체 예약 목록 |
| **/admin/blog** | 블로그 글 목록·작성·수정 |

- **Admin 계정**: DB에 `role: "admin"` 인 사용자. 시드에서는 `admin@example.com`  
- 개발 시 `DEV_SKIP_AUTH=1` 이면 로그인 없이도 admin 페이지 접근 가능 (목업 admin 사용)

---

## 3. DB 직접 보기·수정 (Prisma Studio)

테이블 단위로 데이터를 보고 수정하려면 **Prisma Studio**를 사용합니다.

```bash
npm run db:studio
```

브라우저가 열리면 (기본 `http://localhost:5555`) 다음을 할 수 있습니다.

- **User** · **Listing** · **Booking** · **ListingImage** · **ListingAvailability** · **Amenity** 등 테이블 조회
- 행 추가·수정·삭제
- 관계(호스트–숙소, 숙소–예약 등) 확인

`.env`의 `DATABASE_URL`이 가리키는 DB가 그대로 사용됩니다 (로컬 SQLite 또는 Supabase PostgreSQL).

---

## 4. 스키마 변경·마이그레이션

DB 구조(테이블·컬럼)를 바꾸려면 Prisma 스키마를 수정한 뒤 마이그레이션을 적용합니다.

1. **스키마 수정**  
   `prisma/schema.prisma` 에서 모델·필드 추가·삭제·타입 변경

2. **마이그레이션 생성 및 적용**  
   ```bash
   npm run db:migrate
   ```  
   마이그레이션 이름을 물어보면 적당한 이름 입력 (예: `add_listing_amenity`)

3. **클라이언트 재생성**  
   마이그레이션 시 보통 자동으로 실행되며, 필요하면:  
   ```bash
   npm run db:generate
   ```

- **SQLite** 사용 시: `db:migrate` 가 로컬에 마이그레이션 파일과 DB를 갱신  
- **Supabase(PostgreSQL)** 사용 시: 같은 명령으로 원격 DB에 반영 (연결 설정은 `.env`의 `DATABASE_URL`)

**배포 환경 DB에 스키마만 반영할 때** (마이그레이션 없이 `schema.prisma`만 수정한 경우):  
해당 환경의 `DATABASE_URL`로 `npx prisma db push`를 실행하면 컬럼 추가 등이 반영됩니다. (예: 숙소 타입 `propertyType` 추가 후 프로덕션 DB에 적용)

---

## 5. 시드 데이터 (초기 데이터 넣기)

| 명령 | 설명 |
|------|------|
| `npm run db:seed` | 전체 시드 (호스트/게스트/관리자 계정, 숙소 6개, 편의시설, 블로그 2편, 리뷰 등) |
| `node prisma/seed-one-user.js` | 사용자 1명만 추가 (`dev@example.com` · 개발용) |

시드는 `package.json`의 `"prisma": { "seed": "node prisma/seed.js" }` 에 정의되어 있으며,  
`npx prisma db seed` 또는 `npm run db:seed` 로 실행됩니다.

---

## 6. 리뷰 게시일 일괄 재설정 (전체 숙소 / 프로덕션)

리뷰의 **게시일(createdAt)** 을 2023-12-01 ~ 2026-02-28 범위 안에서 무작위로 재설정할 때 사용합니다.  
표시 순서는 **게시일 최신순**(이미 앱에서 적용됨)입니다.

| 명령 | 설명 |
|------|------|
| `npm run db:randomize-review-dates` | **전체 숙소**의 모든 리뷰 게시일 재설정 |
| `node scripts/randomize-review-dates.js <숙소ID>` | 해당 숙소 리뷰만 재설정 |

**로컬 DB에 적용**  
`.env`의 `DATABASE_URL`이 가리키는 DB가 대상입니다.

```bash
npm run db:randomize-review-dates
```

**도쿄민박 실제 서버(프로덕션) DB에 적용**  
프로덕션용 `DATABASE_URL`을 넣고 같은 스크립트를 실행합니다.

```bash
# 방법 1: 환경 변수로 프로덕션 URL 지정 후 실행
DATABASE_URL="postgresql://사용자:비밀번호@호스트:포트/DB명?schema=public" node scripts/randomize-review-dates.js

# 방법 2: .env.production 등에 DATABASE_URL을 프로덕션으로 두고 로드 후 실행
# (dotenv 등으로 로드하거나, 터미널에서 export DATABASE_URL=... 후)
npm run db:randomize-review-dates
```

- Supabase/프로덕션 PostgreSQL URL은 Vercel 환경 변수 또는 Supabase 대시보드에서 확인할 수 있습니다.
- 실행 시 **해당 DB의 모든 리뷰**가 위 기간 내 무작위 날짜로 변경됩니다.

---

## 7. 요약

- **일반 호스트**: `/host/listings` 계열에서 본인 숙소만 등록·수정·예약가능일 관리  
- **전체 운영/관리**: admin 계정으로 `/admin` → 숙소·회원·예약·블로그 조회·이동  
- **직접 DB 조작**: `npm run db:studio` 로 테이블 단위 조회·수정  
- **구조 변경**: `prisma/schema.prisma` 수정 후 `npm run db:migrate`  
- **초기/테스트 데이터**: `npm run db:seed` 또는 `node prisma/seed-one-user.js`  
- **리뷰 게시일 재설정**: `npm run db:randomize-review-dates` (프로덕션 적용 시 `DATABASE_URL`만 프로덕션으로 설정 후 동일 명령)

DB 연결 정보는 `.env`의 `DATABASE_URL`(및 필요 시 `DIRECT_URL`)에서 관리합니다.
