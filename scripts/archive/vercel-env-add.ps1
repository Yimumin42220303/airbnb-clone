# Vercel 환경변수 일괄 추가 (토큰 1회 입력)
# 1. https://vercel.com/account/tokens 에서 토큰 생성
# 2. .\scripts\vercel-env-add.ps1 실행
# 3. 토큰 붙여넣기

$token = $env:VERCEL_TOKEN
if (-not $token) {
    Write-Host "VERCEL_TOKEN 이 없으면 토큰을 입력하세요." -ForegroundColor Yellow
    Write-Host "토큰 생성: https://vercel.com/account/tokens" -ForegroundColor Gray
    $token = Read-Host "Token"
}
if (-not $token) { exit 1 }

$env:VERCEL_TOKEN = $token
node $PSScriptRoot\vercel-env-api.js
