# Phase 4 — Soroban payment-receipt contract (depth lever, CUTTABLE)

> Prereq: read `_CONTEXT.md`. Phases 0–3 done. GUARDRAIL: contract records receipts only — never holds/transfers funds.
> If it is not deploying cleanly by the end of this phase, CUT IT and move on (spec §11). Do not block the build.

## CONFIRM FIRST (do not invent)
- OZ `stellar-contracts` crate version — pin `=0.7.2` unless docs say otherwise (0.8.0 is unaudited RC).
- The real import path for `stellar_access::ownable` and the `#[only_owner]` macro — quote from
  docs.openzeppelin.com/stellar-contracts before coding.
- `soroban-scanner` install/run command.

## Files
- `contracts/receipt/` (new Rust crate, scaffold via wizard.openzeppelin.com/stellar).
- Deploy script (Stellar CLI) + set `RECEIPT_CONTRACT_ID` in env.
- Backend: write a receipt when an invoice reaches `SETTLED_FIAT` (in offRampService/status handler).
- Frontend: show a StellarExpert link to the receipt.

## Contract
- Admin-gated writes via `stellar_access::ownable` + `#[only_owner]`.
- Store per settled invoice: `{ invoiceId, payer, payee, amount, asset, anchorTxId, timestamp, memoHash }`
  — store a HASH, never PII. **Emit an event** for indexing.
- **Manage instance/persistent storage TTL explicitly** (OZ does not auto-manage it).
- Run `soroban-scanner scan` and fix findings.

## Acceptance Criteria
- [ ] Contract deploys to testnet; `RECEIPT_CONTRACT_ID` set.
- [ ] A settled invoice produces an on-chain receipt with a verifiable tx hash, visible on StellarExpert and in the UI.
- [ ] `soroban-scanner` passes.
- [ ] Contract never holds/transfers/escrows funds.
- [ ] If blocked: feature removed cleanly, build still green, noted in commit message.

## Commit
`git commit -m "feat(offramp): phase 4 — Soroban receipt contract + on-chain attestation"`
