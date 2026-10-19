# AIIMS Deoghar Network Management System (NMS)

A locally hosted network-management application built with **Django REST Framework** and **React + Vite**. The current development milestone includes device inventory, locations, a dashboard summary, and ICMP reachability checks for registered devices. On Windows, the reachability monitor can be run using a Windows Scheduled Task.

> **Status:** Active development. This is not yet a production-ready NMS. SNMP polling, interface/bandwidth metrics, topology discovery, alert delivery, and production hardening remain future work.

## Current capabilities

- Register and list network devices through the Django API.
- Associate devices with locations.
- View inventory and summary information in the React dashboard.
- Check reachability of registered devices using the `monitor_devices` management command.
- Run the reachability monitor through Windows Task Scheduler.
- Use SQLite for local development; the Django settings also support a `DATABASE_URL` for a PostgreSQL deployment.

## Technology stack

- Backend: Python, Django, Django REST Framework, django-cors-headers
- Frontend: React, Vite, JavaScript
- Database: SQLite by default; PostgreSQL can be configured using `DATABASE_URL`
- Local target: Windows / PowerShell

## Prerequisites

- Git
- Python 3.12 recommended for a reproducible development environment
- Node.js LTS and npm
- Windows PowerShell for the supplied Windows monitoring scripts

## Run locally on Windows

Open PowerShell in the repository root.

### 1. Backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py check
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

If the project is a fresh checkout and the `inventory` migration has not been created yet, create it once before migrating:

```powershell
python manage.py makemigrations inventory
python manage.py migrate
```

Commit generated migration files to Git. Do **not** commit the local SQLite database.

Backend: <http://127.0.0.1:8000/>

### 2. Frontend

Open a second PowerShell terminal from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually <http://127.0.0.1:5173/>). The Vite development server proxies `/api` requests to Django at `127.0.0.1:8000`.

### 3. Reachability monitoring

For a one-time/manual check, open a terminal in `backend` with the virtual environment activated and run:

```powershell
python manage.py monitor_devices --once
```

To run continuous monitoring in the foreground:

```powershell
python manage.py monitor_devices
```

The Windows Scheduled Task scripts, when present in `backend/scripts/`, can install the automatic monitor for the current Windows user. Check `backend/scripts/Install-NMSMonitorTask.ps1` and its accompanying installation instructions before running them. The task is configured to start at user sign-in; the user session must remain signed in for that setup.

**Interpretation:** no ICMP reply means “no ping response,” not necessarily that a device is powered off. Firewalls, ACLs, routing, and device settings can block ICMP.

## Useful development commands

Run these from `backend` with the virtual environment activated:

```powershell
python manage.py check
python manage.py test
python manage.py showmigrations
```

Build the frontend from `frontend`:

```powershell
npm run build
```

## API endpoints

- `GET /api/devices/` — list devices
- `POST /api/devices/` — create a device
- `GET /api/locations/` — list locations
- `GET /api/dashboard/summary/` — dashboard summary

The exact fields and supported filters are defined by the current API serializers and views.

## GitHub setup

1. Create a **private** repository initially if this is for internal institute network infrastructure.
2. Copy the project files and this repository's `.gitignore` and `README.md` into the repository root.
3. Verify `backend/db.sqlite3`, `.venv`, `node_modules`, logs, `.env` files, and credentials are not staged.
4. Commit Django migration files, source code, scripts, and safe documentation.
5. Push to the private GitHub repository.

Example commands (run from the repository root):

```powershell
git init
git status
git add .
git status
git commit -m "Initial NMS project setup"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your actual repository URL. If Git is already initialized, do not run `git init` again; if `origin` already exists, inspect it with `git remote -v` rather than adding a duplicate.

## Security and operational notes

- Only monitor institute devices and IP ranges for which you have explicit authorization.
- Do not commit passwords, tokens, SNMP community strings, private keys, real `.env` files, database files, or log files.
- Keep this repository private while it contains internal network details or institute-specific configuration.
- The development server is for local development only. Do not expose it directly to the public internet.
- Before any shared or production deployment, set a strong secret key, `DEBUG=False`, explicit allowed hosts and trusted origins, proper authentication/permissions, HTTPS, backups, and an approved deployment configuration.
- Use SNMPv3 where supported. If legacy SNMPv1/v2c is required, restrict it to approved management networks and protect community strings.
- Keep monitoring read-only until any configuration-changing capability has been separately reviewed and approved.

## Roadmap

- [x] Device inventory and locations
- [x] Dashboard summary
- [x] Registered-device reachability checks
- [x] Windows scheduled reachability monitoring (local setup)
- [ ] SNMP polling and interface inventory
- [ ] Bandwidth and performance history
- [ ] Alerts and incident history
- [ ] Network topology visualization
- [ ] Authentication, roles, audit logging, and production hardening

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues privately as described in [SECURITY.md](SECURITY.md).
