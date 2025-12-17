param(
    [string]$OutputDir = "artifacts",
    [string]$PackageName,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Write-Info($message) {
    Write-Host "[package-artifact] $message"
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptRoot "..\..")
Set-Location $repoRoot

if (-not $PackageName) {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $PackageName = "deploy-$timestamp"
}

if (-not $SkipBuild) {
    Write-Info "Running npm run build:alias"
    npm run build:alias
}

$artifactRoot = Join-Path $repoRoot $OutputDir
New-Item -ItemType Directory -Force -Path $artifactRoot | Out-Null

$workDir = Join-Path $artifactRoot $PackageName
if (Test-Path $workDir) {
    Remove-Item $workDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $workDir | Out-Null

$itemsToCopy = @(
    "dist",
    "public",
    "prisma",
    "scripts/deploy",
    "package.json",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "tsconfig.build.json",
    "tsconfig.json",
    "vercel.json",
    "render.yaml"
)

$copiedItems = @()
foreach ($item in $itemsToCopy) {
    $sourcePath = Join-Path $repoRoot $item
    if (Test-Path $sourcePath) {
        $destination = Join-Path $workDir $item
        $destinationDir = Split-Path -Parent $destination
        if (-not (Test-Path $destinationDir)) {
            New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
        }
        Copy-Item -Path $sourcePath -Destination $destination -Recurse -Force -Exclude '.env*','*.log','node_modules','uploads','.venv'
        $copiedItems += $item
    }
}

Write-Info "Copied: $($copiedItems -join ', ')"

$archivePath = Join-Path $artifactRoot "$PackageName.tar.gz"
if (Test-Path $archivePath) {
    Remove-Item $archivePath -Force
}

# Create tar.gz from workDir
& tar -czf $archivePath -C $artifactRoot $PackageName

$hash = (Get-FileHash -Algorithm SHA256 $archivePath).Hash
$sizeBytes = (Get-Item $archivePath).Length

$sourceVersion = "unknown"
try {
    $sourceVersion = (git rev-parse --short HEAD).Trim()
} catch { }

$manifest = [ordered]@{
    artifact       = "$(Split-Path -Leaf $archivePath)"
    path           = $archivePath
    sourceVersion  = $sourceVersion
    buildTimestamp = (Get-Date).ToString("s")
    aliasesResolved = $true
    checksumSha256 = $hash
    sizeBytes      = $sizeBytes
    contents       = $copiedItems
}

$manifestPath = Join-Path $scriptRoot "artifact-manifest.json"
$manifest | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Info "Artifact created at $archivePath"
Write-Info "Manifest written to $manifestPath"
