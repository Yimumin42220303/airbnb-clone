# Vercel에 빌링키 채널 환경변수 추가 스크립트
# 실행: .\scripts\add-vercel-billing-env.ps1

$env:VERCEL_ORG_ID = "team_1qdVcZtzKQGHJmkdtvE2xrHZ"
$env:VERCEL_PROJECT_ID = ""  # Vercel 대시보드에서 프로젝트 설정 → General → Project ID 확인 후 입력

$channelKey = "channel-key-f5d898c3-3e08-4e34-905e-ce562024b615"

Write-Host "1. 먼저 프로젝트가 Vercel에 연결되어 있는지 확인하세요."
Write-Host "   vercel link --scope minbaktokyos-projects"
Write-Host ""
Write-Host "2. 연결 후 아래 명령을 실행하세요 (Production, Preview, Development 각각):"
Write-Host ""
Write-Host "   echo $channelKey | vercel env add NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY production"
Write-Host "   echo $channelKey | vercel env add NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY preview"
Write-Host "   echo $channelKey | vercel env add NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY development"
Write-Host ""
Write-Host "3. 또는 Vercel 대시보드에서 직접 추가:"
Write-Host "   https://vercel.com/minbaktokyos-projects/airbnb-clone/settings/environment-variables"
Write-Host "   Key: NEXT_PUBLIC_PORTONE_BILLING_CHANNEL_KEY"
Write-Host "   Value: $channelKey"
Write-Host "   Environments: Production, Preview, Development 모두 체크"
Write-Host ""
Write-Host "4. 저장 후 Redeploy 실행"
