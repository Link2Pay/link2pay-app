# Phase 6 — Stellar Wallets Kit (broaden wallet support; listed integration)

> Prereq: read `_CONTEXT.md`. Phases 0–3 done. Keep Freighter as default.

## Goal
Let the payer pick among multiple wallets (Freighter, xBull, Albedo, Rabet, Lobstr, …) via Stellar Wallets Kit.

## CONFIRM FIRST
Fetch the current Stellar Wallets Kit package name + init API and quote it before coding.

## Files
- `frontend/src/store/walletStore.ts` and/or a new wallet-selection component.
- `frontend/src/components/Payment/PaymentFlow.tsx` (payer connect step).

## Behavior
- Integrate Wallets Kit for wallet selection on the payer flow only. Freighter stays the default.
- Reuse existing sign/submit logic; the Kit just provides the signer.

## Acceptance Criteria
- [ ] On testnet, the payer can connect and pay with at least TWO wallet kinds via the Kit.
- [ ] Existing Freighter-default behavior unchanged.

## Commit
`git commit -m "feat(offramp): phase 6 — Stellar Wallets Kit multi-wallet support"`
