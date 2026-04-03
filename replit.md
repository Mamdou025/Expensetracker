# ExpenseTracker

## Overview
Full-stack personal finance app that connects to Gmail via IMAP, reads bank transaction emails, extracts transaction data, and displays it in a React dashboard.

## Architecture
- **Frontend:** React (Create React App) in `client/` — built to `client/build/` and served by Express
- **Backend:** Node.js/Express API in `Server/Server.js`
- **Database:** SQLite at `Database/transactions.db`
- **Processing:** Python scripts in `Application/` — called via `child_process.spawn` from Node
- **DB Init:** Python script `Database/Database.py` run via `scripts/init-db.js`
- **Startup:** `scripts/start-production.js` → init DB → start Express server

## Key Files
- `package.json` — root orchestrator with build/start scripts
- `Server/Server.js` — Express API (transactions, tags, categories, keyword rules, email extraction)
- `Server/runtimeConfig.js` — environment config (PORT, HOST, SQLITE_PATH, PYTHON_CMD, EMAIL_*)
- `scripts/start-production.js` — production entry point
- `scripts/init-db.js` — database initialization
- `scripts/verify-deploy.js` — deployment smoke test
- `client/src/Services/api.js` — frontend API client (auto-resolves base URL)
- `Database/db_config.py` — Python DB path resolution (mirrors runtimeConfig.js)

## Environment Variables
- `PORT` — server port (default 5000)
- `HOST` — bind address (default 0.0.0.0)
- `SQLITE_PATH` — path to SQLite DB (default Database/transactions.db)
- `EMAIL_USER` — Gmail address for IMAP (optional for basic operation)
- `EMAIL_PASS` — Gmail app password for IMAP (optional for basic operation)
- `PYTHON_CMD` — Python binary name (default python3)

## Build & Run
- Build: `npm --prefix client run build`
- Start: `npm start` (runs `scripts/start-production.js`)
- Workflow: "Start application" on port 5000

## Important Notes
- Email extraction features require EMAIL_USER and EMAIL_PASS secrets
- Server node_modules in `Server/` are separate from root — sqlite3 native module must match platform
- The app gracefully starts without email credentials; email features just won't work
