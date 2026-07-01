# Phase 8 — Embeddable "Pay with USDC" checkout button (OPTIONAL)

> Prereq: read `_CONTEXT.md`. Phases 0–3 done. Reuse the existing flow — do not fork it.

## Goal
A small embeddable widget (script tag or iframe) that, given merchant id + amount + payout alias, creates a
Link2Pay off-ramp request and opens the payer flow — a "Pay with USDC" button.

## Files
- A small embeddable script/iframe widget (new, e.g. `frontend/public/embed/` or a built snippet).
- A static `demo/checkout.html` that embeds the button.

## Behavior
- Reuse the existing hosted payment-link + create-intent API. Do not duplicate the core flow.
- Given `{ merchantId, amount, payoutAlias }`, create an off-ramp request and open the payer flow.

## Acceptance Criteria
- [ ] A static demo HTML page embeds the button and completes a testnet payment that settles (mock-breb) end-to-end.

## Commit
`git commit -m "feat(offramp): phase 8 — embeddable Pay with USDC button"`
