# Contracts Management Backend - Startup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Contracts Management - Backend API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "$PSScriptRoot\backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting backend server on http://localhost:3001" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm run dev
