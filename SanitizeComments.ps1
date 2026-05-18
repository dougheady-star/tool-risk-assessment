$ErrorActionPreference = "Stop"

$targets = Get-ChildItem -Recurse -File -Include *.ts,*.tsx,*.css | Where-Object {
  $_.FullName -notmatch "\\node_modules\\|\\\.next\\|\\\.vercel\\|\\\.turbo\\"
}

function Clean-Content([string]$content) {
  # Remove emoji/checkmark style single-line comments (e.g. // ✅ ...)
  $content = $content -replace '^\s*//\s*[✅🚫❌⚠️].*$\r?\n', ''

  # Remove loud "AI-style" keywords in comments
  $content = $content -replace '^\s*//\s*(CRITICAL|IMPORTANT|FIX|NO Tailwind|prevents OKLCH|PS-aligned).*$\r?\n', ''

  # Remove big banner blocks like /* ===================== ... ===================== */
  $content = $content -replace '(?s)/\*\s*=+\s*.*?\s*=+\s*\*/\s*', ''

  return $content
}

foreach ($f in $targets) {
  $orig = Get-Content $f.FullName -Raw
  $clean = Clean-Content $orig

  if ($clean -ne $orig) {
    Set-Content -Path $f.FullName -Value $clean -NoNewline
    Write-Host "Sanitized: $($f.FullName)" -ForegroundColor DarkGray
  }
}

Write-Host "Comment sanitization complete. Review with: git diff" -ForegroundColor Green