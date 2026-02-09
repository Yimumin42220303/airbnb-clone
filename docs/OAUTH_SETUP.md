# 구글·카카오·네이버 로그인 연동 가이드

이 문서는 airbnb-clone 프로젝트에서 **구글**, **카카오**, **네이버** 소셜 로그인을 사용하기 위해 각 개발자 콘솔에서 해야 할 설정을 단계별로 정리한 것입니다.

---

## 구글 로그인 체크리스트 (먼저 확인)

구글 로그인만 쓸 때 아래를 순서대로 확인하세요.

1. **`.env` 파일**
   - `NEXTAUTH_SECRET` 있음 (없으면 터미널에서 `openssl rand -hex 32` 실행 후 값 넣기)
   - `NEXTAUTH_URL="http://localhost:3000"` (포트 다르면 해당 포트로)
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 둘 다 Google Cloud Console에서 복사해 넣기
2. **Google Cloud Console**
   - OAuth 동의 화면 설정 완료 (외부 사용자, 앱 이름·이메일)
   - 사용자 인증 정보 → OAuth 2.0 클라이언트 ID (웹 애플리케이션)
   - **승인된 리디렉션 URI**에 `http://localhost:3000/api/auth/callback/google` **정확히** 등록
3. **서버 재시작**
   - `.env` 수정 후 반드시 `npm run dev` 다시 실행
4. **동작 확인**
   - 브라우저에서 `/auth/signin` 접속 → "Google로 로그인" 버튼 클릭 → 구글 로그인 후 앱으로 복귀

버튼이 안 보이거나 "구글 로그인이 설정되지 않았습니다" 문구가 보이면 1번·3번을, "Redirect URI mismatch"가 나오면 2번 리디렉션 URI를 다시 확인하세요.

---

## 공통: 콜백 URL 정리

NextAuth가 로그인 후 돌아올 주소는 아래와 같습니다. **각 사이트에 반드시 이 주소를 등록**해야 합니다.

| 서비스 | 콜백 URL (로컬 개발) | 콜백 URL (배포 시 예시) |
|--------|----------------------|--------------------------|
| 구글 | `http://localhost:3000/api/auth/callback/google` | `https://당신도메인.com/api/auth/callback/google` |
| 카카오 | `http://localhost:3000/api/auth/callback/kakao` | `https://당신도메인.com/api/auth/callback/kakao` |
| 네이버 | `http://localhost:3000/api/auth/callback/naver` | `https://당신도메인.com/api/auth/callback/naver` |

> 포트가 3001이면 `localhost:3001`로, 배포 시에는 실제 도메인으로 바꿉니다.

---

## 1. 구글 (Google) 연동

### 1-1. Google Cloud 프로젝트 만들기

1. **Google Cloud Console** 접속  
   - https://console.cloud.google.com/
2. 상단 프로젝트 선택 → **새 프로젝트** 클릭
3. 프로젝트 이름 입력 (예: `airbnb-clone`) → **만들기**

### 1-2. OAuth 동의 화면 설정

1. 왼쪽 메뉴 **API 및 서비스** → **OAuth 동의 화면**
2. **외부** 사용자 유형 선택 → **만들기**
3. **앱 정보**
   - 앱 이름: 예) `Airbnb Clone`
   - 사용자 지원 이메일: 본인 이메일
   - (선택) 로고
4. **범위** → **저장 후 계속**
5. **테스트 사용자**: 로컬 테스트 시 본인 이메일 추가 (선택)
6. **대시보드로 돌아가기**

### 1-3. OAuth 2.0 클라이언트 ID 만들기

1. **API 및 서비스** → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. **애플리케이션 유형**: **웹 애플리케이션**
4. **이름**: 예) `Airbnb Clone Web`
5. **승인된 JavaScript 원본** (선택)
   - 로컬: `http://localhost:3000`
   - 배포: `https://당신도메인.com`
6. **승인된 리디렉션 URI** (**필수**)
   - 로컬: `http://localhost:3000/api/auth/callback/google`
   - 배포 시: `https://당신도메인.com/api/auth/callback/google`
7. **만들기** 클릭

### 1-4. 클라이언트 ID·시크릿 복사

- 생성 후 나오는 **클라이언트 ID** → `.env`의 `GOOGLE_CLIENT_ID`
- **클라이언트 보안 비밀** (눈 아이콘으로 표시) → `.env`의 `GOOGLE_CLIENT_SECRET`

---

## 2. 카카오 (Kakao) 연동

### 2-1. 카카오 개발자 앱 만들기

1. **Kakao Developers** 접속  
   - https://developers.kakao.com/
2. **로그인** (카카오 계정)
3. **내 애플리케이션** → **애플리케이션 추가하기**
4. **앱 이름** 입력 (예: `Airbnb Clone`) → **저장**

### 2-2. 카카오 로그인 활성화

1. 방금 만든 앱 클릭
2. 왼쪽 **카카오 로그인** → **활성화 설정**을 **ON**으로
3. **동의 항목**에서 필요한 항목(프로필, 이메일 등) **동의 요청**으로 설정

### 2-3. 플랫폼(웹) 등록

1. **카카오 로그인** 메뉴에서 **플랫폼** 탭
2. **Web** 플랫폼 **추가**
3. **사이트 도메인**에 다음 추가:
   - 로컬: `http://localhost:3000`
   - 배포: `https://당신도메인.com`
