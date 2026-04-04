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
- `Server/Server.js` — Express API (transactions, tags, categories, keyword rules, email extraction, PDF import)
- `Server/runtimeConfig.js` — environment config (PORT, HOST, SQLITE_PATH, PYTHON_CMD, EMAIL_*)
- `scripts/start-production.js` — production entry point
- `scripts/init-db.js` — database initialization
- `scripts/verify-deploy.js` — deployment smoke test
- `client/src/Services/api.js` — frontend API client (auto-resolves base URL)
- `Database/db_config.py` — Python DB path resolution (mirrors runtimeConfig.js)
- `Application/pdf_parser.py` — PDF statement text extraction and transaction line parser
- `Application/api_scripts/parse_pdf.py` — CLI wrapper for PDF parser (called by Express)
- `Application/api_scripts/import_pdf_confirm.py` — CLI wrapper for confirming/inserting parsed PDF transactions

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

## PDF Import API
- `POST /api/import-pdf` — upload a PDF statement (multipart form, field name `file`, max 20MB)
  - Returns: `{ document_id, bank, card_type, transactions_found, transactions: [...] }`
  - Parser auto-detects bank name and card type from PDF text
  - Each transaction has the same normalized shape as email transactions
- `POST /api/import-pdf/confirm` — insert parsed transactions into the database
  - Body: `{ transactions: [...] }` (the array from the parse response)
  - Returns: `{ inserted, errors, transactions: [...] }`
  - Transactions go through the same `Insert.insert_transaction()` pipeline (keyword rules, tags, etc.)
- Uploaded PDFs are stored in `uploads/` directory

## Dependencies
- **Python:** beautifulsoup4, PyYAML, pdfplumber (PDF text extraction)
- **Node (Server/):** express, cors, sqlite3, multer (file uploads)

## Important Notes
- Email extraction features require EMAIL_USER and EMAIL_PASS secrets
- Server node_modules in `Server/` are separate from root — sqlite3 native module must match platform
- The app gracefully starts without email credentials; email features just won't work
- PDF imports use `source_type="pdf"` and a SHA-256-based `source_ref` for document traceability
- The PDF parser supports common date formats (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, Mon DD YYYY) and amount patterns ($XX.XX)
