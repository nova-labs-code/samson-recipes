<#
  neocities_upload.ps1
  Prompts for your Neocities API key and uploads all files in ./uploads and updates.json to Neocities.
  IMPORTANT: This script does NOT store your API key; it uses it only for the current run.

  Usage:
    Open PowerShell in the project folder and run:
      .\neocities_upload.ps1

#>
param(
  [string]$ApiKey
)

if (-not $ApiKey) {
  $ApiKey = Read-Host "Enter your Neocities API key (will not be saved)"
}

if (-not $ApiKey) {
  Write-Error "No API key provided. Exiting."
  exit 1
}

function Upload-File($filePath) {
  $fileName = Split-Path $filePath -Leaf
  Write-Host "Uploading $fileName ..."
  # Prefer curl if available
  try {
    $curl = Get-Command curl -ErrorAction SilentlyContinue
    if ($curl) {
      $cmd = "curl -s -F api_key=$ApiKey -F file=@`"$filePath`" https://neocities.org/api/upload"
      Write-Host (Invoke-Expression $cmd)
      return
    }
  } catch {}

  # Fallback to Invoke-RestMethod using -Form (PowerShell 6+ or compatible)
  try {
    $res = Invoke-RestMethod -Uri 'https://neocities.org/api/upload' -Method Post -Form @{ api_key = $ApiKey; file = Get-Item $filePath }
    Write-Host ($res | ConvertTo-Json -Depth 2)
  } catch {
    Write-Error "Failed to upload $fileName: $_"
  }
}

$files = @()
if (Test-Path .\uploads) {
  $files += Get-ChildItem -Path .\uploads -File | ForEach-Object { $_.FullName }
}
if (Test-Path .\updates.json) { $files += (Resolve-Path .\updates.json).Path }

if (-not $files.Count) { Write-Host "No files to upload (no uploads/* and no updates.json). Generate/download them from the manager first."; exit 0 }

Write-Host "Found $($files.Count) file(s) to upload.`n"
foreach ($f in $files) { Upload-File $f }

Write-Host "Done. Check your Neocities site to confirm files are available (uploads/ and updates.json)."
