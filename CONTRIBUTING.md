# Contributing

Thank you for helping improve the AIIMS Deoghar NMS.

## Before making changes

1. Create a branch for your change.
2. Keep changes focused and explain the reason for them.
3. Never include live credentials, internal secrets, production IP inventories, or database/log files in commits.
4. Preserve Django migration history. If a model changes, generate and review the migration, then commit it.

## Local checks

Backend (from `backend`, with the virtual environment activated):

```powershell
python manage.py check
python manage.py test
```

Frontend (from `frontend`):

```powershell
npm install
npm run build
```

## Pull requests

Include a clear summary, steps to test, screenshots for UI changes where useful, and notes about any database migration or configuration change. Do not include sensitive network information in screenshots.
