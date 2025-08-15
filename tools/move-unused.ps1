# Move files listed in .reports/unused-files.txt to .archive preserving directory structure
# Writes report to .reports/moved-files.txt and prints moved/skipped items

$root = (Get-Location).ProviderPath
$reportIn = Join-Path $root '.reports\unused-files.txt'
$reportOut = Join-Path $root '.reports\moved-files.txt'

if (-not (Test-Path $reportIn)) {
    Write-Error ".reports\unused-files.txt not found. Run tools/scan-unused.ps1 first."
    exit 1
}

$lines = Get-Content $reportIn | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
$moved = @()
$skipped = @()

foreach ($rel in $lines) {
    $relFixed = $rel -replace '/', '\\'
    $src = Join-Path $root $relFixed
    if (-not (Test-Path $src)) {
        $skipped += "MISSING: $rel"
        continue
    }

    $dest = Join-Path $root (Join-Path '.archive' $relFixed)
    $dir = Split-Path $dest -Parent
    try {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
        Move-Item -LiteralPath $src -Destination $dest -Force
        $moved += $rel
        Write-Output "MOVED: $rel"
    } catch {
        $skipped += "ERROR moving: $rel -> $_"
    }
}

# Ensure reports dir
New-Item -ItemType Directory -Force -Path (Join-Path $root '.reports') | Out-Null

$moved | Sort-Object | Out-File -Encoding utf8 $reportOut

Write-Output "\nSummary: Moved $($moved.Count) files. Skipped $($skipped.Count) items."
if ($skipped.Count -gt 0) { Write-Output "Skipped items:"; $skipped | ForEach-Object { Write-Output $_ } }
Write-Output "Moved files list written to: .reports\\moved-files.txt"
