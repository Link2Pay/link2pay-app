# Deployment

Link2Pay deploys as two services: **backend** (Express + Prisma + Postgres) on **Render**, and
**frontend** (Vite SPA) on **Vercel**. Everything is env-driven — the testnet⇄mainnet toggle and the
anchor provider are configuration only, no code changes.

## Backend — Render

`render.yaml` (repo root) describes the web service + Postgres database as Infrastructure-as-Code.

1. Create a new **Blueprint** from this repo; Render reads `render.yaml`.
2. Set the `sync: false` secrets in the dashboard:
   - `FRONTEND_URL` — the deployed Vercel origin (e.g. `https://link2pay.vercel.app`). Used for CORS.
   - `RECEIPT_CONTRACT_ID`, `ABROAD_API_BASE`, `ABROAD_API_KEY` — optional; leave unset for the demo.
3. Deploy. The start command runs **`prisma migrate deploy`** before booting, applying the committed
   migration baseline (`backend/prisma/migrations/0_init`).

### Migrations

- **Fresh database:** `prisma migrate deploy` creates the full schema from the baseline. Nothing extra needed.
- **Existing database created with `db push`** (no migration history): baseline it **once** before the
  first deploy so Prisma doesn't try to recreate existing tables:
  ```bash
  cd backend && npx prisma migrate resolve --applied 0_init
  ```

### Switching network / anchor

All via env vars (no redeploy of code):

| Goal | Set |
|---|---|
| Mainnet | `STELLAR_NETWORK=public`, `HORIZON_URL=https://horizon.stellar.org`, `NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015`, `USDC_ISSUER=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |
| Real testnet anchor | `ANCHOR_PROVIDER=testnet` |
| Simulated Bre-B demo | `ANCHOR_PROVIDER=mock-breb` (default in `render.yaml`) |

Anchor / Abroad API keys are server-side only (Render secrets) — never shipped in the frontend bundle.

## Frontend — Vercel

`frontend/vercel.json` sets SPA rewrites, caching, and security headers.

1. Import the repo in Vercel; set **Root Directory** to `frontend`.
2. Env: `VITE_API_URL` = the Render backend URL (e.g. `https://link2pay-backend.onrender.com`).
   `VITE_STELLAR_NETWORK` = `testnet` (or `public`).
3. Deploy.

### SEP-24 interactive popup (CSP)

`vercel.json`'s `Content-Security-Policy` allows the anchor domain in `frame-src`/`child-src`
(`testanchor.stellar.org`, `anchor-ref-ui-testanchor.stellar.org`) so the SEP-24 interactive window
renders. If you point at a different anchor, add its domain there. The same `connect-src` lists the
Render backend and Horizon — update `https://link2pay-app.onrender.com` if your backend URL differs.

## Testnet vs mainnet config matrix

Everything is env-driven; the code path is identical. Only these differ:

| | Testnet (demo) | Mainnet (production) |
|---|---|---|
| `STELLAR_NETWORK` | `testnet` | `public` |
| `HORIZON_URL` | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` |
| `SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | `https://soroban-mainnet.stellar.org` |
| `NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` | `Public Global Stellar Network ; September 2015` |
| `USDC_ISSUER` | `GBBD47IF…FLA5` | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` |
| `ANCHOR_PROVIDER` | `mock-breb` (demo) or `testnet` | `abroad` |
| `ANCHOR_HOME_DOMAIN` | `testanchor.stellar.org` | (Abroad — N/A; REST) |
| `ABROAD_API_BASE` / `ABROAD_API_KEY` | unset | **required** (after Abroad KYB) |
| Path payment liquidity | real XLM/USDC AMM pool exists; seed only thin pairs | real market depth |

### Path payments (`PATH_PAYMENTS_ENABLED`)

- **Testnet:** a deep `native/USDC` (XLM/USDC) liquidity pool already exists, so
  XLM→USDC routes work without any setup. Thin pairs (EURC/USDC) may hit the
  graceful "pay USDC directly" fallback — seed them with `backend/scripts/seed-liquidity.ts`.
- **Mainnet:** rely on real DEX/AMM depth. Keep a conservative
  `PATH_PAYMENT_SLIPPAGE_BPS` (e.g. 100 = 1%) and short-lived quotes; consider a
  swap aggregator (e.g. Soroswap) for thin pairs. Never self-seed offers.

### Soroban receipt (optional, both networks)

Set `RECEIPT_CONTRACT_ID` + `RECEIPT_SIGNER_SECRET` after deploying the contract
(`contracts/receipt/README.md`). Unset → receipts are skipped, off-ramp still settles.

## Post-deploy smoke check

1. `GET https://<backend>/api/health` returns ok.
2. Frontend loads; create a **Fiat off-ramp · Bre-B (COP)** invoice.
3. Quote → initiate → pay the link with a funded testnet wallet → invoice settles (simulated COP, labeled).
4. No CORS / CSP / popup errors in the browser console.
