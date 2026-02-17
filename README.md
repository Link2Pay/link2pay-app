# StellarPay — Decentralized Invoice & Payment Platform

A full-stack decentralized invoice management system built on the Stellar blockchain network. Freelancers create invoices, share payment links, and receive instant cryptocurrency payments with near-zero fees.

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   Backend API    │────▶│   PostgreSQL     │
│  React+Vite  │     │  Node+Express    │     │   (Supabase)     │
│  Tailwind    │     │  Prisma ORM      │     │                  │
└──────┬───────┘     └────────┬─────────┘     └──────────────────┘
       │                      │
       │                      │
       ▼                      ▼
┌──────────────┐     ┌──────────────────┐
│   Freighter  │     │  Stellar Network │
│   Wallet     │     │  Horizon API     │
│   (signing)  │     │  Soroban RPC     │
└──────────────┘     └──────────────────┘
```

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, TailwindCSS       |
| State      | Zustand, React Query                          |
| Backend    | Node.js, Express, TypeScript                  |
| Database   | PostgreSQL + Prisma ORM                       |
| Blockchain | Stellar SDK, Horizon API, Freighter Wallet    |
| Validation | Zod (backend), HTML5 (frontend)               |

## Features

- **Invoice Creation** — Professional invoices with line items, tax, and currency selection (XLM, USDC, EURC)
- **Shareable Payment Links** — Unique URLs clients can open to view and pay invoices
- **Wallet Integration** — Non-custodial Freighter wallet connection for signing transactions
- **Instant Payments** — 3-5 second settlement on the Stellar network
- **Real-time Status** — Live payment tracking (Draft → Pending → Processing → Paid)
- **Payment Verification** — On-chain transaction verification via Horizon API
- **Dashboard** — Overview of invoice stats, revenue, and recent activity
- **Payment Watcher** — Background service that monitors the Stellar network for incoming payments

## Project Structure

```
stellarpay/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── index.ts               # Express server entry
│   │   ├── config/                 # Environment config
│   │   ├── routes/
│   │   │   ├── invoices.ts        # Invoice CRUD endpoints
│   │   │   └── payments.ts        # Payment flow endpoints
│   │   ├── services/
│   │   │   ├── invoiceService.ts  # Invoice business logic
│   │   │   ├── stellarService.ts  # Stellar blockchain integration
│   │   │   └── watcherService.ts  # Payment monitoring
│   │   ├── middleware/
│   │   │   └── validation.ts      # Zod schemas + middleware
│   │   ├── types/                 # TypeScript interfaces
│   │   └── utils/                 # Helpers
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Routes + providers
│   │   ├── main.tsx               # Entry point
│   │   ├── index.css              # Tailwind + custom styles
│   │   ├── components/
│   │   │   ├── Layout.tsx         # Sidebar + top bar
│   │   │   ├── Invoice/
│   │   │   │   ├── InvoiceForm.tsx       # Create invoice form
│   │   │   │   ├── InvoiceList.tsx       # Invoice table with filters
│   │   │   │   ├── InvoiceDetail.tsx     # Single invoice view
│   │   │   │   └── InvoiceStatusBadge.tsx
│   │   │   ├── Wallet/
│   │   │   │   └── WalletConnect.tsx     # Freighter integration
│   │   │   └── Payment/
│   │   │       └── PaymentFlow.tsx       # Client payment page
│   │   ├── services/
│   │   │   └── api.ts             # Backend API client
│   │   ├── store/
│   │   │   └── walletStore.ts     # Zustand wallet state
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   └── CreateInvoice.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── config/
│   │       └── index.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Supabase account)
- Freighter browser extension (https://freighter.app)

### 1. Clone and Install

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database URL
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Set Up Database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Run Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Runs on http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 4. Connect Wallet

1. Install Freighter wallet extension
2. Switch to Stellar Testnet in Freighter settings
3. Fund your testnet account via Friendbot
4. Connect wallet in the app

## API Endpoints

### Invoices

| Method | Path                         | Description                    | Auth     |
|--------|------------------------------|--------------------------------|----------|
| POST   | `/api/invoices`              | Create invoice                 | Wallet   |
| GET    | `/api/invoices`              | List user's invoices           | Wallet   |
| GET    | `/api/invoices/stats`        | Dashboard statistics           | Wallet   |
| GET    | `/api/invoices/:id`          | Get invoice (public)           | None     |
| PATCH  | `/api/invoices/:id`          | Update draft invoice           | Wallet   |
| POST   | `/api/invoices/:id/send`     | Mark as PENDING                | Wallet   |
| DELETE | `/api/invoices/:id`          | Delete draft invoice           | Wallet   |

### Payments

| Method | Path                                  | Description                     |
|--------|---------------------------------------|---------------------------------|
| POST   | `/api/payments/:id/pay-intent`        | Build payment transaction       |
| POST   | `/api/payments/submit`                | Submit signed transaction       |
| POST   | `/api/payments/confirm`               | Manually confirm by tx hash     |
| GET    | `/api/payments/:id/status`            | Check payment status            |
| POST   | `/api/payments/verify-tx`             | Verify transaction on-chain     |

## Payment Flow

```
1. Freelancer creates invoice        → POST /api/invoices
2. Freelancer sends to client        → POST /api/invoices/:id/send
3. Freelancer shares payment link    → /pay/:invoiceId
4. Client opens link, connects wallet
5. Client clicks Pay                 → POST /api/payments/:id/pay-intent
6. Backend builds Stellar transaction with memo=invoiceNumber
7. Client signs transaction in Freighter wallet
8. Signed TX submitted to network    → POST /api/payments/submit
9. Stellar network confirms (3-5s)
10. Watcher detects payment, updates status to PAID
11. Both parties see confirmation
```

## Environment Variables

### Backend

| Variable                   | Description                          | Default                              |
|----------------------------|--------------------------------------|--------------------------------------|
| `PORT`                     | Server port                          | `3001`                               |
| `DATABASE_URL`             | PostgreSQL connection string         | Required                             |
| `STELLAR_NETWORK`          | `testnet` or `mainnet`               | `testnet`                            |
| `HORIZON_URL`              | Stellar Horizon API URL              | Testnet URL                          |
| `NETWORK_PASSPHRASE`       | Stellar network passphrase           | Testnet passphrase                   |
| `FRONTEND_URL`             | Frontend origin for CORS             | `http://localhost:5173`              |
| `WATCHER_POLL_INTERVAL_MS` | Payment watcher poll interval        | `5000`                               |

### Frontend

| Variable                  | Description                | Default                             |
|---------------------------|----------------------------|-------------------------------------|
| `VITE_API_URL`            | Backend API base URL       | `http://localhost:3001`             |
| `VITE_STELLAR_NETWORK`    | Stellar network            | `testnet`                           |
| `VITE_HORIZON_URL`        | Horizon API URL            | Testnet URL                         |
| `VITE_NETWORK_PASSPHRASE` | Network passphrase         | Testnet passphrase                  |

## Security

- **Non-custodial**: Private keys never leave the user's wallet
- **Input validation**: All inputs validated with Zod schemas
- **Rate limiting**: Pay-intent and general API rate limits
- **HTTPS**: Enforced via Helmet middleware with HSTS headers
- **CSP**: Content Security Policy headers configured
- **No sensitive storage**: No keys or seeds stored server-side
- **Transaction verification**: On-chain validation of all payments

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel
```

### Backend → Render / Railway / VPS

```bash
cd backend
npm run build
npm start
```

### Database → Supabase / Railway PostgreSQL

Use the `DATABASE_URL` from your provider.

## License

Internal project — all rights reserved.
