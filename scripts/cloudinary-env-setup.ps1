# Cloudinary 환경변수를 Vercel에 추가
# 1. Cloudinary 대시보드 → API Keys → Root 옆 "Reveal" 클릭 → API Secret 복사
# 2. .env.vercel.import 에서 CLOUDINARY_API_SECRET= 뒤에 붙여넣기
# 3. 이 스크립트 실행

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path (Split-Path -Parent $scriptDir) ".env.vercel.import"

$content = Get-Content $envFile -Raw -Encoding UTF8
if ($content -notmatch "CLOUDINARY_API_SECRET=(.+)") {
    Write-Host "CLOUDINARY_API_SECRET 을 .env.vercel.import 에 추가해 주세요." -ForegroundColor Red
    exit 1
}
$secret = $matches[1].Trim()
if ($secret.Length -lt 5) {
    Write-Host "CLOUDINARY_API_SECRET 이 비어 있습니다. Reveal 후 복사해 붙여넣기" -ForegroundColor Red
    exit 1
}

Write-Host "Vercel에 환경변수 추가 중..." -ForegroundColor Cyan
& "$scriptDir\vercel-env-add.ps1"
