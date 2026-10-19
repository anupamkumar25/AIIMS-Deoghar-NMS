$ErrorActionPreference = "Stop"

$ScriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptsDir
$PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
$LogDir = Join-Path $BackendDir "logs"
$LogFile = Join-Path $LogDir "monitor.log"

if (-not (Test-Path $PythonExe)) {
    "[$(Get-Date -Format s)] ERROR: Python virtual environment not found at $PythonExe" | Out-File -FilePath $LogFile -Append -Encoding utf8
    exit 1
}

New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
"`r`n[$(Get-Date -Format s)] Starting NMS monitor (interval=30s, workers=40)." | Out-File -FilePath $LogFile -Append -Encoding utf8
Set-Location $BackendDir

# This runs as a separate background process managed by Windows Task Scheduler.
# All output is appended to backend\logs\monitor.log.
& $PythonExe -u manage.py monitor_devices --interval 30 --workers 40 *>> $LogFile
$ExitCode = $LASTEXITCODE
"[$(Get-Date -Format s)] NMS monitor exited with code $ExitCode." | Out-File -FilePath $LogFile -Append -Encoding utf8
exit $ExitCode
