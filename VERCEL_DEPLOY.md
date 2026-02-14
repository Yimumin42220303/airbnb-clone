# Vercel 배포 가이드

도쿄민박 프로젝트를 Vercel에 배포하는 방법입니다.

## 사전 준비

### 1. PostgreSQL 데이터베이스 (필수)

Vercel은 서버리스 환경이라 SQLite를 지원하지 않습니다. **PostgreSQL**이 필요합니다.

**추천 (무료 티어):**

- **[Neon](https://neon.tech)** – 가입 후 프로젝트 생성 → Connection string 복사
- **[Supabase](https://supabase.com)** – Project Settings → Database → Connection string 복사

### 2. GitHub 저장소

코드를 GitHub 저장소에 푸시해 두세요.

---

## 배포 단계

### 1. Vercel 프로젝트 연결

1. [vercel.com](https://vercel.com) 접속 후 로그인
2. **Add New** → **Project**
3. GitHub 저장소 선택 후 **Import**

### 2. 환경 변수 설정

**Settings** → **Environment Variables**에서 다음 변수를 추가하세요.

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://user:pass@host/db?sslmode=require` |
| `DIRECT_URL` | 마이그레이션용 직접 연결 (Supabase/Neon) | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32`로 생성 | 64자 랜덤 문자열 |
| `NEXTAUTH_URL` | 배포 URL | `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | (선택) Google 로그인 | |
| `GOOGLE_CLIENT_SECRET` | (선택) Google 로그인 | |
| `KAKAO_CLIENT_ID` | (선택) 카카오 로그인 | |
| `KAKAO_CLIENT_SECRET` | (선택) 카카오 로그인 | |
| `RESEND_API_KEY` | (선택) 이메일 발송 - 회원가입 인증 메일 | [resend.com](https://resend.com) API 키 |
| `EMAIL_FROM` | (선택) 발신 이메일 주소 | `도쿄민박 <onboarding@resend.dev>` |

**이메일 회원가입 사용 시:** `RESEND_API_KEY` 필수. 상세 설정은 [docs/RESEND_SETUP.md](docs/RESEND_SETUP.md) 참고.

**Neon 사용 시:** `DIRECT_URL`은 `DATABASE_URL`과 동일하게 설정해도 됩니다.

**Supabase 사용 시:** Pooler URL을 `DATABASE_URL`, Direct URL을 `DIRECT_URL`로 설정하세요.

### 3. OAuth 리디렉션 URI 등록

Google/카카오 로그인 사용 시, OAuth 앱에 다음 URI를 추가하세요.

```
https://your-app.vercel.app/api/auth/callback/google
https://your-app.vercel.app/api/auth/callback/kakao
```

### 4. DB 스키마 생성 및 시드 (첫 배포 전)

PostgreSQL이 비어 있는 상태라면, 로컬에서 한 번 실행하세요.

```bash
# .env에 DATABASE_URL, DIRECT_URL 설정 후
npx prisma db push
npm run db:seed
```

`db push`는 마이그레이션 없이 스키마를 DB에 반영합니다. 이후 배포 시 별도 DB 작업은 필요 없습니다.

---

## 로컬 개발 (PostgreSQL)

배포용으로 PostgreSQL을 사용하므로, 로컬에서도 PostgreSQL을 사용하는 것이 좋습니다.

1. Neon 또는 Supabase에서 무료 DB 생성
2. `.env`에 `DATABASE_URL`, `DIRECT_URL` 설정
3. `npx prisma migrate deploy` 실행
4. `npm run db:seed` 실행
5. `npm run dev`로 개발 서버 실행

---

## 문제 해결

### 빌드 실패: "DATABASE_URL is not defined"

Vercel 환경 변수에 `DATABASE_URL`이 설정되어 있는지 확인하세요.

### Prisma Client 오류

`postinstall` 스크립트로 `prisma generate`가 실행됩니다. 빌드 로그에서 실행 여부를 확인하세요.

### 마이그레이션 미적용

로컬에서 `npx prisma migrate deploy`를 실행한 뒤, Vercel에서 다시 배포하세요.
