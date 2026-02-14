# Cloudinary 이미지 저장소 설정 (Vercel Blob 대안)

Vercel Blob에서 Forbidden 에러가 계속될 때 Cloudinary를 사용할 수 있습니다. 무료 플랜으로 충분합니다.

## 1. Cloudinary 계정 생성

1. [cloudinary.com](https://cloudinary.com) 접속 → **Sign Up for Free**
2. 가입 후 로그인

## 2. API 키 확인

1. [Cloudinary Console](https://console.cloudinary.com) → **Dashboard**
2. **Cloud name**, **API Key**, **API Secret** 확인 (API Secret은 "Reveal" 클릭)

## 3. Vercel 환경 변수 추가

Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**에서 추가:

| 이름 | 값 | 환경 |
|------|-----|------|
| `CLOUDINARY_CLOUD_NAME` | Dashboard의 Cloud name | Production, Preview, Development |
| `CLOUDINARY_API_KEY` | Dashboard의 API Key | Production, Preview, Development |
| `CLOUDINARY_API_SECRET` | Dashboard의 API Secret | Production, Preview, Development |

## 4. Redeploy

환경 변수 추가 후 **Deployments** → 최신 배포 → **Redeploy** 실행

## 참고

- Cloudinary가 설정되면 **Cloudinary를 우선 사용**합니다 (Vercel Blob보다 먼저)
- 무료 플랜: 월 25 크레딧 (이미지 업로드에 충분)
- [Cloudinary 가격](https://cloudinary.com/pricing)
