# Starts the Vite dev server, builds the API, then runs vikunja.exe.
# Frontend stays up until the API process exits.
# Usage, from the repo root: powershell -ExecutionPolicy Bypass -File .\dev.ps1

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Stop-ProcessTree([int]$ProcessId) {
	if ($ProcessId -le 0) {
		return
	}
	& taskkill.exe /PID $ProcessId /T /F 2>$null | Out-Null
}

$exe = Join-Path $root "vikunja.exe"
Get-CimInstance Win32_Process -Filter "Name = 'vikunja.exe'" -ErrorAction SilentlyContinue |
	Where-Object { $_.ExecutablePath -eq $exe } |
	ForEach-Object { Stop-ProcessTree $_.ProcessId }

Write-Host "Starting frontend: pnpm run dev"
$frontend = Start-Process `
	-FilePath "cmd.exe" `
	-ArgumentList @("/d", "/c", "pnpm run dev") `
	-WorkingDirectory (Join-Path $root "frontend") `
	-PassThru `
	-NoNewWindow

if (-not $frontend) {
	Write-Error "Could not start pnpm run dev"
	exit 1
}

try {
	Write-Host "Building API: mage build"
	& mage build
	if ($LASTEXITCODE -ne 0) {
		Write-Error "mage build failed with exit code $LASTEXITCODE"
		exit $LASTEXITCODE
	}

	Write-Host "Starting API: vikunja.exe"
	& $exe
	if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
		exit $LASTEXITCODE
	}
} finally {
	Write-Host "Stopping frontend"
	Stop-ProcessTree $frontend.Id
}
