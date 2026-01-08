# Vercel Deployment Script for Windows PowerShell
# Run this script to deploy both frontend and backend to Vercel

Write-Host "🚀 Mindsta App - Vercel Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it with: npm install -g vercel" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Vercel CLI is installed" -ForegroundColor Green
Write-Host ""

# Ask what to deploy
Write-Host "What would you like to deploy?" -ForegroundColor Cyan
Write-Host "1. Backend only"
Write-Host "2. Frontend only"
Write-Host "3. Both (Backend first, then Frontend)"
Write-Host ""
$choice = Read-Host "Enter choice (1-3)"

# Deploy Backend
if ($choice -eq "1" -or $choice -eq "3") {
    Write-Host ""
    Write-Host "📦 Deploying Backend..." -ForegroundColor Yellow
    Write-Host "------------------------" -ForegroundColor Yellow
    Set-Location backend
    
    Write-Host ""
    Write-Host "Running: vercel --prod" -ForegroundColor Gray
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Copy your backend URL and update frontend VITE_API_URL" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
        Write-Host ""
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
}

# Deploy Frontend
if ($choice -eq "2" -or $choice -eq "3") {
    Write-Host ""
    Write-Host "🎨 Deploying Frontend..." -ForegroundColor Yellow
    Write-Host "-------------------------" -ForegroundColor Yellow
    Set-Location frontend
    
    Write-Host ""
    Write-Host "Running: vercel --prod" -ForegroundColor Gray
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
        Write-Host ""
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
}

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure environment variables in Vercel dashboard"
Write-Host "2. Update ALLOWED_ORIGINS in backend with frontend URL"
Write-Host "3. Update VITE_API_URL in frontend with backend URL"
Write-Host "4. Redeploy both projects after updating environment variables"
Write-Host ""
Write-Host "📚 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""
