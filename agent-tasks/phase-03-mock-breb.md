# Phase 3 — MockBreBAdapter (demo hero rail, clearly labeled simulated)

> Prereq: read `_CONTEXT.md`. Phases 0–2 done. GUARDRAIL: never imply real pesos moved.

## Goal
A demo adapter that produces SEP-shaped data and simulates COP settlement AFTER a real on-chain USDC
payment, with explicit "simulated" labeling everywhere.

## Files
- `backend/src/anchors/adapters/MockBreBAdapter.ts` (implements `AnchorAdapter`).
- Adapter selection wired off `config.ANCHOR_PROVIDER` (add a factory if not already present).
- Frontend settlement UI labels.

## Behavior
- `getQuote`: synthetic quote using a fixed or Reflector USD/COP rate. Return a valid `Quote` shape.
- `initiateOffRamp`: Link2Pay-generated testnet deposit address + memo (still payer-pays-on-chain; the USDC leg is REAL testnet).
- `getStatus`: simulate `AWAITING_PAYMENT → PAYMENT_DETECTED → SETTLING → SETTLED` only AFTER the real
  on-chain USDC payment is detected. Emit a simulated "COP delivered to llave {alias}" event.

## Labeling (mandatory)
Every UI surface showing this settlement must read **"Simulated Bre-B settlement (testnet demo)"**.
No copy (UI, toast, receipt, README) may imply real COP was delivered.

## Acceptance Criteria
- [ ] With `ANCHOR_PROVIDER=mock-breb`, the full demo runs end-to-end with COP framing.
- [ ] The on-chain USDC leg is a real testnet payment; the COP payout is clearly simulated and labeled.
- [ ] No copy anywhere implies real pesos moved.

## Commit
`git commit -m "feat(offramp): phase 3 — MockBreBAdapter (labeled simulated hero rail)"`
