# Contracts Management Application - Setup Script
# Run this script from any folder to clone and set up the project

param(
    [string]$InstallPath = ".\sample-contracts-mgt-app",
    [switch]$Run
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Contracts Management App Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "  Git: $(git --version)" -ForegroundColor Green
Write-Host "  Node: $(node --version)" -ForegroundColor Green
Write-Host ""

# Clone repository
Write-Host "Cloning repository..." -ForegroundColor Yellow
if (Test-Path $InstallPath) {
    Write-Host "  Directory already exists: $InstallPath" -ForegroundColor Yellow
    $response = Read-Host "  Delete and re-clone? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-Item -Recurse -Force $InstallPath
    } else {
        Write-Host "  Using existing directory" -ForegroundColor Gray
    }
}

if (-not (Test-Path $InstallPath)) {
    git clone https://github.com/iamatjlovelock/sample-contracts-mgt-app.git $InstallPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to clone repository" -ForegroundColor Red
        exit 1
    }
}

Set-Location $InstallPath
$projectRoot = Get-Location
Write-Host "  Installed to: $projectRoot" -ForegroundColor Green
Write-Host ""

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "$projectRoot\backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "  Backend dependencies installed" -ForegroundColor Green

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "$projectRoot\frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "  Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Create environment files
Write-Host "Creating environment files..." -ForegroundColor Yellow

$backendEnv = @"
# AWS Cognito Configuration
AWS_REGION=us-east-1
USER_POOL_ID=us-east-1_M49RbNHyh
USER_POOL_CLIENT_ID=429dh9qd6q5sb3vl6ogqrg15ud

# Server Configuration
PORT=3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
"@

$frontendEnv = @"
# AWS Cognito Configuration
VITE_AWS_REGION=us-east-1
VITE_USER_POOL_ID=us-east-1_M49RbNHyh
VITE_USER_POOL_CLIENT_ID=429dh9qd6q5sb3vl6ogqrg15ud

# Backend API URL
VITE_API_URL=http://localhost:3001
"@

Set-Location $projectRoot
$backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8 -NoNewline
$frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8 -NoNewline

Write-Host "  Created backend/.env" -ForegroundColor Green
Write-Host "  Created frontend/.env" -ForegroundColor Green
Write-Host ""

# Done
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project location: $projectRoot" -ForegroundColor White
Write-Host ""
Write-Host "To run the application:" -ForegroundColor Yellow
Write-Host "  cd $projectRoot" -ForegroundColor White
Write-Host "  .\run-app.ps1" -ForegroundColor White
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""

# Optionally run the app
if ($Run) {
    Write-Host "Starting application..." -ForegroundColor Yellow
    & "$projectRoot\run-app.ps1"
}
