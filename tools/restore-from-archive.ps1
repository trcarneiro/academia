# Restore files moved to .archive back to their original locations
# If .reports/moved-files.txt exists, it is used as the list of files to restore.
# Otherwise, all files under .archive will be restored.

$root = (Get-Location).ProviderPath
$reportMoved = Join-Path $root '.reports\moved-files.txt'
$reportOut = Join-Path $root '.reports\restore-files.txt'

$items = @()
if (Test-Path $reportMoved) {
    $items = Get-Content $reportMoved | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
} else {
    # gather all files under .archive
    $archiveRoot = Join-Path $root '.archive'
    if (-not (Test-Path $archiveRoot)) {
        Write-Error ".archive not found; nothing to restore."
        exit 1
    }
    $files = Get-ChildItem -Path $archiveRoot -Recurse -File | ForEach-Object {
        $full = $_.FullName
        # compute relative path to archive root
        $rel = $full.Substring($archiveRoot.Length + 1) -replace '\\','/'
        $rel
    }
    $items = $files
}

if ($items.Count -eq 0) {
    Write-Output "No items to restore."
    exit 0
}

$restored = @()
$skipped = @()

foreach ($rel in $items) {
    # normalize
    $relFixed = $rel -replace '/', '\\'
    $src = Join-Path $root (Join-Path '.archive' $relFixed)
    $dest = Join-Path $root $relFixed

    if (-not (Test-Path $src)) {
        $skipped += "MISSING ARCHIVE: $rel"
        continue
    }

    $destDir = Split-Path $dest -Parent
    try {
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
        }
        # If destination exists, back it up before overwrite
        if (Test-Path $dest) {
            $backup = "$dest.bak-$(Get-Date -Format yyyyMMddHHmmss)"
            try {
                Move-Item -LiteralPath $dest -Destination $backup -Force
                $skipped += "BACKED-UP-EXISTING: $rel -> $(Split-Path $backup -Leaf)"
            } catch {
                $skipped += "FAILED-BACKUP: $rel -> $_"
                continue
            }
        }

        Move-Item -LiteralPath $src -Destination $dest -Force
        $restored += $rel
        Write-Output "RESTORED: $rel"
    } catch {
        $skipped += "ERROR restoring: $rel -> $_"
    }
}

# Ensure reports dir
New-Item -ItemType Directory -Force -Path (Join-Path $root '.reports') | Out-Null

$restored | Sort-Object | Out-File -Encoding utf8 $reportOut

Write-Output "\nSummary: Restored $($restored.Count) files. Issues: $($skipped.Count)"
if ($skipped.Count -gt 0) { Write-Output "Issues:"; $skipped | ForEach-Object { Write-Output $_ } }
Write-Output "Restore list written to: .reports\\restore-files.txt"
