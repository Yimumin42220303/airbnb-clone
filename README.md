# Airbnb Clone

Airbnb 스타일 숙박 예약 웹 플랫폼

## 기술 스택

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 18**

## 폴더 구조

```
src/
├── app/              # Next.js App Router (페이지)
│   ├── listing/[id]/ # 숙소 상세
│   └── search/       # 검색 결과
├── components/
│   ├── ui/           # Button, Input, ListingCard
│   ├── layout/       # Header, SearchBar, Footer
│   └── home/         # CategoryScroll
├── lib/
│   ├── design-tokens.ts  # 디자인 시스템 토큰
│   ├── mock-data.ts      # 목업 데이터
│   └── utils.ts          # cn() 등 유틸
└── types/
```

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev
```

### 목업(시드) 데이터 확인

시드로 넣은 숙소·블로그 글·회원 데이터를 화면에서 확인하려면:

```bash
# 시드 실행 후 개발 서버 실행 (한 번에)
npm run dev:mock
```

또는 시드만 실행한 뒤 `npm run dev`로 서버를 띄운 다음, 브라우저에서 **[/mock](http://localhost:3000/mock)** 에 접속하세요.  
홈·검색·블로그·숙소 상세·관리자 등 목업으로 확인할 수 있는 링크가 모여 있습니다.

- DB 데이터 직접 보기: `npm run db:studio`

### 빌드

```bash
npm run build
npm start
```

## 환경 변수

`.env.example` 파일을 참고하여 `.env` 파일을 생성하세요.

### 인증 (OAuth) 설정

**자세한 연동 방법은 [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md)를 참고하세요.**  
구글 / 카카오 / 네이버 로그인을 쓰려면 각 개발자 콘솔에서 앱을 등록하고 Client ID·Secret을 발급한 뒤 `.env`에 넣으세요.

| 서비스 | 콘솔 | 콜백 URL (개발) |
|--------|------|------------------|
| **구글** | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID (웹 애플리케이션) | `http://localhost:3000/api/auth/callback/google` |
| **카카오** | [Kakao Developers](https://developers.kakao.com/console/app) → 앱 → 카카오 로그인 → 웹 → Redirect URI | `http://localhost:3000/api/auth/callback/kakao` |
| **네이버** | [NAVER Developers](https://developers.naver.com/apps) → 애플리케이션 등록 → API 설정 → Callback URL | `http://localhost:3000/api/auth/callback/naver` |

`NEXTAUTH_SECRET`은 터미널에서 `openssl rand -hex 32` 실행 후 나온 값을 넣으면 됩니다.

### 호스트 숙소 등록

1. **로그인** – 상단 **호스팅** 클릭 후, 로그인이 안 되어 있으면 **Google로 로그인** 등으로 로그인합니다.
2. **내 숙소** (`/host/listings`) – 로그인 후 **숙소 등록** 버튼(빨간색)을 누릅니다.
3. **숙소 등록** (`/host/listings/new`) – 숙소명, 위치, 이미지 URL(1개 이상), 1박 요금(원), 최대 인원·침실·침대·욕실 수, 설명을 입력하고 **등록하기**를 누릅니다.
4. 등록이 완료되면 **내 숙소** 목록으로 이동합니다. 여기서 수정·요금·가용성·삭제를 할 수 있습니다.

- 시드 계정: `host@example.com` (OAuth 연동 후 해당 계정으로 로그인하면 호스트로 이용 가능)

### 리뷰 작성 권한

- **숙박 완료한 게스트**: 해당 숙소에 대해 체크아웃이 지난 `confirmed` 예약이 있는 사용자만 리뷰 작성 가능.
- **어드민**: DB에서 `User.role = "admin"`인 사용자는 모든 숙소에 리뷰 작성 가능.  
  시드에 `admin@example.com`(role: admin)이 생성됨. OAuth로 로그인한 계정을 어드민으로 쓰려면 Prisma Studio(`npm run db:studio`)에서 해당 User의 `role`을 `admin`으로 변경하면 됨.

## 개발 로드맵

1. ✅ 프로젝트 셋업
2. ✅ 디자인 시스템 & 공통 컴포넌트
3. ✅ 정적 페이지 (홈, 검색, 상세)
4. ✅ 데이터베이스 & API
5. ✅ 검색/필터, 예약 기능
6. ✅ 인증 (구글/카카오/네이버 로그인)
7. ✅ 리뷰 (숙박 완료·어드민만 작성)
8. ✅ 내 예약 목록, 호스트(내 숙소·등록·수정·삭제), 결제 플로우

수정·UI 개선(도쿄민박 스타일 등)은 필요 시 추후 진행하면 됩니다.

## 유지보수

- **정기 점검·백업·의존성 업데이트**: [docs/유지보수-가이드.md](docs/유지보수-가이드.md) 참고.
- **배포 전 확인**: `npm run check` (lint + build 한 번에 실행).
- **DB 관리**: [docs/DB-관리-가이드.md](docs/DB-관리-가이드.md).
