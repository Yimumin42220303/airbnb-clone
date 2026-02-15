# Push .env to Vercel - run from project root
# Usage: .\scripts\vercel-env-push.ps1
# Prereq: vercel link (select airbnb-clone project)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path .env)) {
    Write-Host ".env not found" -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$' -and $_.Trim() -notmatch '^#') {
        $key = $matches[1]
        $val = $matches[2].Trim().Trim('"').Trim("'")
        if ($val) { $envVars[$key] = $val }
    }
}

$envVars["NEXTAUTH_URL"] = "https://tokyominbak.net"

$required = @("DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL")
foreach ($k in $required) {
    if (-not $envVars[$k]) {
        Write-Host "Missing: $k" -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path .vercel\project.json)) {
    Write-Host "Run 'vercel link' first to link project." -ForegroundColor Yellow
    vercel link
    if (-not (Test-Path .vercel\project.json)) { exit 1 }
}

Write-Host "Pushing env vars to Vercel..." -ForegroundColor Cyan
foreach ($key in @("DATABASE_URL","DIRECT_URL","NEXTAUTH_SECRET","NEXTAUTH_URL","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","KAKAO_CLIENT_ID","KAKAO_CLIENT_SECRET","RESEND_API_KEY","EMAIL_FROM")) {
    if (-not $envVars[$key]) { continue }
    $val = $envVars[$key]
    foreach ($env in @("production","preview","development")) {
        $val | vercel env add $key $env 2>$null
        if ($LASTEXITCODE -eq 0) { Write-Host "  $key ($env) OK" -ForegroundColor Green }
    }
}
Write-Host "Done. Redeploy from Vercel dashboard." -ForegroundColor Green
