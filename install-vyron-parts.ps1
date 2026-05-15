param(
  [string]$ProjectPath = "."
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Parts = @(
  "vyron-store-5.7.0-part01-code-config.zip",
  "vyron-store-5.7.0-part02-public-drivecharge.zip",
  "vyron-store-5.7.0-part03-public-asorta-drivecharge-mount.zip",
  "vyron-store-5.7.0-part04-public-drivecharge-mount.zip",
  "vyron-store-5.7.0-part05-public-rest.zip"
)

if (!(Test-Path $ProjectPath)) {
  New-Item -ItemType Directory -Path $ProjectPath | Out-Null
}

foreach ($Part in $Parts) {
  $ZipPath = Join-Path $ScriptDir $Part
  if (!(Test-Path $ZipPath)) {
    throw "Missing part: $ZipPath"
  }
  Write-Host "Extracting $Part -> $ProjectPath"
  Expand-Archive -Path $ZipPath -DestinationPath $ProjectPath -Force
}

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "1. Copy .env.example to .env.local and fill your real keys locally/Vercel. Do not zip secrets."
Write-Host "2. Run the Supabase migration: supabase/v5_17_shopify_multisupplier_schema.sql"
Write-Host "3. Run: npm ci"
Write-Host "4. Run: npm run typecheck"
Write-Host "5. Run: npm run dev"
Write-Host "6. Open /atlas/integrations and click Sync Shopify."
