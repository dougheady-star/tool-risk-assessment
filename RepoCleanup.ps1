$ErrorActionPreference = "Stop"

$pathsToRemove = @(
  ".next",
  ".turbo",
  ".vercel",
  "node_modules",
  "out",
  "dist",
  "coverage",
  ".cache",
  "*.log",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*",
  ".DS_Store",
  "Thumbs.db"
)

Write-Host "Cleaning common build artifacts and caches..." -ForegroundColor Cyan

foreach ($p in $pathsToRemove) {
  Get-ChildItem -Path $p -ErrorAction SilentlyContinue | ForEach-Object {
    try {
      Remove-Item -Recurse -Force $_.FullName
      Write-Host "Removed: $($_.FullName)" -ForegroundColor DarkGray
    } catch {}
  }
}

Write-Host "Done." -ForegroundColor Green