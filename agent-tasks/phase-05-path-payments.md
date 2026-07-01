# Phase 5 — Path payments (pay in any asset)

> Prereq: read `_CONTEXT.md`. Phases 0–3 done (4 optional). Put this behind a feature flag.

## Goal
Let the payer pay XLM/EURC/other while the anchor still receives the exact required USDC `amount`.

## Files
- `frontend/src/components/Payment/PaymentFlow.tsx` (asset selector + path-payment build).
- `backend/src/services/stellarService.ts` (path-payment build helper if needed).

## Behavior
- Use `pathPaymentStrictReceive` so the anchor receives the exact USDC amount.
- Compute a sane `destMin` slippage guard and surface it to the payer.
- Feature-flag the whole path-payment UI.

## Acceptance Criteria
- [ ] A payer pays a non-USDC asset on testnet and the anchor's USDC requirement is satisfied.
- [ ] If path-finding fails on thin testnet liquidity, the UI degrades gracefully to "pay USDC directly."

## Commit
`git commit -m "feat(offramp): phase 5 — path payments (pay in any asset, flagged)"`
