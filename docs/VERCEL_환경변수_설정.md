# Vercel 환경 변수 설정

배포 실패 시 `DATABASE_URL` 등 환경 변수가 없어서 발생합니다.

## 방법 1: 파일에서 복사 (가장 빠름)

1. 프로젝트 루트에서 실행:
   ```powershell
   .\scripts\vercel-env-export.ps1
   ```
2. `.env.vercel.import` 파일이 생성됨
3. Vercel → airbnb-clone → **Settings** → **Environment Variables**
4. **Add New** 클릭 후 아래 변수들을 **하나씩** 추가 (Name / Value 복사):

| Name | Value (파일에서 복사) |
|------|----------------------|
| DATABASE_URL | 1번째 줄 |
| DIRECT_URL | 2번째 줄 |
| NEXTAUTH_SECRET | 3번째 줄 |
| NEXTAUTH_URL | 4번째 줄 (https://tokyominbak.net) |
| GOOGLE_CLIENT_ID | 5번째 줄 |
| GOOGLE_CLIENT_SECRET | 6번째 줄 |
| KAKAO_CLIENT_ID | 7번째 줄 |
| KAKAO_CLIENT_SECRET | 8번째 줄 |
| RESEND_API_KEY | 9번째 줄 |
| EMAIL_FROM | 10번째 줄 |

5. 각 변수 추가 시 **Production, Preview, Development** 모두 체크
6. **Save** 후 **Deployments** → **Redeploy**

## 방법 2: .env에서 직접 복사

`.env` 파일을 열고 아래 변수들을 Vercel에 추가:

- DATABASE_URL
- DIRECT_URL  
- NEXTAUTH_SECRET
- NEXTAUTH_URL (배포용: `https://tokyominbak.net`)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- KAKAO_CLIENT_ID, KAKAO_CLIENT_SECRET
- RESEND_API_KEY, EMAIL_FROM

## 필수 변수 (최소)

배포만 되게 하려면 최소한:

- **DATABASE_URL** (Neon Connection string)
- **DIRECT_URL** (Neon Connection string, DATABASE_URL과 동일 가능)
- **NEXTAUTH_SECRET** (32자 이상 랜덤)
- **NEXTAUTH_URL** (`https://tokyominbak.net`)
