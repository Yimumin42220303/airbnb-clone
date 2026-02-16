#!/bin/bash
# Vercel에 빌링키 채널 환경변수 추가
# 사용법: ./scripts/add-vercel-billing-env.sh

CHANNEL_KEY="channel-key-f5d898c3-3e08-4e34-905e-ce562024b615"

echo "1. 프로젝트 연결 확인: vercel link --scope minbaktokyos-projects"
echo "2. 환경변수 추가 (각 환경별로 실행):"
echo ""
echo "echo $CHANNEL_KEY | vercel env add NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY production"
echo "echo $CHANNEL_KEY | vercel env add NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY preview"
echo "echo $CHANNEL_KEY | vercel env add NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY development"
echo ""
echo "3. Vercel 대시보드에서 직접 추가도 가능합니다."
