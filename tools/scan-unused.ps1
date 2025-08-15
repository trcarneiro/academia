# Scan project for used vs unused files (simple heuristic)
# Excludes common heavy dirs. Writes reports to .reports/used-files.txt and .reports/unused-files.txt

$root = (Get-Location).ProviderPath
$excludePattern = '\\node_modules\\|\\.git\\|\\backups\\|\\bdata\\b|\\dist\\|\\build\\|\\.vscode\\|\\.reports\\'
Write-Output "Scanning workspace: $root"

$allFiles = Get-ChildItem -Recurse -File | Where-Object { $_.FullName -notmatch $excludePattern }
$searchFiles = $allFiles | Where-Object { $_.Extension -match '(.js|.ts|.jsx|.tsx|.html|.css|.json|.md|.py|.java|.go|.rs|.txt)$' }

$used = New-Object System.Collections.Generic.List[System.String]
$unused = New-Object System.Collections.Generic.List[System.String]

$total = $allFiles.Count
$i = 0

foreach ($f in $allFiles) {
    $i++
    $rel = $f.FullName.Substring($root.Length+1) -replace '\\','/'
    Write-Progress -Activity "Scanning files" -Status "$i / $total" -PercentComplete (($i/$total)*100)
    $basename = [System.IO.Path]::GetFileName($f.FullName)
    $found = $false

    foreach ($p in $searchFiles) {
        try {
            $content = Get-Content $p.FullName -Raw -ErrorAction Stop
            if ($content -like "*$rel*" -or $content -like "*$basename*") { $found = $true; break }
        } catch {
            # ignore read errors
            continue
        }
    }

    if ($found) { $used.Add($rel) } else { $unused.Add($rel) }
}

# Ensure reports directory
New-Item -ItemType Directory -Force -Path .reports | Out-Null
$used | Sort-Object | Out-File -Encoding utf8 .reports\used-files.txt
$unused | Sort-Object | Out-File -Encoding utf8 .reports\unused-files.txt

Write-Output "Scan complete. Used: $($used.Count). Unused: $($unused.Count)."
Write-Output "Reports written to: .reports\\used-files.txt and .reports\\unused-files.txt"
