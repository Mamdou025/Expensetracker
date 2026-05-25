# ──────────────────────────────────────────────────────────────
#  exptrackr — Dockerfile
#  Multi-stage build:
#    builder  — installs all deps and compiles the React frontend
#    final    — lean runtime image (Node 20 + Python 3.11)
# ──────────────────────────────────────────────────────────────

# ── Stage 1: build ────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# System deps needed at build time (Python for native modules + gyp)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip make g++ \
    && rm -rf /var/lib/apt/lists/*

# ── Install Node dependencies (three separate trees) ──────────

# 1. Root (auth, session, openai, …)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 2. Server (express, sqlite3, multer, …)
COPY Server/package.json Server/package-lock.json ./Server/
RUN npm --prefix Server ci

# 3. Client (React CRA, recharts, tailwind, …)
COPY client/package.json client/package-lock.json ./client/
RUN npm --prefix client ci --legacy-peer-deps

# ── Copy source and build the React frontend ──────────────────
COPY . .
RUN npm run build


# ── Stage 2: runtime ──────────────────────────────────────────
FROM node:20-bookworm-slim AS final

WORKDIR /app

# Python 3.11 + runtime system libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    # libyaml — fast C backend for PyYAML
    libyaml-dev \
    # libgomp — OpenMP, needed by some PyMuPDF wheels
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python PDF/email parsing packages
COPY requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# ── Copy built artefacts from builder ─────────────────────────

# Root node_modules (auth deps: pg, bcryptjs, express-session, …)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Server (Express API + its own node_modules)
COPY --from=builder /app/Server ./Server

# Scripts
COPY --from=builder /app/scripts ./scripts

# Database schema / init scripts
COPY --from=builder /app/Database ./Database

# Python application (PDF parsers, email extractor, …)
COPY --from=builder /app/Application ./Application

# Pre-built React frontend
COPY --from=builder /app/client/build ./client/build

# requirements.txt already copied; no other root-level files strictly needed
COPY --from=builder /app/requirements.txt ./requirements.txt

# Persistent data directories
RUN mkdir -p uploads Database

EXPOSE 5000

# start-production.js: initialises the SQLite DB, then starts Express
CMD ["node", "scripts/start-production.js"]
