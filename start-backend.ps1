# start-backend.ps1
# Starts PocketBase backend with the correct data and migrations directories.

$pbPath = Join-Path $PSScriptRoot "pb\pocketbase.exe"
$dataDir = Join-Path $PSScriptRoot "pocketbase\pb_data"
$migrationsDir = Join-Path $PSScriptRoot "pocketbase\pb_migrations"

# 1. Stop any previously running pocketbase instances to avoid port conflicts
$runningPb = Get-Process -Name pocketbase -ErrorAction SilentlyContinue
if ($runningPb) {
    Write-Host "Stopping existing PocketBase process..." -ForegroundColor Yellow
    Stop-Process -Name pocketbase -Force
    Start-Sleep -Seconds 1
}

Write-Host "🚀 Starting PocketBase Server..." -ForegroundColor Green
Write-Host "📁 Data Folder: $dataDir" -ForegroundColor Cyan
Write-Host "📦 Migrations: $migrationsDir" -ForegroundColor Cyan

# 2. Start PocketBase server with the correct arguments
Start-Process -FilePath $pbPath -ArgumentList "serve --dir=`"$dataDir`" --migrationsDir=`"$migrationsDir`"" -NoNewWindow
