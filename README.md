# Link2Pay

Link2Pay is a Stellar-based invoicing app for freelancers and small teams. Create an invoice, share a payment link, and receive on-chain payment with status tracking from `DRAFT` to `PAID`.

## Highlights

- Shareable invoice links with line items, taxes, and multiple assets (`XLM`, `USDC`, `EURC`).
- Non-custodial payments through Freighter wallet signing.
- Real-time invoice/payment lifecycle tracking in the dashboard.
- One-command Linux setup: `./setup.sh`.
- Local run launcher (binary-like executable): `./link2pay`.
- Local PostgreSQL is provisioned with Docker (`docker compose`).

## Overview

Link2Pay is a full-stack TypeScript monorepo:

- Frontend: React + Vite
- Backend: Express + Prisma
- Database: PostgreSQL
- Blockchain: Stellar SDK + Horizon API

### Who is this for?

- Freelancers that want fast crypto-native invoice settlement.
- Teams validating Stellar payment flows end to end.
- Developers looking for a practical full-stack Stellar reference project.

### Project status

Hackathon project. Ready for demos and local deployments; production hardening is still in progress.

## Usage

### 1. Prepare everything

```bash
./setup.sh
```

### 2. Run the web locally

```bash
./link2pay
```

This command starts:

- Backend API on `http://localhost:3001`
- Frontend preview on `http://localhost:4173`

Health check:

- `http://localhost:3001/api/health`

### 3. Business flow

1. Freelancer connects Freighter wallet.
2. Freelancer creates and shares an invoice link.
3. Client opens `/pay/:invoiceId`, connects wallet, signs payment.
4. Invoice status updates after on-chain confirmation.

## Installation

Install requirements first:

- Linux
- Node.js `18+`
- npm
- Docker Engine + Docker Compose plugin

Useful links:

- Docker Engine install: `https://docs.docker.com/engine/install/`
- Docker Compose install (Linux): `https://docs.docker.com/compose/install/linux/`
- Docker post-install (non-root Docker usage): `https://docs.docker.com/engine/install/linux-postinstall/`
- Node.js download: `https://nodejs.org/en/download`
- Freighter wallet: `https://www.freighter.app/`

Run this setup flow:

```bash
# 1) clone (skip if you already have the repo)
git clone <your-repo-url>
cd link2pay-app

# 2) prepare and build everything
chmod +x setup.sh link2pay
./setup.sh

# 3) run locally
./link2pay
```

`./setup.sh` automates env file preparation, Docker PostgreSQL startup, dependency install, Prisma sync, and backend/frontend builds.

Default local database URL configured by setup:

- `postgresql://link2pay:link2pay@localhost:5432/link2pay?schema=public`

Stop local app with `Ctrl+C`.

## Configuration

Use `.env.example` in each app as the source of truth.

### Backend (`backend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | API port (default `3001`) |
| `FRONTEND_URL` | No | CORS origin for frontend |
| `STELLAR_NETWORK` | No | `testnet` or `mainnet` |
| `HORIZON_URL` | No | Stellar Horizon endpoint |
| `NETWORK_PASSPHRASE` | No | Stellar network passphrase |

### Frontend (`frontend/.env`)

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | No | Backend base URL |
| `VITE_STELLAR_NETWORK` | No | Network mode in UI |
| `VITE_HORIZON_URL` | No | Horizon endpoint |
| `VITE_NETWORK_PASSPHRASE` | No | Network passphrase |

## API At A Glance

- Health: `GET /api/health`
- Invoices: `backend/src/routes/invoices.ts`
- Payments: `backend/src/routes/payments.ts`
- Saved clients: `backend/src/routes/clients.ts`

## Development

```bash
# Backend dev server (watch mode)
cd backend
npm run dev

# Frontend dev server
cd frontend
npm run dev
```

Useful backend commands:

| Command | Purpose |
| --- | --- |
| `cd backend && npm run dev` | Start backend in watch mode for development |
| `cd backend && npm run build` | Compile TypeScript into `dist/` |
| `cd backend && npm start` | Run compiled backend from `dist/index.js` |
| `cd backend && npm run prisma:generate` | Regenerate Prisma client after schema changes |
| `cd backend && npx prisma db push` | Sync schema directly to database (current repo default) |
| `cd backend && npm run prisma:migrate` | Create/apply a development migration |
| `cd backend && npx prisma migrate deploy` | Apply existing migrations in deployment environments |
| `cd backend && npm run prisma:studio` | Open Prisma Studio UI |
| `cd backend && npm run test` | Run backend tests with Vitest |

Useful local infrastructure commands:

| Command | Purpose |
| --- | --- |
| `docker compose up -d postgres` | Start local PostgreSQL container |
| `docker compose ps` | Check local container status |
| `docker compose down` | Stop local containers |

## Repository Layout

```text
link2pay-app/
|- backend/
|- frontend/
|- docker-compose.yml
|- setup.sh
|- link2pay
`- README.md
```

## Feedback and Contributions

Feedback, bug reports, and pull requests are welcome. Open an issue describing the use case, problem, and expected behavior.
