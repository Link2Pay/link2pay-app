# Phase 9 — Deployment (Vercel + Render)

> Prereq: read `_CONTEXT.md`. Phases 1–3 done (the demo-critical set). HIGH priority (spec §11).

## Goal
Run the full off-ramp demo on the live deployed URLs with no CORS/CSP/popup failures, keeping all
existing security middleware intact.

## Files
- `backend/src/index.ts` (CSP `frame-src`/`child-src`, CORS), `backend/src/config/index.ts`, env on Render/Vercel.

## Steps
- Drive network passphrase, Horizon/RPC URLs, USDC issuer, anchor home domain, and `ANCHOR_PROVIDER`
  entirely from env (testnet/mainnet toggle = config only).
- SEP-24 interactive popup: ensure CSP `frame-src`/`child-src` allow the anchor domain; interactive flow
  needs HTTPS + cookies (Vercel/Render terminate TLS).
- Keep anchor API keys server-side only (Render secrets); proxy anchor calls through Express if needed;
  configure CORS for the Vercel origin.
- Do NOT weaken helmet, rate limiting, Zod validation, or IDOR protections.

## Acceptance Criteria
- [ ] Deployed frontend↔backend complete the full off-ramp demo on the live URLs.
- [ ] No CORS / CSP / popup failures.
- [ ] Existing security middleware remains intact (helmet, rate limiting, Zod, IDOR).

## Commit
`git commit -m "feat(offramp): phase 9 — env-driven deploy + CSP/CORS for SEP-24 popup"`
