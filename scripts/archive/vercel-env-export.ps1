# Export .env for Vercel import (production values)
# Output: .env.vercel.import - paste into Vercel Settings > Environment Variables > Import

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path .env)) {
    Write-Host ".env not found" -ForegroundColor Red
    exit 1
}

$lines = @()
Get-Content .env | ForEach-Object {
    if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$' -and $_.Trim() -notmatch '^#') {
        $key = $matches[1]
        $val = $matches[2].Trim().Trim('"').Trim("'")
        if ($key -eq "NEXTAUTH_URL") { $val = "https://tokyominbak.net" }
        if ($val) { $lines += "$key=$val" }
    }
}

$out = ".env.vercel.import"
$lines | Set-Content $out -Encoding UTF8
Write-Host "Created $out" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Vercel > Project > Settings > Environment Variables" -ForegroundColor Yellow
Write-Host "      Click 'Import .env' and paste the file content" -ForegroundColor Yellow
Write-Host "      Or add DATABASE_URL, DIRECT_URL manually" -ForegroundColor Yellow
Write-Host ""
