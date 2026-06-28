# Phase 10 — README + submission artifacts

> Prereq: read `_CONTEXT.md`. Run after the feature phases. GUARDRAIL: honest testnet-vs-mock boundary everywhere.

## Goal
Docs a stranger can use to clone, configure, and run the testnet demo — and that name the load-bearing integration.

## Files
- `README.md` (update), `ARCHITECTURE.md` (new), `DEMO.md` (new).

## README must cover
- What was built.
- The **named load-bearing integration**: Abroad (named Bre-B production off-ramp) + Anchor Platform
  (SDF testnet reference anchor the demo runs against) — and WHY it's load-bearing.
- The AnchorAdapter design (testnet | mock-breb | abroad, swappable by `ANCHOR_PROVIDER`).
- The non-custodial flow diagram (payer → anchor directly; Link2Pay orchestrates only).
- The honest testnet-vs-mock boundary: SEP-24/38 + path payments + Soroban receipt are REAL on testnet;
  the Bre-B COP leg is SIMULATED and labeled.
- Setup/run instructions + full env reference.

## ARCHITECTURE.md
- The §2 flow diagram + the invoice state machine (including new off-ramp states).

## DEMO.md
- Exact demo script: create link → payer pays USDC → status → settled / simulated COP.

## Acceptance Criteria
- [ ] A stranger can clone, configure, and run the testnet demo from the README alone.
- [ ] Docs name the load-bearing integration and honestly state the simulated Bre-B boundary.

## Commit
`git commit -m "docs(offramp): phase 10 — README + ARCHITECTURE + DEMO"`
