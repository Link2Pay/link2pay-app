# Phase 7 — Reflector FX preview (OPTIONAL)

> Prereq: read `_CONTEXT.md`. Phases 0–3 done. Optional polish.

## Goal
Show a live "receiver gets ≈ COP X" preview from a Reflector oracle, distinct from the firm SEP-38 quote.

## CONFIRM FIRST
Quote the current Reflector ReflectorPulse SEP-40 feed access (contract/endpoint) before coding.

## Behavior
- Read a Reflector ReflectorPulse (free, ~5-min) SEP-40 feed → preview COP estimate.
- Label clearly as an "oracle estimate", visually distinct from the firm SEP-38 quote.
- Firm pricing MUST still come from SEP-38 / the adapter quote, never the oracle.

## Acceptance Criteria
- [ ] The preview updates from the oracle.
- [ ] Firm pricing still comes from SEP-38/the adapter quote, not the oracle.

## Commit
`git commit -m "feat(offramp): phase 7 — Reflector FX preview (oracle estimate)"`
