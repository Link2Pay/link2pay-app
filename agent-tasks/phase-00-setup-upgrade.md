# Phase 0 — Setup, dependency upgrade, regression gate

> Prereq: read `_CONTEXT.md` first. Branch: `feat/anchor-offramp`.
> This is the RISKIEST phase. The danger is the SDK upgrade breaking the existing working flow, not the new code.

## Goal
Upgrade Stellar SDK, add the wallet SDK, extend config — and PROVE the existing crypto-invoice flow still works.

## Why (verified)
`@stellar/typescript-wallet-sdk@3.0.1` hard-pins `@stellar/stellar-sdk` to exactly `15.0.1`. The repo
uses `^12.0.0` in backend AND frontend. You must upgrade both to v15 or the install conflicts/duplicates.

## Steps
1. READ: `backend/package.json`, `frontend/package.json`, `backend/src/services/stellarService.ts`,
   `backend/src/services/watcherService.ts`, `frontend/src/store/walletStore.ts`, `backend/src/config/index.ts`.
2. Upgrade `@stellar/stellar-sdk` → `15.0.1` in BOTH `backend/package.json` and `frontend/package.json`. Install.
3. Fix v12→v15 breaking changes wherever they surface (build errors / type errors) in stellarService,
   watcherService, walletStore, and any other importer. Do NOT change behavior — only adapt to the new API.
4. Add `@stellar/typescript-wallet-sdk@3.0.1` to `backend/package.json`. Install. Confirm only ONE
   resolved `@stellar/stellar-sdk@15.0.1` (`npm ls @stellar/stellar-sdk`).
5. Extend the Zod env schema in `backend/src/config/index.ts` (keep fail-fast style) with:
   `ANCHOR_PROVIDER` (enum `testnet|mock-breb|abroad`, default `testnet`), `ANCHOR_HOME_DOMAIN`
   (default `testanchor.stellar.org`), `RECEIPT_CONTRACT_ID` (optional), `ABROAD_API_BASE` (optional),
   `ABROAD_API_KEY` (optional). Mirror them in `backend/.env.example` with comments. Reuse existing `NETWORK_CONFIG`.
6. Create empty dirs `backend/src/anchors/` and `backend/src/anchors/adapters/` (add `.gitkeep`).

## Acceptance Criteria (must report each PASS/FAIL with evidence)
- [ ] `npm ls @stellar/stellar-sdk` shows a single `15.0.1` in backend.
- [ ] Backend and frontend both build (`npm run build` each) with no type errors.
- [ ] New env vars load; app starts without config errors.
- [ ] **REGRESSION:** existing crypto-invoice flow still works end-to-end — create invoice → build pay-intent
      XDR → sign (Freighter) → submit → watcher marks `PAID`. Run existing tests if present (`npm test`) and
      report results. If no automated test covers this, do a manual testnet run and log the tx hash.
- [ ] No off-ramp feature code added yet (this phase is infra only).

## Commit
`git commit -m "feat(offramp): phase 0 — upgrade stellar-sdk v12→v15, add wallet-sdk, extend config"`
