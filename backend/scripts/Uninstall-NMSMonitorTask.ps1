$ErrorActionPreference = "Stop"
$TaskName = "AIIMS Deoghar NMS Monitor"
$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($null -eq $Task) {
    Write-Host "Task not found: $TaskName"
    exit 0
}
Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Removed scheduled task: $TaskName" -ForegroundColor Green
Write-Host "Your NMS source files and database were not changed."
