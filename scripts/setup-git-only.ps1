# GitHub 저장소 없이 Git remote만 변경 + push (수동 생성 후 사용)
# 1. https://github.com/new 에서 airbnb-clone 저장소 생성 (빈 저장소, Public)
# 2. 아래에서 $username 을 본인 GitHub 사용자명으로 수정
# 3. 실행: .\scripts\setup-git-only.ps1 -Username "본인사용자명"

param(
    [Parameter(Mandatory=$true)]
    [string]$Username
)

$ErrorActionPreference = "Continue"
Set-Location $PSScriptRoot\..

Write-Host "`n=== Git 원격 저장소 연결 ===" -ForegroundColor Cyan
Write-Host "대상: https://github.com/$Username/airbnb-clone`n" -ForegroundColor Gray

git remote remove origin 2>$null
git remote add origin "https://github.com/$Username/airbnb-clone.git"
Write-Host "Remote 설정 완료. Push 시도 중..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPush 완료!" -ForegroundColor Green
    Write-Host "저장소: https://github.com/$Username/airbnb-clone" -ForegroundColor White
} else {
    Write-Host "`nPush 실패. GitHub 인증이 필요합니다." -ForegroundColor Red
    Write-Host "방법: GitHub → Settings → Developer settings → Personal Access Tokens → 생성"
    Write-Host "      git remote set-url origin https://[토큰]@github.com/$Username/airbnb-clone.git"
    Write-Host "      git push -u origin main" -ForegroundColor Gray
}