4. **저장**

### 2-4. Redirect URI 등록

1. **카카오 로그인** → **Redirect URI** 섹션
2. **Redirect URI 등록**
   - 로컬: `http://localhost:3000/api/auth/callback/kakao`
   - 배포 시: `https://당신도메인.com/api/auth/callback/kakao`
3. **저장**

### 2-5. REST API 키·시크릿 확인

1. **앱 설정** → **앱 키** 탭
2. **REST API 키** (긴 문자열) → `.env`의 `KAKAO_CLIENT_ID`
3. **카카오 로그인** → **보안** 탭에서 **Client Secret**  
   - **코드 생성** 후 **비밀 키** 복사 → `.env`의 `KAKAO_CLIENT_SECRET`

> 카카오는 **REST API 키**를 Client ID로, **Client Secret(비밀 키)**를 별도 생성해 사용합니다.

---

## 3. 네이버 (Naver) 연동

### 3-1. 네이버 개발자 앱 등록

1. **NAVER Developers** 접속  
   - https://developers.naver.com/
2. **로그인** (네이버 계정)
3. **Application** → **애플리케이션 등록**

### 3-2. 애플리케이션 정보 입력

1. **애플리케이션 이름**: 예) `Airbnb Clone`
2. **사용 API**: **네이버 로그인** 선택
3. **환경 추가** → **웹** 선택
4. **서비스 URL**:  
   - 로컬: `http://localhost:3000`  
   - 배포: `https://당신도메인.com`
5. **Callback URL** (**정확히 입력**):  
   - 로컬: `http://localhost:3000/api/auth/callback/naver`  
   - 배포: `https://당신도메인.com/api/auth/callback/naver`
6. **등록하기** 클릭

### 3-3. Client ID·Client Secret 복사

1. **Application** → **내 애플리케이션** → 방금 만든 앱 클릭
2. **Client ID** → `.env`의 `NAVER_CLIENT_ID`
3. **Client Secret** → `.env`의 `NAVER_CLIENT_SECRET`

---

## 4. 이 프로그램(.env)에 넣기

1. 프로젝트 루트의 **`.env`** 파일을 엽니다.
2. 아래 항목에 각 콘솔에서 복사한 값을 **따옴표 없이** 넣습니다.

```env
# NextAuth (필수 - 로컬 개발도 필요)
NEXTAUTH_SECRET="여기에_32자_이상_랜덤_문자열"
NEXTAUTH_URL="http://localhost:3000"

# 구글 (위 1-4에서 복사)
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx

# 카카오 (위 2-5에서 복사)
KAKAO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
KAKAO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 네이버 (위 3-3에서 복사)
NAVER_CLIENT_ID=xxxxxxxxxx
NAVER_CLIENT_SECRET=xxxxxxxxxx
```

### NEXTAUTH_SECRET 만들기

- **Windows**: 터미널에서  
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`  
  실행 후 나온 64자 문자열을 복사해서 `NEXTAUTH_SECRET` 값으로 넣습니다.
- **Mac/Linux (openssl 설치됨)**:  
  `openssl rand -hex 32`  
  실행 후 나온 문자열을 넣습니다.

**.env 각 항목을 한 줄씩 이해하고 싶다면** → [docs/ENV-설정-가이드.md](ENV-설정-가이드.md) 참고.

---

## 5. 동작 확인

1. 터미널에서 `npm run dev` 실행
2. 브라우저에서 `http://localhost:3000` 접속
3. 헤더 **로그인** 클릭 → `/auth/signin` 페이지로 이동
4. **Google / 카카오 / 네이버** 버튼 중 하나 클릭
5. 각 사이트 로그인 화면 → 로그인 후 다시 우리 사이트로 돌아오면 연동 성공

---

## 자주 나오는 오류와 확인 사항

| 증상 | 확인할 것 |
|------|------------|
| "Redirect URI mismatch" (구글) | 승인된 리디렉션 URI에 `http://localhost:3000/api/auth/callback/google` **완전히 동일**하게 등록했는지 |
| 카카오 "invalid redirect uri" | Redirect URI에 `http://localhost:3000/api/auth/callback/kakao` 등록, 포트·슬래시까지 일치하는지 |
| 네이버 "잘못된 요청" | Callback URL에 `http://localhost:3000/api/auth/callback/naver` 등록했는지 |
| 로그인 버튼이 안 보임 | `.env`에 해당 서비스의 CLIENT_ID, CLIENT_SECRET이 **둘 다** 들어갔는지 (하나라도 비면 그 버튼은 숨겨짐) |
| 로그인 후 500 에러 | `NEXTAUTH_SECRET`, `NEXTAUTH_URL`이 설정됐는지, 서버 재시작 후 다시 시도 |

---

## 배포 시 추가로 할 일

1. **NEXTAUTH_URL**을 실제 도메인으로 변경  
   - 예: `https://yourdomain.com`
2. **구글 / 카카오 / 네이버** 각 콘솔에 **배포 도메인**과 **배포용 콜백 URL** 추가  
   - 예: `https://yourdomain.com/api/auth/callback/google` 등
3. **NEXTAUTH_SECRET**은 새로 생성한 랜덤 값으로 교체 (기본값 노출 금지)

이 순서대로 하면 이 프로그램과 구글·카카오·네이버 연동을 끝낼 수 있습니다.
