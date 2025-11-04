# ============================================================================
# CRM Module - Database Migration Script
# ============================================================================
# This script safely migrates the Prisma schema to add CRM tables
# Steps: Stop servers → Generate Prisma Client → Migrate
# ============================================================================

Write-Host "🚀 CRM Module - Database Migration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Host "❌ Error: prisma/schema.prisma not found" -ForegroundColor Red
    Write-Host "   Make sure you're running this from the project root" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Step 1: Stopping Node.js servers..." -ForegroundColor Yellow
Write-Host ""

# Kill all Node.js processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "   Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor White
    foreach ($process in $nodeProcesses) {
        Write-Host "   Stopping process $($process.Id)..." -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "   ✅ All Node.js processes stopped" -ForegroundColor Green
}
else {
    Write-Host "   ℹ️  No Node.js processes running" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "📋 Step 2: Generating Prisma Client..." -ForegroundColor Yellow
Write-Host ""

npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Error generating Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host "   ✅ Prisma Client generated successfully" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Step 3: Running database migration..." -ForegroundColor Yellow
Write-Host ""

npx prisma migrate dev --name add-crm-module

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Error running migration" -ForegroundColor Red
    Write-Host "   ⚠️  Your database may be in an inconsistent state" -ForegroundColor Yellow
    Write-Host "   Run 'npx prisma migrate status' to check" -ForegroundColor Yellow
    exit 1
}

Write-Host "   ✅ Database migration completed successfully" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Database changes applied:" -ForegroundColor Cyan
Write-Host "   • 7 new tables: Lead, LeadActivity, LeadNote, GoogleAdsCampaign," -ForegroundColor White
Write-Host "     GoogleAdsAdGroup, GoogleAdsKeyword, CrmSettings" -ForegroundColor White
Write-Host "   • 4 new enums: LeadStage, LeadStatus, LeadTemperature, LeadActivityType" -ForegroundColor White
Write-Host "   • Relationships to Organization and User" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start the development server: npm run dev" -ForegroundColor Yellow
Write-Host "   2. Navigate to http://localhost:3000" -ForegroundColor Yellow
Write-Host "   3. Click 'CRM & Leads' in the sidebar" -ForegroundColor Yellow
Write-Host "   4. Create your first lead!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 For Google Ads integration setup, see:" -ForegroundColor Cyan
Write-Host "   dev/CRM_MODULE_IMPLEMENTATION.md" -ForegroundColor White
Write-Host ""
