# Link2Pay — Project Status

_Snapshot date: 2026-06-30 · branch: `pulso`_

This document summarizes what Link2Pay is, what was planned, and how much of that plan has actually been built — cross-checked against the codebase, not just the docs. For the full narrative versions, see `README.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `DEMO.md`, `DEPLOYMENT.md`, and `ONRAMP.md`.

## What Link2Pay is

A non-custodial payment-link / invoicing platform on Stellar. A merchant creates a link, the payer pays in USDC (or XLM/EURC) directly from a Stellar wallet, and settlement happens on-chain in seconds — no custody, no intermediary holding funds.

Built for the **PULSO hackathon**, the project's signature feature is a second settlement path layered on top of the core crypto flow: a **USDC → COP (Colombian peso) off-ramp via the Bre-B rail**, orchestrated through a pluggable `AnchorAdapter` interface (SEP-10/24/38) on top of the Stellar Anchor Platform. The COP leg is explicitly **simulated/demo-labeled** — the on-chain USDC payment is real, the fiat payout is mocked, and the UI says so everywhere it appears ("Simulated Bre-B settlement (demo)").

## Tech stack

| Layer | Stack |
|---|---|
| Backend | Node/Express + TypeScript, Prisma + PostgreSQL, Zod validation, Helmet, rate limiting, Winston logging |
| Stellar SDKs | `@stellar/stellar-sdk@15.0.1`, `@stellar/typescript-wallet-sdk@3.0.1` |
| Frontend | React 18 + Vite + TypeScript, Zustand, TanStack Query, Tailwind, `@react-pdf/renderer` |
| Wallets | `@stellar/freighter-api`, `@creit.tech/stellar-wallets-kit` (multi-wallet), `@privy-io/react-auth` (social/embedded wallet login) |
| Contracts | Soroban Rust contract at `contracts/receipt/` (OpenZeppelin `stellar-access`, `soroban-sdk` 26.1) — on-chain payment-receipt attestation, no PII, no custody |
| Deploy targets | Render (backend + Postgres, `render.yaml`) + Vercel (frontend, `vercel.json`) |

## The plan

The hackathon work was scoped as 11 sequential phases in `agent-tasks/phase-00-*.md` through `phase-10-*.md`, with phases 04–08 explicitly marked as **optional/cuttable** if time ran out (per `agent-tasks/RUN_ALL.md`).

| Phase | Goal | Status | Evidence |
|---|---|---|---|
| 00 — Setup/upgrade | Upgrade `stellar-sdk` v12→v15, add wallet-sdk, scaffold `anchors/` | ✅ Done | `package.json` pinned to 15.0.1 |
| 01 — TestAnchorAdapter | Real SEP-10/24/38 against `testanchor.stellar.org` | ✅ Done | `backend/src/anchors/AnchorAdapter.ts`, `adapters/TestAnchorAdapter.ts` |
| 02 — Off-ramp flow | Non-custodial payer-pays-anchor flow, new invoice states/services | ✅ Done | `services/offRampService.ts`, `routes/offramp.ts`, extended Prisma enums |
| 03 — MockBreBAdapter | Demo Bre-B adapter: real USDC leg + simulated COP leg | ✅ Done | `backend/src/anchors/adapters/MockBreBAdapter.ts` |
| 04 — Soroban receipt _(optional)_ | On-chain receipt attestation contract | ✅ Done (not cut) | `contracts/receipt/{Cargo.toml,src/lib.rs,src/test.rs}`, `backend/src/services/receiptService.ts`. **Note:** `RECEIPT_CONTRACT_ID` is left unset in `.env.example` — the contract exists and is tested but isn't wired into the default deployment with a committed contract ID. |
| 05 — Path payments _(optional)_ | Pay in any asset via `pathPaymentStrictReceive` | ✅ Done (not cut) | Referenced in `stellarService.ts`, flagged |
| 06 — Wallets Kit _(optional)_ | Multi-wallet payer support | ✅ Done (not cut) | `frontend/src/services/walletsKit.ts` |
| 07 — Reflector FX preview _(optional)_ | Oracle-based "≈COP" estimate, distinct from the firm SEP-38 quote | ✅ Done (not cut) | `backend/src/services/reflectorService.ts` |
| 08 — Checkout button/SDK _(optional)_ | Embeddable "Pay with USDC" widget | ✅ Done (not cut) | `frontend/public/embed/{link2pay-button.js,demo.html}` — plus a fuller `frontend/src/pages/SDK.tsx` than the spec called for |
| 09 — Deploy | Render + Vercel, env-driven, SEP-24 popup CSP/CORS | ✅ Done | `render.yaml`, `vercel.json`, documented in `DEPLOYMENT.md` |
| 10 — README/docs | Honest testnet/mock boundary in docs | ✅ Done | `README.md`, `ARCHITECTURE.md`, `DEMO.md` all present and consistent |

**All 11 phases shipped — including every phase marked optional.** That's a stronger outcome than the plan itself required.

A third anchor adapter (`AbroadAdapter`, a production-path stub) was also added beyond the original three-adapter plan, and COP **on-ramp** (fiat → USDC, the reverse direction) has design notes in `ONRAMP.md` but is **not implemented** — research only, no code.

## What's been built beyond the original plan

The hackathon scope (phases 00–10) was the floor, not the ceiling. Since then, substantial product work has landed on top of it:

- **Merchant KYC gating** _(in progress, currently uncommitted)_ — `backend/src/kyc/` (`KycProvider` interface, `MockKycProvider`, a real `DiditKycProvider`), `requireKyc` middleware, a `KycStatus` enum (`UNVERIFIED/PENDING/VERIFIED/REJECTED`) on `BusinessProfile`. This gates a wallet from creating invoices until merchant-side KYC clears — separate from the payer-side KYC the anchor flow already had.
- **Privy social login** — embedded Stellar wallets via email/social sign-in, no Freighter required (`frontend/src/services/privy.ts`).
- **A real invoice product layer** — `InvoiceType` (`DIRECT_PAYMENT | BUSINESS_INVOICE | SERVICE_INVOICE`), business-profile-driven invoices, generated invoice PDFs, open-amount/no-expiration links, invoice cancellation. This is a large body of work on its own, separate from the off-ramp feature.
- **Design system rebrand** — tokens reorganized into a 3-layer architecture (primitive → semantic → component), fintech visual identity (deep indigo + money green).
- **Mainnet/testnet split** _(this session)_ — the public domain now defaults to mainnet with the network toggle removed entirely; testnet is reachable only via a `testnet.*` subdomain or explicit env override. Resolution order: env var → `testnet.` hostname → mainnet default.
- **Interactive hero mockup** _(this session)_ — replaced a fully-functional-but-heavy hero widget (real wallet connect, real API calls) with a lightweight, local-only interactive preview: Crypto/Fiat settlement toggle, a "payout rail" picker (Bre-B live; Pix and Transferencias 3.0 shown as grouped, disabled "coming soon" rails under Fiat), a Stellar token selector (XLM/USDC/EURC) in crypto mode, live USDC↔COP conversion math, and a two-stage create→QR/URL→back flow — all without touching the backend.

## Currently uncommitted (in progress right now)

Per `git status -s` on `pulso`:

- **New:** `backend/src/kyc/`, `backend/src/middleware/requireKyc.ts`, `backend/src/routes/kyc.ts`, `backend/src/services/kycService.ts`, `frontend/src/components/Kyc/`, `frontend/src/components/marketing/HeroPaymentMockup.tsx`, `frontend/src/config/network.ts`
- **Modified:** `backend/prisma/schema.prisma`, `backend/src/config/index.ts`, `backend/src/index.ts`, `backend/src/routes/invoices.ts`, `backend/src/types/express.d.ts`, several frontend files (`InvoiceForm.tsx`, `Layout.tsx`, `PaymentFlow.tsx`, `Home.tsx`, `Pricing.tsx`, `ProfileOptions.tsx`, `GetPaid.tsx`, `api.ts`, `i18n/translations.ts`, `networkStore.ts`, `config/index.ts`)
- **Deleted:** `frontend/src/components/NetworkToggle.tsx`, `frontend/src/components/marketing/HeroQuickLink.tsx`

This is the live edge of two concurrent threads: the KYC feature, and this session's mainnet/landing-page work.

## Deployment status — needs attention

`README.md` advertises a live demo at `https://link2pay.vercel.app`. I checked it directly: it returns `HTTP 307` with response headers (`vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch`, `server: Vercel`) that are characteristic of a **Next.js** deployment — Link2Pay's frontend is Vite + React, not Next.js. **That URL almost certainly does not point at this project** (Vercel subdomains are first-come, globally claimed — it likely belongs to an unrelated app). The deployment pipeline itself (`render.yaml` + `vercel.json`) is real and documented, but the live-demo link in the README is stale or wrong and should be fixed or removed.

## Bottom line

- **Hackathon scope (phases 00–10): 100% complete**, including every optional phase.
- **Product layer beyond the hackathon scope: substantial** — KYC, Privy auth, full invoice types/PDFs, design rebrand, and this session's network-split + interactive marketing hero.
- **One open thread:** the KYC feature is implemented but not yet committed.
- **One documentation bug:** the README's "live demo" link does not appear to point at Link2Pay — verify the actual Vercel deployment URL and correct it.
- **One scope gap:** COP on-ramp (fiat → USDC) is designed (`ONRAMP.md`) but not built.
