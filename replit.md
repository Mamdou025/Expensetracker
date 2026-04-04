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
- `Application/api_scripts/list_pdf_templates.py` — CLI wrapper returning template metadata as JSON
- `client/src/components/BankTemplatesPage.jsx` — UI page listing all registered bank templates

## Environment Variables
- `PORT` — server port (default 5000)
- `HOST` — bind address (default 0.0.0.0)
- `NODE_ENV` — `development` (workspace default) or `production` (deployment)
- `SQLITE_PATH` — path to SQLite DB (default Database/transactions.db)
- `EMAIL_USER` — Gmail address for IMAP (**required in production**, optional in development)
- `EMAIL_PASS` — Gmail app password for IMAP (**required in production**, optional in development)
- `PYTHON_CMD` — Python binary name (default python3)

## Environment Modes
- **Workspace (development):** `NODE_ENV` defaults to `development`. Email credentials are optional — the app starts without them and email features are simply disabled. Set via `.replit` `[userenv.shared]`.
- **Deployment (production):** `NODE_ENV=production` is set via `.replit` `[userenv.production]`. Email credentials are **strictly required** — startup will fail if `EMAIL_USER` or `EMAIL_PASS` is missing. Set these as Replit Secrets before deploying.

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

## Template-Based PDF Parsing
- Bank-specific template parsers live in `Application/parsers/`
- Each template has a `detect(full_text)` function and a `parse(pages_text, document_id)` function
- `pdf_parser.py` tries template parsers first (via `TEMPLATE_PARSERS` list); falls back to generic line-by-line parsing
- **CIBC Chequing** (`parsers/cibc_chequing.py`): handles `Mon DD` dates (year from header), Withdrawals/Deposits/Balance columns, multi-line descriptions, FX conversion lines, and service charges. Validates totals against account summary.
- **RBC Visa Credit** (`parsers/rbc_credit.py`): handles French-format RBC credit card statements — `DD MON` dates with French month names, amounts in `XX,XX $` format, parenthesized payments `(100,00 $)`, two-date lines (operation + posting), reference number filtering, and right-column noise removal. Validates against statement summary totals.
- To add a new bank: create `Application/parsers/<bank>_<type>.py` with `detect()` + `parse()` + `metadata()`, import it in `pdf_parser.py`, and add to `TEMPLATE_PARSERS`

## Duplicate Detection
- **Parse-time detection**: When a PDF is parsed (`POST /api/import-pdf`), the server checks each transaction against existing DB records before sending to the frontend
- **Matching key**: date + amount + bank + full description (case-insensitive, trimmed)
- **Document-level check**: Also checks if the same `source_ref` (SHA-256 hash) was already imported — flags all transactions as duplicates
- **Frontend behavior**: Duplicates are auto-deselected, shown with yellow "Duplicate" badge, and a count banner appears at the top
- **Safety net**: `import_pdf_confirm.py` re-checks each transaction against the DB before insertion — duplicates are skipped even if the user overrides frontend warnings
- **Response fields**: `is_duplicate` per transaction, `duplicate_count` and `document_already_imported` at the parse result level; `skipped` and `skipped_transactions` at the confirm result level

## Transaction Types
- Each transaction has a `transaction_type` column: `'expense'` (default) or `'income'`
- PDF parsers return a `direction` field ('withdrawal', 'deposit', 'purchase', 'payment')
- During PDF import confirmation, `direction` is mapped: deposit/payment → `income`, withdrawal/purchase → `expense`
- Dashboard stats, time charts, and category pie charts only count `expense` transactions in spending totals
- Deposits are shown with green styling and `+` prefix in both the transaction table and PDF preview
- Existing transactions default to `expense` when the column is added via schema migration

## Important Notes
- Email extraction features require EMAIL_USER and EMAIL_PASS secrets
- Server node_modules in `Server/` are separate from root — sqlite3 native module must match platform
- The app gracefully starts without email credentials; email features just won't work
- PDF imports use `source_type="pdf"` and a SHA-256-based `source_ref` for document traceability
- The generic PDF parser supports common date formats (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, Mon DD YYYY) and amount patterns ($XX.XX)
