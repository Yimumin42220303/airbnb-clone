# Resend 이메일 설정 가이드

도쿄민박 이메일 회원가입(인증 메일 발송)을 위해 Resend API 키를 설정하는 방법입니다.

## 1. Resend 가입 및 API 키 발급

1. [resend.com](https://resend.com) 접속 후 회원가입
2. **API Keys** 메뉴 이동: [resend.com/api-keys](https://resend.com/api-keys)
3. **Create API Key** 클릭
4. 이름 입력 (예: `tokyominbak-production`)
5. 권한: **Sending access** 선택 (이메일 발송만)
6. **Add** 클릭 후 **API 키를 즉시 복사** (한 번만 표시됨)

> API 키 형식: `re_xxxxxxxxxxxxxxxxxxxxxxxx`

## 2. 로컬 개발 환경

`.env` 또는 `.env.local`에 추가:

```env
RESEND_API_KEY="re_여기에_발급받은_키_붙여넣기"
EMAIL_FROM="도쿄민박 <onboarding@resend.dev>"
```

- **도메인 미인증 시**: `onboarding@resend.dev` 사용 (무료 100통/일)
- **도메인 인증 후**: `noreply@tokyominbak.net` 등 커스텀 발신자 사용 가능

## 3. Vercel 프로덕션 환경

### 방법 A: Vercel 대시보드

1. [vercel.com](https://vercel.com) → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. **Add New** 클릭
4. Name: `RESEND_API_KEY`
5. Value: 발급받은 API 키 붙여넣기
6. Environment: **Production**, **Preview** 체크
7. **Save** 클릭

(선택) `EMAIL_FROM` 추가:
- Name: `EMAIL_FROM`
- Value: `도쿄민박 <onboarding@resend.dev>` 또는 `도쿄민박 <noreply@tokyominbak.net>`

### 방법 B: Vercel CLI

```bash
# 프로젝트 폴더에서
vercel env add RESEND_API_KEY production
# 프롬프트에 API 키 입력
```

## 4. 도메인 인증 (선택, 프로덕션 권장)

커스텀 발신자(`noreply@tokyominbak.net`) 사용 시:

1. Resend 대시보드 → **Domains** → **Add Domain**
2. `tokyominbak.net` 입력
3. 안내된 DNS 레코드(TXT, MX 등)를 도메인 관리자에 추가
4. 인증 완료 후 `EMAIL_FROM="도쿄민박 <noreply@tokyominbak.net>"` 설정

## 5. 동작 확인

- **RESEND_API_KEY 미설정**: 개발 모드에서 콘솔에 인증 링크 출력, 프로덕션에서는 에러
- **RESEND_API_KEY 설정**: 이메일 발송 정상 동작

## 참고

- [Resend 문서](https://resend.com/docs)
- [Resend API Keys](https://resend.com/api-keys)
