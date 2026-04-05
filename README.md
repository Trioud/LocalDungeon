# 🎲 LocalDungeon

A real-time, browser-based D&D 5e (2024 PHB) platform for parties without a DM. Players manage their own characters, roll dice, cast spells, track combat, and vote on group decisions together.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development (native)](#local-development-native)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Feature Overview](#feature-overview)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Socket.IO client |
| Backend | Fastify, Socket.IO, Awilix (DI), Prisma ORM |
| Database | PostgreSQL 16 |
| Cache / Pub-Sub | Redis 7 |
| Shared logic | TypeScript pure functions (Vitest tested) |
| Monorepo | pnpm workspaces |
| Audio | WebRTC P2P mesh + Deepgram STT (optional) |
| Storage | In-memory (dev) / S3-compatible (prod) |

---

## Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Node.js | 20 | https://nodejs.org |
| pnpm | 10 | `npm i -g pnpm` |
| Docker + Docker Compose | 24 / 2 | https://docs.docker.com/get-docker/ |
| Git | any | https://git-scm.com |

> **macOS shortcut:** `brew install node pnpm` then install Docker Desktop.

---

## Quick Start (Docker)

The fastest way to run everything — no manual database setup needed.

```bash
# 1. Clone
git clone https://github.com/Trioud/LocalDungeon.git
cd LocalDungeon

# 2. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Start all services (Postgres, Redis, API, Web)
docker compose up --build

# 4. Open the app
open http://localhost:3000
```

The API will be available at `http://localhost:3001`.  
The health endpoint: `http://localhost:3001/health`

To stop everything:
```bash
docker compose down
```

To wipe data volumes and start fresh:
```bash
docker compose down -v
```

---

## Local Development (native)

Running natively gives faster hot-reload and easier debugging.

### 1. Start infrastructure (Postgres + Redis only)

```bash
docker compose up postgres redis -d
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` if needed — the defaults work against the Docker Compose Postgres/Redis.

### 4. Set up the database

```bash
# Run all migrations and generate the Prisma client
pnpm --filter api db:migrate

# (Optional) Seed with sample data
pnpm --filter api db:seed
```

### 5. Start the dev servers

```bash
# Start API + Web in parallel with hot-reload
pnpm dev
```

| Service | URL |
|---------|-----|
| Web (Next.js) | http://localhost:3000 |
| API (Fastify) | http://localhost:3001 |
| Health check | http://localhost:3001/health |
| Prisma Studio | `pnpm --filter api db:studio` → http://localhost:5555 |

---

## Environment Variables

### `apps/api/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | `redis://localhost:6379` | Redis connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Min 32 chars. Signs access tokens |
| `JWT_REFRESH_SECRET` | ✅ | — | Min 32 chars. Signs refresh tokens |
| `PORT` | | `3001` | API server port |
| `NODE_ENV` | | `development` | `development` \| `test` \| `production` |
| `CORS_ORIGIN` | | `http://localhost:3000` | Allowed CORS origin |
| `STORAGE_PROVIDER` | | `memory` | `memory` (local) or `s3` (production) |
| `S3_BUCKET` | S3 only | — | S3 / Cloudflare R2 bucket name |
| `S3_REGION` | S3 only | — | e.g. `us-east-1` |
| `S3_ENDPOINT` | R2 only | — | Cloudflare R2 endpoint URL |
| `S3_ACCESS_KEY_ID` | S3 only | — | |
| `S3_SECRET_ACCESS_KEY` | S3 only | — | |
| `S3_PUBLIC_BASE_URL` | S3 only | — | CDN base URL for portrait images |
| `STT_PROVIDER` | | `mock` | `mock` (local) or `deepgram` (production) |
| `DEEPGRAM_API_KEY` | Deepgram only | — | Deepgram Nova-2 API key |

### `apps/web/.env.local`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | `http://localhost:3001` | Base URL for REST calls |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | `http://localhost:3001` | Socket.IO server URL |

---

## Available Scripts

Run from the **monorepo root** unless noted.

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + Web with hot-reload (parallel) |
| `pnpm build` | Production build for all packages |
| `pnpm test` | Run all tests (shared + api + web) |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Prettier format everything |
| `pnpm --filter api db:migrate` | Run Prisma migrations |
| `pnpm --filter api db:seed` | Seed the database |
| `pnpm --filter api db:studio` | Open Prisma Studio |
| `pnpm --filter api test` | API tests only |
| `pnpm --filter web test` | Web tests only |
| `pnpm --filter @local-dungeon/shared test` | Shared logic tests only |

---

## Project Structure

```
D-D_Expanded/
├── apps/
│   ├── api/                  # Fastify backend
│   │   ├── prisma/           # Schema + migrations
│   │   └── src/
│   │       ├── adapters/     # S3, STT provider implementations
│   │       ├── config/       # Env validation
│   │       ├── container.ts  # Awilix DI registrations
│   │       ├── handlers/     # REST route handlers
│   │       ├── ports/        # Interfaces (IFileStorage, ISTTProvider)
│   │       ├── repositories/ # Prisma data access
│   │       ├── services/     # Business logic
│   │       ├── socket/       # Socket.IO event handlers
│   │       └── validation/   # Zod schemas + middleware
│   └── web/                  # Next.js 14 frontend
│       ├── app/              # App Router pages
│       ├── components/       # React components by feature
│       └── lib/hooks/        # Custom React hooks
├── packages/
│   └── shared/               # Pure TS logic shared by api + web
│       └── src/
│           ├── combat/       # HP, conditions, death saves
│           ├── consensus/    # Voting system
│           ├── dice/         # Dice roller
│           ├── features/     # Class feature resources
│           ├── levelup/      # XP, level up, multiclassing
│           ├── nlp/          # Voice command parser
│           ├── readyaction/  # Ready action & opportunity attacks
│           ├── rest/         # Short/long rest logic
│           ├── rules/        # D&D 5e rules data
│           ├── sessionlog/   # Log export formatting
│           ├── spellcasting/ # Spell slot tracking
│           ├── weaponmastery/# 2024 PHB weapon mastery
│           └── webrtc/       # WebRTC signal types
├── docs/                     # Architecture + feature docs
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## Feature Overview

| Feature | Description |
|---------|-------------|
| 🎲 Dice Roller | Full notation support (`2d6+3`), roll history, crit highlighting |
| 🧙 Character Sheet | Full 5e stats, skills, saving throws, equipment |
| ⚔️ Combat Tracker | Initiative order, HP tracking, conditions, turn management |
| 💀 Death Saves | Automatic tracking at 0 HP, stabilisation |
| ✨ Spellcasting | Spell slot management, concentration tracking |
| 😴 Rest System | Short/long rest with hit dice recovery and party voting |
| 📈 Level Up | XP tracking, level-up wizard, multiclassing with prereq checks |
| 🔮 Class Features | Per-class resource tracking (Ki, Rage, Sorcery Points, etc.) |
| 🖼️ Portraits | Character portrait upload (local memory or S3/R2) |
| 💡 Inspiration | Heroic inspiration grant, use, and die-reroll flow |
| 🎤 Voice (STT) | Deepgram Nova-2 speech recognition with D&D vocabulary |
| 🗣️ NLP Commands | Voice → game action parser (13 intent types) |
| 📡 WebRTC Audio | Browser P2P voice chat, no server audio relay |
| 🗡️ Weapon Mastery | All 2024 PHB mastery properties for 30 weapons |
| 🔀 Multiclassing | Full multiclass support with proficiency grants and combined spell slots |
| 🗳️ Consensus Voting | Party-wide proposal + vote system (60s TTL) |
| ⚡ Ready Action | Declare triggers; opportunity attack validation |
| 📋 Session Log | Export combat log as TXT / Markdown / JSON |

---

## Troubleshooting

**Port already in use**
```bash
# Find and kill the process using port 3001
lsof -ti:3001 | xargs kill -9
```

**Database connection refused**
```bash
# Make sure Docker containers are running
docker compose ps
# Restart infrastructure
docker compose up postgres redis -d
```

**Prisma client out of sync**
```bash
pnpm --filter api exec prisma generate
```

**`pnpm` not found**
```bash
npm install -g pnpm
```

**Web can't reach API (CORS error)**  
Ensure `CORS_ORIGIN` in `apps/api/.env` matches your web URL (default `http://localhost:3000`).
