# Restores files from .archive/src back into src preserving structure
$root = (Get-Location).ProviderPath
$archiveSrc = Join-Path $root '.archive\src'
if (-not (Test-Path $archiveSrc)) {
    Write-Error ".archive\src not found. Nothing to restore."
    exit 1
}

Get-ChildItem -Path $archiveSrc -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($archiveSrc.Length+1).TrimStart('\')
    $dest = Join-Path $root $rel
    $dir = Split-Path $dest -Parent
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Move-Item -LiteralPath $_.FullName -Destination $dest -Force
    Write-Output "RESTORED: $rel"
}
Write-Output "Restore complete."
