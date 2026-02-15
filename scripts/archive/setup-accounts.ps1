# Account setup script - zxcv04027@gmail.com
# Run: .\scripts\setup-accounts.ps1
# Token: $env:GH_TOKEN="ghp_xxx"; .\scripts\setup-accounts.ps1

$ErrorActionPreference = "Continue"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host ""
Write-Host "=== Account Setup ===" -ForegroundColor Cyan

if ($env:GH_TOKEN) {
    $env:GH_TOKEN | gh auth login --with-token
}

Write-Host "[1/4] GitHub auth..." -ForegroundColor Yellow
$null = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in. Run: gh auth login --web" -ForegroundColor Red
    gh auth login --web --git-protocol https
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
Write-Host "OK" -ForegroundColor Green

$username = (gh api user -q .login)
Write-Host "[2/4] User: $username" -ForegroundColor Green

Write-Host "[3/4] Create repo..." -ForegroundColor Yellow
$null = gh repo view $username/airbnb-clone 2>$null
if ($LASTEXITCODE -ne 0) {
    gh repo create airbnb-clone --public --description "Tokyo Minbak"
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
Write-Host "OK" -ForegroundColor Green

Write-Host "[4/4] Push..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..
git remote remove origin 2>$null
git remote add origin "https://github.com/$username/airbnb-clone.git"
git push -u origin main
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "Done!" -ForegroundColor Green
Write-Host "Repo: https://github.com/$username/airbnb-clone" -ForegroundColor White
