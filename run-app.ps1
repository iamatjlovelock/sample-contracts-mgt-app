# Contracts Management Application - Startup Script
# Run this script to start both backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Contracts Management Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Display Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

$rootDir = $PSScriptRoot

# Install backend dependencies if needed
if (-not (Test-Path "$rootDir\backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location "$rootDir\backend"
    npm install
    Pop-Location
}

# Install frontend dependencies if needed
if (-not (Test-Path "$rootDir\frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location "$rootDir\frontend"
    npm install
    Pop-Location
}

Write-Host ""
Write-Host "Starting application..." -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "  Frontend UI:  http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Two new windows will open for backend and frontend." -ForegroundColor Gray
Write-Host "Close this window or press Ctrl+C to stop both servers." -ForegroundColor Gray
Write-Host ""

# Start backend in a new window
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; npm run dev" -PassThru

# Start frontend in a new window
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev" -PassThru

Write-Host "Backend PID: $($backendProcess.Id)" -ForegroundColor DarkGray
Write-Host "Frontend PID: $($frontendProcess.Id)" -ForegroundColor DarkGray
Write-Host ""

# Wait for user to press a key, then clean up
Write-Host "Press any key to stop both servers..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "Stopping servers..." -ForegroundColor Yellow

# Stop the processes
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue

Write-Host "Done." -ForegroundColor Green
