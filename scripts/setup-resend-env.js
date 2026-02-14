#!/usr/bin/env node
/**
 * Resend API 키 설정 안내
 * 실행: node scripts/setup-resend-env.js
 *
 * 1. Resend에서 API 키 발급: https://resend.com/api-keys
 * 2. Vercel CLI로 추가: vercel env add RESEND_API_KEY production
 */
console.log(`
=== Resend API 키 설정 ===

1. API 키 발급
   → https://resend.com/api-keys
   → Create API Key → Sending access → 복사 (re_ 로 시작)

2. Vercel에 추가 (프로덕션 이메일 발송용)
   vercel env add RESEND_API_KEY production
   (프롬프트에 API 키 붙여넣기)

3. 로컬 개발용
   .env 또는 .env.local 에 추가:
   RESEND_API_KEY=re_여기에_키_붙여넣기
   EMAIL_FROM="도쿄민박 <onboarding@resend.dev>"

상세 가이드: docs/RESEND_SETUP.md
`);
