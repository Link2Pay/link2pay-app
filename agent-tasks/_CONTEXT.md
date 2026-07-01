# SHARED CONTEXT — read before every phase

You are an AI coding agent working in the `link2pay-app` repo. You add a **non-custodial USDC→COP
off-ramp** (Bre-B rail) to an existing Stellar invoicing app, **without breaking working code**.

Each `phase-N-*.md` file is a self-contained task. Run them in order. Do not start phase N+1 until
phase N's Acceptance Criteria (AC) pass. Commit per phase on branch `feat/anchor-offramp`.

## Verified facts (deep-research 2026-06-28) — these OVERRIDE the original spec
- `@stellar/typescript-wallet-sdk` latest = **3.0.1**, and it **hard-pins `@stellar/stellar-sdk` to exactly `15.0.1`**.
- The repo currently uses `@stellar/stellar-sdk ^12.0.0` in BOTH backend and frontend → an upgrade is REQUIRED (Phase 0).
- testanchor.stellar.org live TOML: SEP-10 `/auth`, SEP-24 `/sep24`, SEP-38 `/sep38`; USDC issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` (matches repo config).
- OpenZeppelin `stellar-contracts` latest stable = **0.7.2** (pin `=0.7.2`; 0.8.0 is unaudited RC).
- Verified SDK call shape: `wallet.anchor({ homeDomain })` → `const sep10 = await anchor.sep10()` →
  `sep10.authenticate({ accountKp })` → `anchor.sep38(authToken).requestQuote({ sell_asset, buy_asset, sell_amount, context })` (snake_case fields).

## CONFIRM AT BUILD TIME (research could not verify — check live docs before coding these)
- OZ `stellar_access::ownable` import path + `#[only_owner]` macro.
- Exact SEP-24 withdraw-exchange response fields (`withdraw_anchor_account`, `withdraw_memo`, `memo_type`).
- wallet-sdk `Watcher` / `watchOneTransaction` signature.
- SEP-7 `web+stellar:pay` URI format.
- Whether testanchor SEP-38 actually quotes a **COP** pair. If NOT → use the fallback in phase-01 (plain SEP-24 USDC withdraw + mock FX leg).

## Existing repo map (DO NOT rewrite these — extend them)
- Stellar SDK wrapper: `backend/src/services/stellarService.ts` (loadAccount, buildPaymentTransaction, submitTransaction, verifyTransaction).
- Horizon watcher: `backend/src/services/watcherService.ts`, started in `backend/src/index.ts` (~line 184).
- Invoice model + state machine: `backend/prisma/schema.prisma`; transitions in `backend/src/services/invoiceService.ts` (updateStatus/markAsPaid, SERIALIZABLE isolation).
  - Current enum: `InvoiceStatus { DRAFT PENDING PROCESSING PAID FAILED EXPIRED CANCELLED }`.
- Auth (nonce + ed25519): `backend/src/services/authService.ts`; middleware `requireWallet` in `backend/src/middleware/validation.ts`.
- Zod validation: `backend/src/middleware/validation.ts` (`validateBody`).
- Config loader (Zod fail-fast): `backend/src/config/index.ts` (+ `NETWORK_CONFIG` testnet/mainnet block, `.env.example`).
- Routes mounted in `backend/src/index.ts`: `/api/auth`, `/api/prices`, `/api/invoices`, `/api/links`, `/api/payments`, `/api/clients`.
- Frontend payer page: `frontend/src/components/Payment/PaymentFlow.tsx` (route `/pay/:id`, `/links/:id`).
- Freighter wallet store: `frontend/src/store/walletStore.ts` (connect, signMessage, signTransaction).
- Frontend config: `frontend/src/config/index.ts` (VITE_* env).

## NON-NEGOTIABLE GUARDRAILS (spec §10)
1. **Never custody funds or hold private keys.** The payer always pays the ANCHOR's address directly. Link2Pay only orchestrates quotes/links/memos/status/receipts. If a task seems to need routing funds through a Link2Pay account, STOP.
2. App session token ≠ SEP-10 anchor JWT. Separate scopes, separate lifetimes. Never reuse one as the other.
3. Don't weaken existing security (helmet, rate limiting, Zod, SERIALIZABLE isolation, IDOR protections).
4. Never claim real pesos moved. Label all simulated Bre-B settlement as "Simulated Bre-B settlement (testnet demo)".
5. Don't wire Abroad's production API without explicit sandbox creds — ship a stubbed `AbroadAdapter`.
6. No custodial/stored-value features (balances, yield, cards).
7. Soroban must NOT block the build (phase-04 is cuttable).
8. Don't rebuild the frontend — reuse the hosted payment-link + intent flow.

## Workflow rules for each phase
- Before editing, READ the files the phase lists. Match existing code style.
- After implementing, run the AC checks. Report PASS/FAIL with evidence (command output, logs).
- Commit: `git commit -m "feat(offramp): phase N — <summary>"`. Keep each phase revertible.
- If a "CONFIRM AT BUILD TIME" item turns out different from this doc, follow the live source and note it.
