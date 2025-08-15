# Restore missing files listed in .reports/find-restore-missing.txt from git (HEAD)
# Writes report to .reports/git-restore-restored.txt and .reports/git-restore-missing.txt

$root = (Get-Location).ProviderPath
$missingList = Join-Path $root '.reports\find-restore-missing.txt'
$outRestored = Join-Path $root '.reports\git-restore-restored.txt'
$outNotTracked = Join-Path $root '.reports\git-restore-not-tracked.txt'

if (-not (Test-Path $missingList)) {
    Write-Error ".reports/find-restore-missing.txt not found. Nothing to restore from git."
    exit 1
}

$items = Get-Content $missingList | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
$restored = @()
$notTracked = @()

foreach ($rel in $items) {
    $relFixed = $rel -replace '/', '\\'
    $fullPath = Join-Path $root $relFixed

    # Check if file is tracked
    $isTracked = $false
    try {
        git ls-files --error-unmatch $rel | Out-Null
        $isTracked = $true
    } catch {
        $isTracked = $false
    }

    if ($isTracked) {
        try {
            git restore --source=HEAD -- $rel
            $restored += $rel
            Write-Output "GIT_RESTORED: $rel"
        } catch {
            $notTracked += "GIT_ERROR: $rel -> $_"
        }
    } else {
        $notTracked += $rel
        Write-Output "NOT_TRACKED: $rel"
    }
}

New-Item -ItemType Directory -Force -Path (Join-Path $root '.reports') | Out-Null
$restored | Sort-Object | Out-File -Encoding utf8 $outRestored
$notTracked | Sort-Object | Out-File -Encoding utf8 $outNotTracked

Write-Output "\nSummary: Restored $($restored.Count) files from git. Not tracked or errors: $($notTracked.Count)"
Write-Output "Restored list: .reports\\git-restore-restored.txt"
Write-Output "Not tracked/errors list: .reports\\git-restore-not-tracked.txt"
