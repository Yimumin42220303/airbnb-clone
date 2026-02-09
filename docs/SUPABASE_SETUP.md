# Supabase DB 연동 가이드

이 프로젝트는 **Supabase(PostgreSQL)** 를 데이터베이스로 사용할 수 있도록 구성되어 있습니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 로그인 후 **New Project** 생성
2. Organization, 프로젝트 이름, DB 비밀번호 설정 후 생성 완료까지 대기

## 2. 연결 정보 확인

1. Supabase 대시보드에서 해당 프로젝트 선택
2. **Project Settings** (왼쪽 하단 톱니바퀴) → **Database**
3. **Connection string** 섹션에서:
   - **URI** 탭 선택
   - **Transaction** (Pooler) — 앱 런타임용 → `DATABASE_URL` 에 사용
   - **Session** (Direct) — 마이그레이션용 → `DIRECT_URL` 에 사용

## 3. .env 설정

프로젝트 루트의 `.env` 파일에 다음을 추가·수정합니다.

```env
# Supabase Transaction mode (Pooler) - 포트 6543
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase Session mode (Direct) - 포트 5432, 마이그레이션용
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].supabase.co:5432/postgres"
```

- `[PROJECT-REF]`: Database 설정 화면의 **Reference ID**
- `[YOUR-PASSWORD]`: 프로젝트 생성 시 설정한 DB 비밀번호
- `[REGION]`: 리전 코드 (예: ap-northeast-2)

Connection string을 **Copy** 한 뒤, 비밀번호 부분만 실제 값으로 바꿔도 됩니다.

## 4. 스키마 적용 (Supabase 최초 1회)

기존 마이그레이션은 SQLite 기준이라 PostgreSQL에서는 **그대로 실행할 수 없습니다**. Supabase 빈 DB에는 아래 중 하나로 스키마를 넣습니다.

### 방법 A: db push (간단, 추천)

현재 `schema.prisma` 기준으로 테이블을 바로 만듭니다. 마이그레이션 이력은 쌓이지 않습니다.

```bash
npx prisma db push
```

### 방법 B: PostgreSQL용 마이그레이션 새로 만들기

마이그레이션 이력을 쓰고 싶다면, 기존 `prisma/migrations` 폴더를 비우고 PostgreSQL용으로 다시 만듭니다.

1. `prisma/migrations` 폴더 안의 마이그레이션 폴더만 삭제 (또는 상위 폴더 이름 변경 후 새로 생성)
2. 다음 실행:

```bash
npx prisma migrate dev --name init
```

생성된 마이그레이션으로 Supabase에 테이블이 만들어지고, 이후에는 `npx prisma migrate deploy`로 배포할 수 있습니다.

## 5. 시드 데이터 (선택)

초기 유저·숙소 등 시드가 필요하면:

```bash
npx prisma db seed
```

`package.json` 의 `prisma.seed` 스크립트와 `prisma/seed.ts`(또는 .js) 가 설정되어 있어야 합니다.

## 6. Prisma Client 재생성

스키마나 env 변경 후:

```bash
npx prisma generate
```

## 참고

- **DATABASE_URL**: 서버리스/앱에서 사용. Connection pooler(6543) 사용 권장.
- **DIRECT_URL**: `prisma migrate` 등 마이그레이션 시 직접 연결(5432)에 사용.
- Supabase 대시보드 → **Table Editor**에서 데이터 확인 가능.
- 기존 SQLite(`file:./dev.db`)에서 개발하던 경우, PostgreSQL로 바꾼 뒤에는 마이그레이션을 새로 적용해야 하며, 데이터는 별도 이관이 필요합니다.
