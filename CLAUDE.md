# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Link2Pay** is a Stellar blockchain payment-link platform. Freelancers create invoices and share payment links; payers settle directly on-chain using XLM, USDC, or EURC. It is a monorepo with two independent services:

- `backend/` — Node.js/Express REST API + Stellar integration + PostgreSQL via Prisma
- `frontend/` — React/Vite SPA using the Freighter wallet browser extension

## Development Commands

All commands are run from within the respective subdirectory.

### Backend (`cd backend`)

```bash
npm run dev            # Dev server with hot reload (tsx watch), port 3001
npm run build          # Compile TypeScript → dist/
npm start              # Production server
npm test               # Vitest test suite
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:migrate   # Apply DB migrations
npm run prisma:studio    # Open Prisma Studio UI
```

### Frontend (`cd frontend`)

```bash
npm run dev            # Vite dev server, port 5173
npm run build          # Production build → dist/
npm run preview        # Preview prod build, port 4173
npm run lint           # ESLint + TypeScript lint
npm run type-check     # tsc --noEmit type check
```

### Infrastructure

```bash
docker compose up -d postgres   # Start PostgreSQL 16 on port 5433
./setup.sh                      # One-command bootstrap for first-time setup
./link2pay                      # Launch script: Docker + backend + frontend
```

## Architecture

### Authentication Flow

No sessions or JWTs. Every authenticated backend request uses a nonce-based ed25519 challenge:
1. Frontend fetches a one-time nonce from `GET /api/auth/nonce`
2. Freighter wallet signs the nonce; signatures are cached for 5 min (`frontend/src/services/auth.ts`)
3. Requests carry headers: `x-wallet-address`, `x-auth-nonce`, `x-auth-signature`
4. Backend verifies via `authService.ts` and enforces with `requireWallet` middleware

### Payment Flow

1. **Pay-intent** (`POST /api/payments/pay-intent`) — backend constructs a Stellar XDR transaction, rate-limited to 10 req/5 min
2. **Submit** (`POST /api/payments/submit`) — frontend sends signed XDR; backend submits to Horizon
3. **Confirm** (`POST /api/payments/confirm`) — backend re-verifies on-chain and marks invoice PAID in a SERIALIZABLE DB transaction
4. `watcherService.ts` independently monitors Stellar streams for memo-based payment matching

### Frontend State

- **Zustand** stores: `walletStore.ts` (Freighter connection + sign operations), `networkStore.ts` (testnet/mainnet toggle)
- **React Query** for server state; `frontend/src/services/api.ts` is the typed backend client
- **i18n**: EN/ES/PT via `frontend/src/i18n/translations.ts`
- Routing is in `App.tsx`; the public payment page is `components/Payment/PaymentFlow`

### Backend Structure

- `routes/` — thin handlers delegating to `services/`
- `services/stellarService.ts` — XDR construction and Horizon interaction
- `services/invoiceService.ts` — invoice CRUD with SERIALIZABLE transactions
- `middleware/validation.ts` — Zod schemas + `requireWallet` guard
- `db.ts` — singleton Prisma client

### Database

PostgreSQL via Prisma. Key models: `Invoice`, `LineItem`, `Payment`, `Client`, `InvoiceAuditLog`.
Invoice statuses: `DRAFT → PENDING → PROCESSING → PAID | FAILED | EXPIRED | CANCELLED`.
Soft deletes via `deletedAt`. All state changes logged to `InvoiceAuditLog` (immutable).

### Network Dual-Support

The backend handles both Stellar testnet and mainnet without restart. The frontend `NetworkToggle` component controls which network is active, stored in `networkStore`. Environment variables configure the default network.

## Environment Setup

Copy `.env.example` → `.env` in both `backend/` and `frontend/` and fill in values.

**Backend key vars:**
- `DATABASE_URL` — PostgreSQL connection string (default Docker: `postgresql://link2pay:link2pay@localhost:5433/link2pay`)
- `STELLAR_NETWORK`, `HORIZON_URL`, `NETWORK_PASSPHRASE`
- `USDC_ISSUER`, `EURC_ISSUER`

**Frontend key vars:**
- `VITE_API_URL` — backend URL (proxied as `/api` in dev via Vite)
- `VITE_STELLAR_NETWORK`, `VITE_HORIZON_URL`, `VITE_NETWORK_PASSPHRASE`

## Key Conventions

- **Path alias**: `@/*` maps to `src/*` in both backend and frontend
- **Validation**: All request bodies validated with Zod; schemas live in `middleware/validation.ts` (backend) and inline in components/services (frontend)
- **Rate limiting**: Global 100 req/15 min; pay-intent 10 req/5 min; invoice creation 20/hr per wallet
- **Security headers**: Helmet on backend; CSP + HSTS in `frontend/vercel.json`
- **ID generation**: `nanoid` for invoice/link IDs; `cuid` for DB record IDs (see `utils/generators.ts`)
- **Logging**: Winston on backend (`utils/logger.ts`); structured JSON in production
