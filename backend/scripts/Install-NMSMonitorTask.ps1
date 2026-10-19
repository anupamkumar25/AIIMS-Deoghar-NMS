$ErrorActionPreference = "Stop"

$TaskName = "AIIMS Deoghar NMS Monitor"
$ScriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Split-Path -Parent $ScriptsDir
$PythonExe = Join-Path $BackendDir ".venv\Scripts\python.exe"
$Runner = Join-Path $ScriptsDir "Start-NMSMonitor.ps1"
$PowerShellExe = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

if (-not (Test-Path $PythonExe)) {
    throw "Python virtual environment not found: $PythonExe. Create/activate the project's .venv first."
}
if (-not (Test-Path (Join-Path $BackendDir "manage.py"))) {
    throw "manage.py not found in $BackendDir. Copy this patch into the existing project's backend folder."
}

$Action = New-ScheduledTaskAction -Execute $PowerShellExe -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Runner`"" -WorkingDirectory $BackendDir
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $CurrentUser
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$Principal = New-ScheduledTaskPrincipal -UserId $CurrentUser -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Automatically monitors registered devices in the AIIMS Deoghar NMS inventory every 30 seconds after this user signs in." -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName

Write-Host "Installed and started: $TaskName" -ForegroundColor Green
Write-Host "Monitor log: $(Join-Path $BackendDir 'logs\monitor.log')"
Write-Host "The task starts automatically whenever this Windows user signs in. Keep this Windows session signed in while monitoring is needed."
