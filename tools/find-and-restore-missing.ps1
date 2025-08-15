# Search .archive for files matching those missing after restore and restore best matches
# Usage: run from project root. Uses .reports/moved-files.txt to know what was originally moved.

$root = (Get-Location).ProviderPath
$movedList = Join-Path $root '.reports\moved-files.txt'
$outLog = Join-Path $root '.reports\find-restore.log'
$outRestored = Join-Path $root '.reports\find-restore-restored.txt'
$outMissing = Join-Path $root '.reports\find-restore-missing.txt'

if (-not (Test-Path $movedList)) {
    Write-Error ".reports/moved-files.txt not found. Run tools/move-unused.ps1 previously."
    exit 1
}

$items = Get-Content $movedList | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
$restored = @()
$notFound = @()

foreach ($rel in $items) {
    $relFixed = $rel -replace '/', '\\'
    $dest = Join-Path $root $relFixed
    if (Test-Path $dest) { continue }

    $filename = Split-Path $relFixed -Leaf
    # Search archive for filename (case-insensitive)
    $candidates = Get-ChildItem -Path (Join-Path $root '.archive') -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -ieq $filename }

    if (-not $candidates -or $candidates.Count -eq 0) {
        $notFound += $rel
        continue
    }

    # Choose best candidate: prefer one where the directory structure contains same parent folder name
    $destParent = Split-Path $relFixed -Parent | Split-Path -Leaf
    $best = $null
    foreach ($c in $candidates) {
        if ($c.DirectoryName -match [regex]::Escape($destParent)) { $best = $c; break }
    }
    if (-not $best) { $best = $candidates | Select-Object -First 1 }

    $src = $best.FullName
    $destDir = Split-Path $dest -Parent
    try {
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
        if (Test-Path $dest) {
            $backup = "$dest.bak-$(Get-Date -Format yyyyMMddHHmmss)"
            Move-Item -LiteralPath $dest -Destination $backup -Force
        }
        Move-Item -LiteralPath $src -Destination $dest -Force
        $restored += $rel
        Write-Output "RESTORED: $rel <- $src"
    } catch {
        Write-Output "ERROR restoring $rel from $src -> $_"
    }
}

# Ensure reports dir
New-Item -ItemType Directory -Force -Path (Join-Path $root '.reports') | Out-Null

$restored | Sort-Object | Out-File -Encoding utf8 $outRestored
$notFound | Sort-Object | Out-File -Encoding utf8 $outMissing

Write-Output "\nSummary: Restored $($restored.Count) items. Not found: $($notFound.Count)"
Write-Output "Restored list written to: .reports\\find-restore-restored.txt"
Write-Output "Not found list written to: .reports\\find-restore-missing.txt"
