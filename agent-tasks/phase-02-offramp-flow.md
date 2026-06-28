# Phase 2 — Non-custodial payer-pays-with-memo flow + state machine

> Prereq: read `_CONTEXT.md`. Phases 0–1 done. GUARDRAIL: the only on-chain payment must be payer→anchor.

## Goal
Wire the adapter into the invoice lifecycle: receiver creates a Bre-B off-ramp invoice, the payer pays USDC
to the anchor with the exact memo, and the invoice advances through new states to settled.

## Files
- `backend/prisma/schema.prisma` (+ `npx prisma migrate dev`).
- `backend/src/services/invoiceService.ts` (extend state transitions; keep SERIALIZABLE isolation).
- `backend/src/services/offRampService.ts` (new — orchestrates adapter calls).
- `backend/src/routes/offramp.ts` (new) + mount in `backend/src/index.ts`.
- `backend/src/middleware/validation.ts` (add Zod schemas for the new endpoints).
- `backend/src/services/watcherService.ts` (add anchor-bound payment detection).
- `frontend/src/components/Payment/PaymentFlow.tsx` (payer pays anchor w/ memo).
- New receiver-side off-ramp UI (SEP-24 interactive popup) + `frontend/src/store/walletStore.ts` if needed.

## Prisma changes (spec §6 — additive, do not break existing)
```prisma
enum PayoutMethod { CRYPTO BRE_B }
enum AnchorProvider { TESTNET MOCK_BREB ABROAD }
// extend InvoiceStatus enum with: AWAITING_ANCHOR AWAITING_PAYMENT SETTLING SETTLED_FIAT ANCHOR_ERROR NEEDS_KYC
// add to Invoice: payoutMethod PayoutMethod @default(CRYPTO); payoutAlias String?;
//   anchorProvider AnchorProvider?; anchorTxId String?; quoteId String?; quoteBuyAmount String?; receiptTxHash String?
```
Backfill existing rows to `payoutMethod = CRYPTO`. Existing `…→PAID` crypto path stays untouched; the
off-ramp path is selected only when `payoutMethod = BRE_B`.

## State machine (additive)
`DRAFT → PENDING → AWAITING_ANCHOR (SEP-10+38+24 initiated) → AWAITING_PAYMENT (deposit addr+memo ready) →
PROCESSING (on-chain USDC matched) → SETTLING (anchor paying COP) → SETTLED_FIAT`. Terminals: `ANCHOR_ERROR, EXPIRED, NEEDS_KYC`.

## Endpoints (spec §7 — reuse `requireWallet`, Zod, rate limit)
- `POST /api/invoices/:id/offramp/quote` — body `{ sellAmount, payoutAlias }` → `Quote`. Receiver-auth.
- `POST /api/invoices/:id/offramp/initiate` — body `{ quoteId }` → `{ interactiveUrl?, depositAddress, memo, memoType }`; set `AWAITING_PAYMENT`. Receiver-auth.
- `GET /api/invoices/:id/offramp/status` — polls `adapter.getStatus`, advances state machine, writes receipt on settle. Public.
- Extend the public payment-link payload to surface `depositAddress` + `memo` for the payer page.

## Frontend
- Receiver: render the SEP-24 interactive `url` (popup). Honor CSP (configured in phase-09).
- Payer: build a USDC payment to `depositAddress` with the EXACT `memo`, sign via the existing Freighter
  path, submit via existing submission logic. Reuse PaymentFlow steps; do not fork the core flow.

## Watcher
- Detect the anchor-bound USDC payment via Horizon → advance `AWAITING_PAYMENT → PROCESSING`.
- Anchor status drives `PROCESSING → SETTLING → SETTLED_FIAT`. Keep the existing crypto watcher loop intact.

## Acceptance Criteria
- [ ] Migration applies; existing invoices backfilled to CRYPTO; existing crypto flow still works.
- [ ] End-to-end testnet: receiver creates BRE_B invoice → payer pays USDC+memo from Freighter →
      invoice transitions AWAITING_ANCHOR→…→ a terminal settled/anchor-completed state.
- [ ] **Custody check:** verify the ONLY on-chain payment is payer→anchor. No funds touch a Link2Pay account.
- [ ] New endpoints enforce existing auth/Zod/rate-limit; status is publicly readable, quote/initiate require receiver auth.

## Commit
`git commit -m "feat(offramp): phase 2 — non-custodial payer-pays-with-memo flow + state machine"`
