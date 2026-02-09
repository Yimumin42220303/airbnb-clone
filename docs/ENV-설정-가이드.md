# .env 설정 가이드 (구글 로그인 기준)

프로젝트 **루트 폴더**(`package.json`이 있는 곳)에 `.env` 파일을 만들고, 아래 항목을 한 줄씩 넣으면 됩니다.

---

## 1. .env 파일이 없다면

1. 프로젝트 루트에서 `.env.example` 파일을 **복사**해서 `.env`로 이름만 바꿉니다.
2. 또는 새 파일을 만들고 이름을 **`.env`** 로 저장합니다.

> `.env`는 Git에 올라가지 않도록 `.gitignore`에 들어 있어 있어서, 탐색기에서 안 보일 수 있습니다. Cursor/VS Code 왼쪽 파일 목록에서는 보입니다.

---

## 2. 넣어야 할 값 (한 줄씩 설명)

### NEXTAUTH_SECRET

로그인 세션을 암호화할 때 쓰는 **비밀 키**입니다. 아무에게도 알려주면 안 됩니다.

**값 만드는 방법 (둘 중 하나):**

- **Windows (PowerShell / CMD):**  
  터미널에서 아래 명령 실행 후, **나온 긴 문자열 전체**를 복사해서 넣습니다.
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  예: `172fddab9bed9e4b1a660829690b0297b66d392bef077b4076ab22f4cf8c7249`

- **Mac / Linux (openssl 있는 경우):**  
  ```bash
  openssl rand -hex 32
  ```

**.env 예시:**
```env
NEXTAUTH_SECRET="172fddab9bed9e4b1a660829690b0297b66d392bef077b4076ab22f4cf8c7249"
```
따옴표 안에 위에서 복사한 **본인이 생성한 값**을 넣으면 됩니다.

---

### NEXTAUTH_URL

지금 이 앱이 **어느 주소로 접속하는지** 알려주는 값입니다.

- 로컬에서 `npm run dev`로 실행하고 브라우저에서 `http://localhost:3000`으로 접속한다면:
  ```env
  NEXTAUTH_URL="http://localhost:3000"
  ```
- 포트를 3001로 바꿨다면 `http://localhost:3001`로 맞춰 주세요.

---

### GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET

**구글 로그인**을 쓰려면 Google Cloud Console에서 발급받은 두 값을 넣습니다.

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속
2. 프로젝트 선택 → **사용자 인증 정보** → **OAuth 2.0 클라이언트 ID** (웹 애플리케이션) 만들기
3. **승인된 리디렉션 URI**에 `http://localhost:3000/api/auth/callback/google` 추가 후 저장
4. 만들어진 항목을 클릭하면 나오는:
   - **클라이언트 ID** → `GOOGLE_CLIENT_ID`에
   - **클라이언트 보안 비밀** (비밀번호 눈 아이콘 클릭 후 표시) → `GOOGLE_CLIENT_SECRET`에

**.env 예시:**
```env
GOOGLE_CLIENT_ID="123456789012-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
```
여기 `1234...`, `GOCSPX-...` 자리에는 **본인이 발급받은 실제 값**을 넣으면 됩니다.

---

### 포트원(KG이니시스) PG (카드/간편결제, 선택)

예약 확인 페이지에서 **카드·간편결제**를 쓰려면 [포트원 콘솔](https://portone.io)에서 채널(KG이니시스 등)을 연동한 뒤 아래 두 값을 넣습니다.

- **NEXT_PUBLIC_PORTONE_STORE_ID**: 콘솔의 Store ID
- **NEXT_PUBLIC_PORTONE_CHANNEL_KEY**: 연동한 채널의 Channel Key

**.env 예시:**
```env
NEXT_PUBLIC_PORTONE_STORE_ID="store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
NEXT_PUBLIC_PORTONE_CHANNEL_KEY="channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

> 미설정 시 예약 확인 페이지에서는 **가상계좌 입금**만 사용 가능합니다. 카드 결제 버튼은 비활성화되며 "PG 설정 후 이용 가능" 문구가 표시됩니다.
>
> **채널 추가·Store ID/Channel Key 확인 등 상세 설정 방법:** [포트원-PG-설정-가이드.md](포트원-PG-설정-가이드.md)

---

## 3. 전체 예시 (복사해서 수정용)

아래는 **예시**입니다. `NEXTAUTH_SECRET`은 위 2번처럼 새로 생성한 값을, 구글 값은 콘솔에서 복사한 값을 넣으세요.

```env
# DB (로컬 SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="여기에_위에서_생성한_64자_문자열_붙여넣기"
NEXTAUTH_URL="http://localhost:3000"

# 구글 로그인 (Google Cloud Console에서 복사)
GOOGLE_CLIENT_ID="본인_클라이언트_ID"
GOOGLE_CLIENT_SECRET="본인_클라이언트_시크릿"
```

---

## 4. 저장 후 할 일

- `.env`를 수정했다면 **개발 서버를 한 번 끄고 다시** 실행해야 합니다.  
  `npm run dev` 중지 후 다시 `npm run dev` 실행.
- 그 다음 브라우저에서 `http://localhost:3000/auth/signin` 으로 가서 **Google로 로그인** 버튼이 보이는지 확인하면 됩니다.

---

## 5. 자주 하는 실수

| 상황 | 확인할 것 |
|------|------------|
| "구글 로그인이 설정되지 않았습니다" | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` **둘 다** 넣었는지, 앞뒤 공백/따옴표가 들어가지 않았는지 |
| 로그인 버튼 눌렀는데 에러 | Google Cloud Console **승인된 리디렉션 URI**에 `http://localhost:3000/api/auth/callback/google` 이 **정확히** 들어갔는지 |
| 500 에러 / 설정 오류 | `NEXTAUTH_SECRET`을 넣었는지, `.env` 저장 후 서버를 **재시작**했는지 |

이 순서대로 하면 `.env` 설정을 끝낼 수 있습니다. 구글 콘솔 설정은 [OAUTH_SETUP.md](OAUTH_SETUP.md)를 참고하세요.
