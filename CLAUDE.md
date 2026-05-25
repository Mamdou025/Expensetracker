# exptrackr — Developer & Claude Reference

This file is the authoritative guide for setting up, running, and understanding
**exptrackr** locally. Claude should read this file in full before making any
changes to the codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Layout](#2-repository-layout)
3. [Architecture](#3-architecture)
4. [Prerequisites](#4-prerequisites)
5. [Local Setup — Option A: Docker (recommended)](#5-local-setup--option-a-docker-recommended)
6. [Local Setup — Option B: Bare-metal (no Docker)](#6-local-setup--option-b-bare-metal-no-docker)
7. [Environment Variables Reference](#7-environment-variables-reference)
8. [Running the App](#8-running-the-app)
9. [Database](#9-database)
10. [Python Layer](#10-python-layer)
11. [Frontend (React)](#11-frontend-react)
12. [Common Development Tasks](#12-common-development-tasks)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Project Overview

**exptrackr** is a Canadian personal finance tracker.  Users import bank
transactions from three sources:

| Source | How |
|---|---|
| PDF bank statements | Upload via UI → Python parser → SQLite |
| Gmail/IMAP emails | Server fetches via IMAP → Python extractor → SQLite |
| Inbound email forwarding | Bank emails forwarded to `inbox+<token>@exptracker.app` → webhook → SQLite |

Transactions are stored in **SQLite**, tagged with categories and custom tags,
and displayed in a React dashboard with charts, filters, and an AI chat panel.

User accounts and session state are stored in **PostgreSQL**.

---

## 2. Repository Layout

```
exptrackr/
├── Application/               # Python business logic
│   ├── api_scripts/           # CLI wrappers called by Express via child_process
│   │   ├── parse_pdf.py       # Parse a PDF, return JSON
│   │   ├── import_pdf_confirm.py  # Insert parsed transactions into SQLite
│   │   └── list_pdf_templates.py  # List registered bank template metadata
│   ├── parsers/               # One file per bank template
│   │   ├── cibc_chequing.py
│   │   ├── cibc_credit.py
│   │   ├── capital_one_credit.py
│   │   ├── mbna_credit.py
│   │   ├── rbc_credit.py
│   │   ├── neo_credit.py      # Uses PyMuPDF (font-obfuscated PDFs)
│   │   ├── neo_credit_world_elite.py
│   │   └── neo_base.py        # Shared Neo logic
│   ├── emailextract.py        # IMAP email fetcher
│   ├── pdf_parser.py          # Template dispatcher + generic fallback
│   └── ...
│
├── client/                    # React frontend (Create React App)
│   ├── public/
│   ├── src/
│   │   ├── components/        # Page-level components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── TransactionDashboard.jsx
│   │   │   ├── PDFImportPage.jsx
│   │   │   ├── EmailPage.jsx
│   │   │   ├── ChatPage.jsx
│   │   │   ├── BankTemplatesPage.jsx
│   │   │   └── Settings/
│   │   ├── contexts/          # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── Services/
│   │   │   └── api.js         # Fetch wrapper + base URL resolution
│   │   ├── lib/
│   │   │   └── liquid-glass/  # Local patched liquid-glass-react (noFloat mode)
│   │   └── ui/
│   │       └── BrandIcon.jsx  # Icon component (Solar icon set via @iconify)
│   └── package.json
│
├── Database/
│   ├── Database.py            # SQLite schema creation + migrations
│   ├── db_config.py           # Path resolution for SQLITE_PATH env var
│   └── transactions.db        # Created at runtime (git-ignored)
│
├── scripts/
│   ├── start-production.js    # Entry point: init DB → start Express
│   ├── init-db.js             # Runs Database/Database.py via python3
│   ├── install-python-deps.js # Best-effort pip install at deploy time
│   └── verify-deploy.js       # Smoke test for deployment health checks
│
├── Server/
│   ├── Server.js              # Express app + all API routes
│   ├── auth.js                # bcrypt login, express-session, PG session store
│   ├── crypto.js              # AES-256 email body encryption (uses INBOUND_EMAIL_SECRET)
│   ├── runtimeConfig.js       # Centralised env var parsing + validation
│   └── package.json           # Server-only deps: express, cors, sqlite3, multer
│
├── uploads/                   # Uploaded PDF files (git-ignored, created at runtime)
│
├── requirements.txt           # Python deps: beautifulsoup4 PyYAML pdfplumber PyMuPDF
├── package.json               # Root orchestrator (auth deps live here: pg, bcryptjs, …)
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # App + PostgreSQL for local dev
├── .env.example               # All environment variables documented
└── CLAUDE.md                  # ← you are here
```

---

## 3. Architecture

```
Browser (React, port 3000 dev / 5000 prod)
    │  HTTP / SSE
    ▼
Express (Server/Server.js, port 5000)
    ├── Static files: client/build/  (production mode)
    ├── Auth routes:  /api/login  /api/logout  /api/me
    │       └── PostgreSQL  (sessions + users table)
    ├── Transaction routes: /api/transactions  /api/tags  /api/categories …
    │       └── SQLite  (Database/transactions.db)
    ├── PDF import: /api/import-pdf  /api/import-pdf/confirm
    │       └── child_process.spawn → python3 Application/api_scripts/parse_pdf.py
    ├── Email extract: /api/extract-emails
    │       └── child_process.spawn → python3 Application/emailextract.py
    ├── Inbound webhook: /api/inbound-email  (POST, HMAC-verified)
    │       └── child_process.spawn → python3 Application/api_scripts/process_queue.py
    └── AI Chat: /api/chat  (OpenAI streaming SSE)
```

### Key design decisions

- **SQLite is for transaction data only.**  It is lightweight, file-based, and
  requires no separate service.  Each user's transactions are scoped by
  `user_id` column.
- **PostgreSQL is for auth only.**  The `users` and `sessions` tables are
  managed by `Server/auth.js` using `pg` (via root `node_modules`) and
  `connect-pg-simple`.
- **Three separate `node_modules` trees.**  Root `package.json` holds auth
  dependencies (`pg`, `bcryptjs`, `express-session`, `openai`, …).
  `Server/package.json` holds the Express server deps.  `client/package.json`
  holds the React app deps.  Node resolves `require('pg')` from
  `Server/auth.js` by walking up to root `node_modules` — this is intentional.
- **Python is called via `child_process.spawn`**, never imported.  The Express
  server stays pure Node.js; Python handles PDF/email parsing.
- **`PYTHONPATH`** is set to `python_vendor/` at startup so that pip-installed
  packages vendored at build time are found even if pip isn't in PATH.

---

## 4. Prerequisites

### Docker path (recommended)
| Tool | Minimum version |
|---|---|
| Docker Desktop (or Docker Engine) | 24+ |
| Docker Compose plugin | v2 (`docker compose`) |

### Bare-metal path
| Tool | Minimum version | Notes |
|---|---|---|
| Node.js | 20 | Use nvm or fnm |
| npm | 10 | Comes with Node 20 |
| Python | 3.11 | Must be on PATH as `python3` |
| pip | 23+ | `python3 -m pip` |
| PostgreSQL | 15 or 16 | Only the server — `psql` client optional |

---

## 5. Local Setup — Option A: Docker (recommended)

```bash
# 1. Clone the repo
git clone <repo-url> exptrackr
cd exptrackr

# 2. Create your .env file
cp .env.example .env

# 3. Generate a SESSION_SECRET and paste it into .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Edit .env → set SESSION_SECRET=<generated value>

# 4. (Optional) Add OpenAI key to .env if you want AI chat
# AI_INTEGRATIONS_OPENAI_API_KEY=sk-...

# 5. Build and start
docker compose up --build

# App is now running at http://localhost:5000
# PostgreSQL is exposed on localhost:5432 (user: exptrackr / pass: exptrackr / db: exptrackr)
```

Subsequent starts (no code changes):
```bash
docker compose up
```

After code changes:
```bash
docker compose up --build
```

Stop everything:
```bash
docker compose down          # keeps volumes (data preserved)
docker compose down -v       # also removes volumes (wipes data)
```

---

## 6. Local Setup — Option B: Bare-metal (no Docker)

### 6.1 Install PostgreSQL and create the database

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Ubuntu / Debian
sudo apt install postgresql-16
sudo systemctl start postgresql

# Create the database and user
psql -U postgres -c "CREATE USER exptrackr WITH PASSWORD 'exptrackr';"
psql -U postgres -c "CREATE DATABASE exptrackr OWNER exptrackr;"
```

### 6.2 Install Node dependencies

```bash
# Root deps (auth, session, openai, …)
npm install

# Server deps (express, sqlite3, multer, …)
npm run install:server

# Client deps (React, tailwind, recharts, …)
npm run install:client
```

> **Why three installs?**  See [Architecture → Key design decisions](#architecture).

### 6.3 Install Python dependencies

```bash
pip3 install -r requirements.txt
# or, if pip3 is not recognised:
python3 -m pip install -r requirements.txt
```

If you get "externally managed environment" on Debian/Ubuntu 23.04+:
```bash
python3 -m pip install --break-system-packages -r requirements.txt
# or use a venv (see §13 Troubleshooting)
```

### 6.4 Create your .env file

```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL and SESSION_SECRET at minimum
```

Minimum required `.env` for local dev:
```
DATABASE_URL=postgresql://exptrackr:exptrackr@localhost:5432/exptrackr
SESSION_SECRET=<32-char random hex>
NODE_ENV=development
```

### 6.5 Build and start

**Option B1 — production-like (single terminal, built frontend):**
```bash
npm run build      # compiles React app into client/build/
npm start          # inits SQLite DB, then starts Express on port 5000
# Visit http://localhost:5000
```

**Option B2 — hot-reload (two terminals):**
```bash
# Terminal 1 — API server only
NODE_ENV=development npm run start:server

# Terminal 2 — CRA dev server (auto-reloads on file changes)
npm --prefix client start
# Visit http://localhost:3000
# The frontend automatically proxies API calls to http://localhost:5000
```

> `api.js` detects `window.location.port === '3000'` and directs all fetch
> calls to `http://localhost:5000` automatically — no extra config needed.

---

## 7. Environment Variables Reference

Copy `.env.example` for the full annotated list. Summary:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL DSN for auth/sessions |
| `SESSION_SECRET` | **Yes** | — | Signs session cookies; also seeds AES-256 email encryption key |
| `NODE_ENV` | No | `development` | `production` enables secure cookies, requires client build |
| `PORT` | No | `5000` | Express listen port |
| `HOST` | No | `0.0.0.0` | Express bind address |
| `SQLITE_PATH` | No | `Database/transactions.db` | Path to SQLite file |
| `PYTHON_CMD` | No | `python3` | Python binary name |
| `EMAIL_USER` | No | — | Gmail address for IMAP fetching |
| `EMAIL_PASS` | No | — | Gmail App Password (not account password) |
| `INBOUND_EMAIL_SECRET` | No | — | Webhook HMAC secret + encryption root key |
| `FORWARDING_DOMAIN` | No | `exptracker.app` | Domain for per-user forwarding addresses |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | No | — | OpenAI API key for AI chat |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI base URL (override for Azure / proxy) |
| `REACT_APP_API_URL` | No | auto | Frontend API base URL override |

**Rules enforced by `Server/runtimeConfig.js`:**
- `EMAIL_USER` and `EMAIL_PASS` must either both be set or both be absent.
- `ALLOW_PLAINTEXT_CREDENTIALS=1` is rejected when `NODE_ENV=production`.
- When `NODE_ENV=production`, Express requires the React build to exist
  (`client/build/index.html`).

---

## 8. Running the App

### Standard start (production mode)
```bash
npm start
# → scripts/start-production.js
#   1. Validates runtimeConfig
#   2. Runs Database/Database.py (creates/migrates SQLite schema)
#   3. Starts Server/Server.js
```

### Development server only (no frontend build needed)
```bash
npm run start:server
# → npm --prefix Server run start → node Server.js
```

### React dev server (hot-reload, separate terminal)
```bash
npm --prefix client start
# CRA dev server at http://localhost:3000
# API calls automatically go to http://localhost:5000
```

### Build frontend
```bash
npm run build
# → npm --prefix client run build
# Output: client/build/  (served by Express at /)
```

### Initialise / migrate the database manually
```bash
npm run init:db
# → scripts/init-db.js → python3 Database/Database.py
```

---

## 9. Database

### SQLite (transactions)

- **File:** `Database/transactions.db` (created on first startup)
- **Schema managed by:** `Database/Database.py` — idempotent, safe to re-run
- **Migration strategy:** `ALTER TABLE … ADD COLUMN IF NOT EXISTS` — no
  destructive migrations; new columns get default values
- **Path resolution:** `Database/db_config.py` mirrors `Server/runtimeConfig.js`
  — both read `SQLITE_PATH` env var, default to `Database/transactions.db`
  relative to repo root

**Key tables:**

| Table | Purpose |
|---|---|
| `transactions` | All financial transactions (amount, description, date, bank, category, tags, user_id, …) |
| `tags` | Tag definitions |
| `transaction_tags` | Many-to-many join |
| `keyword_rules` | Auto-categorisation rules (keyword → category/tags) |
| `chat_usage` | AI chat token usage log |
| `email_samples` | Raw fetched/forwarded emails (body optionally AES-encrypted) |
| `user_bank_accounts` | User's registered bank accounts |

### PostgreSQL (auth)

- **Schema managed by:** `Server/auth.js` → `ensureAuthTables()` called at startup
- **Tables:** `users`, `sessions`
- **ORM:** None — raw `pg` queries

---

## 10. Python Layer

### Packages (requirements.txt)

| Package | Used for |
|---|---|
| `beautifulsoup4` | HTML email body parsing |
| `PyYAML` | `Application/config.yml` (keyword rules config) |
| `pdfplumber` | PDF text extraction (most bank parsers) |
| `PyMuPDF` (fitz) | Neo Financial PDFs — font-obfuscated, requires raw glyph access |

### How Express calls Python

```javascript
// Example from Server.js
const child = spawn(pythonCmd, [
  path.join(repoRoot, 'Application', 'api_scripts', 'parse_pdf.py'),
  '--file', uploadedFilePath,
  '--user', userId,
], { env: { ...process.env, SQLITE_PATH: dbPath } });
```

- Python scripts read `SQLITE_PATH` from the environment to locate the DB.
- Scripts communicate via **stdout JSON** + **exit code**.
- `PYTHONPATH` is set to `python_vendor/` so vendored packages are found
  even when pip is not in the production PATH.

### Adding a new bank parser

1. Create `Application/parsers/<bank>_<type>.py` with three functions:
   ```python
   def metadata() -> dict: ...   # { "bank": "...", "card_type": "..." }
   def detect(full_text: str) -> bool: ...
   def parse(pages_text: list[str], document_id: str, filepath: str) -> list[dict]: ...
   ```
2. Import it in `Application/pdf_parser.py` and append to `TEMPLATE_PARSERS`.
3. Test with `python3 Application/api_scripts/parse_pdf.py --file sample.pdf`.

---

## 11. Frontend (React)

### Tech stack

| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| react-router-dom | 6 | Client-side routing |
| Tailwind CSS | 3 | Utility-class styling |
| recharts | 2 | Line/bar/pie charts |
| i18next + react-i18next | 25 / 15 | EN/FR translations |
| @iconify/react + @iconify-json/solar | — | Icon set (Solar icons) |
| liquid-glass-react | 1.1.1 | SVG feDisplacementMap glass effect |

### Theme system

- Dark mode is the default. Preference is saved in `localStorage`.
- `ThemeContext` (`client/src/contexts/ThemeContext.jsx`) toggles a `.light`
  class on `<html>`.
- `client/src/index.css` remaps all dark Tailwind classes to light equivalents
  when `.light` is present on `<html>`.

### `liquid-glass-react` — local patch

The npm package (`liquid-glass-react@1.1.1`) always applies
`transform: translate(-50%, -50%)`, making it float-only.  A patched version
lives at `client/src/lib/liquid-glass/` (sucrase-converted TypeScript + added
`noFloat` prop).  **Import from the local path, not the npm package:**

```javascript
import LiquidGlass from '../lib/liquid-glass';  // local patched version
// NOT: import LiquidGlass from 'liquid-glass-react';
```

Pass `noFloat` on every usage to get in-flow document layout:
```jsx
<LiquidGlass noFloat cornerRadius={24} padding="12px 20px">
  content
</LiquidGlass>
```

### API base URL

`client/src/Services/api.js` resolves the base URL automatically:

| Scenario | Base URL |
|---|---|
| `REACT_APP_API_URL` env var set | that value |
| CRA dev server (`localhost:3000`) | `http://localhost:5000` |
| All other cases (production, Docker) | `""` (relative — same origin) |

---

## 12. Common Development Tasks

### Add a new API route

Edit `Server/Server.js`.  Routes follow the pattern:
```javascript
app.get('/api/my-route', requireAuth, async (req, res) => {
  const db = new sqlite3.Database(dbPath);
  // ...
  db.close();
});
```

### Add a new React page

1. Create `client/src/components/MyPage.jsx`
2. Add a `<Route>` in `client/src/App.js`
3. Add a nav link in the header component

### Run a one-off Python script

```bash
SQLITE_PATH=Database/transactions.db python3 Application/api_scripts/parse_pdf.py \
  --file /path/to/statement.pdf
```

### Inspect the SQLite database

```bash
sqlite3 Database/transactions.db
sqlite> .tables
sqlite> SELECT * FROM transactions LIMIT 5;
sqlite> .quit
```

### Inspect PostgreSQL (sessions/users)

```bash
# Docker
docker compose exec postgres psql -U exptrackr -d exptrackr

# Bare-metal
psql postgresql://exptrackr:exptrackr@localhost:5432/exptrackr

-- \dt         list tables
-- \d users    describe users table
```

### Reset everything (wipe all data)

```bash
# Docker
docker compose down -v && docker compose up --build

# Bare-metal
rm -f Database/transactions.db      # wipe SQLite
# Drop and recreate the PG database for a clean auth state
psql -U postgres -c "DROP DATABASE exptrackr;"
psql -U postgres -c "CREATE DATABASE exptrackr OWNER exptrackr;"
npm run init:db
```

---

## 13. Troubleshooting

### `Error: Cannot find module 'pg'`
`pg` lives in root `node_modules`, not `Server/node_modules`.  Run `npm install`
at the repo root.

### `Error: SQLITE_CANTOPEN` or database path errors
Set `SQLITE_PATH` explicitly or ensure the `Database/` directory exists:
```bash
mkdir -p Database
```

### `Error: Client build not found`
The server requires `client/build/index.html` in production mode.  Either:
- Run `npm run build` first, or
- Set `NODE_ENV=development` to skip this check.

### Python `ModuleNotFoundError`
Install the requirements:
```bash
pip3 install -r requirements.txt
```
If using a system-managed Python (Debian/Ubuntu 23.04+):
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Then set PYTHON_CMD=.venv/bin/python3 in your .env
```

### PostgreSQL connection refused
- Docker: wait for the health check — `docker compose ps` should show
  `postgres` as `healthy`.
- Bare-metal: confirm PostgreSQL is running (`pg_isready -U exptrackr`) and
  that `DATABASE_URL` in `.env` is correct.

### `EMAIL_USER and EMAIL_PASS must either both be set or both be absent`
Set both or neither in `.env`.  They are optional — removing both disables the
email tab gracefully.

### Tailwind classes not applying in new files
CRA + PostCSS + Tailwind are pre-configured.  If a brand-new CSS class is
missing, ensure `client/tailwind.config.js` (or the `content` glob) covers
your file path.

### Port 5000 already in use
```bash
lsof -i :5000          # find the PID
kill -9 <PID>
# or change PORT in .env
```
