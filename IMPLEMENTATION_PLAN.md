# Link2Pay Anchor Off-Ramp — Implementation Plan

Branch: `feat/anchor-offramp`. Derived from the agent spec + repo map + verified mid-2026 facts.
Every phase is independently revertible and ends with an acceptance check.

## Verified facts (deep-research, 2026-06-28) — these override the spec where they differ

| Topic | Spec said | Verified | Action |
|---|---|---|---|
| `@stellar/stellar-sdk` | v12 | wallet-sdk hard-pins **15.0.1** | **Upgrade v12→v15 (Phase 0)** |
| `@stellar/typescript-wallet-sdk` | "confirm" | **v3.0.1** (2026-05-29) | Pin v3.0.1 |
| testanchor SEP endpoints | confirm | SEP-10 `/auth`, SEP-24 `/sep24`, SEP-38 `/sep38` all live | Use real anchor (no §11 fallback needed for endpoints) |
| Testnet USDC issuer | `GBBD47IF…FLA5` | matches live TOML + repo config | Keep |
| OZ stellar-contracts | `=0.7.1` | latest **0.7.2** (0.8.0 is unaudited RC) | Pin `=0.7.2` |
| SEP-10/38 SDK signatures | confirm | `wallet.anchor({homeDomain})` → `await anchor.sep10()` → `sep10.authenticate({accountKp})`; `anchor.sep38(authToken).requestQuote({sell_asset, buy_asset, sell_amount, context})` snake_case | Use verbatim |

**Confirm at build time (research was rate-limited, NOT verified):** OZ `stellar_access::ownable` + `#[only_owner]` import path & macro; exact SEP-24 withdraw-exchange response fields (`withdraw_anchor_account`/`withdraw_memo`/`memo_type`); wallet-sdk `Watcher`/`watchOneTransaction` signature; SEP-7 `web+stellar:pay` URI format. Confirm whether testanchor SEP-38 actually quotes a COP pair — if not, §11 fallback (plain SEP-24 USDC withdraw + mock FX) applies.

---

## Phase 0 — Setup, dependency upgrade, regression gate
**Files:** `backend/package.json`, `frontend/package.json`, `backend/src/config/index.ts`, `backend/.env.example`, new `backend/src/anchors/` dirs.
1. Upgrade `@stellar/stellar-sdk` v12→**15.0.1** in backend AND frontend. Fix breaking changes in `stellarService.ts`, `watcherService.ts`, frontend `walletStore.ts`.
2. Add `@stellar/typescript-wallet-sdk@3.0.1` (backend).
3. Extend Zod config schema with: `ANCHOR_PROVIDER` (enum testnet|mock-breb|abroad, default testnet), `ANCHOR_HOME_DOMAIN`, `RECEIPT_CONTRACT_ID?`, `ABROAD_API_BASE?`, `ABROAD_API_KEY?`. Reuse existing `NETWORK_CONFIG`.
4. Create `backend/src/anchors/` and `backend/src/anchors/adapters/`.
- **AC:** app builds; **existing crypto-invoice flow regression-passes** (create → pay-intent XDR → Freighter sign → submit → watcher marks PAID). No off-ramp code yet. ⚠️ This is the riskiest gate — the v15 upgrade, not the new features.

## Phase 1 — AnchorAdapter interface + TestAnchorAdapter (real SEP integration)
**Files:** `backend/src/anchors/AnchorAdapter.ts`, `adapters/TestAnchorAdapter.ts`, a backend integration test/script.
- Define interface + types from spec §2.2 (`Quote`, `OffRampIntent`, `AnchorStatus`).
- `TestAnchorAdapter` via wallet SDK: SEP-1 `getInfo()`, SEP-10 auth (testnet `SigningKeypair` for receiver is fine for demo), SEP-38 `requestQuote`, SEP-24 `withdraw` → `{interactiveUrl, anchorTxId}`; extract `withdraw_anchor_account`+`withdraw_memo` at `pending_user_transfer_start`; status via SDK Watcher/`getTransactionBy`. Normalize anchor status strings → `AnchorStatus`.
- **AC:** script obtains JWT + firm SEP-38 quote + interactive URL + deposit address/memo against live testanchor; status polling reaches terminal. Log full transcript. If SEP-38/withdraw-exchange COP unavailable → §11 fallback documented.

## Phase 2 — Non-custodial payer-pays-with-memo flow + state machine
**Files:** `prisma/schema.prisma` (+migration), `invoiceService.ts`, new `offRampService.ts`, new `routes/offramp.ts`, frontend `PaymentFlow.tsx`, new receiver off-ramp UI, `walletStore.ts`.
- Prisma §6: `PayoutMethod`(CRYPTO|BRE_B), `AnchorProvider`, fields `payoutAlias/anchorProvider/anchorTxId/quoteId/quoteBuyAmount/receiptTxHash`; extend `InvoiceStatus` with `AWAITING_ANCHOR, AWAITING_PAYMENT, SETTLING, SETTLED_FIAT, ANCHOR_ERROR, NEEDS_KYC`. Backfill existing → CRYPTO. Keep existing `PAID` path untouched.
- Endpoints §7: `POST /api/invoices/:id/offramp/quote`, `/initiate`, `GET /…/status` (reuse `requireWallet`, Zod, rate limit; receiver-auth for quote/initiate, public status). Surface `depositAddress`+`memo` on the public payment-link payload.
- Frontend: receiver gets SEP-24 interactive popup; payer page builds USDC payment to `depositAddress` with EXACT memo, signs via existing Freighter path, submits via existing logic.
- Watcher: add anchor-bound payment detection (Horizon) to advance AWAITING_PAYMENT→PROCESSING; anchor status drives PROCESSING→SETTLING→SETTLED_FIAT. Keep crypto watcher loop intact.
- **AC:** end-to-end testnet: receiver creates BRE_B invoice → payer pays USDC+memo from Freighter → state machine reaches terminal. **Verify the only on-chain payment is payer→anchor (Link2Pay custodies nothing).**

## Phase 3 — MockBreBAdapter (demo hero rail, labeled simulated)
**Files:** `adapters/MockBreBAdapter.ts`, frontend settlement UI labels.
- Satisfies `AnchorAdapter`; SEP-shaped synthetic quote (fixed or Reflector USD/COP rate), Link2Pay-generated testnet deposit address+memo, simulated transitions after the **real** on-chain USDC payment is detected; emit "COP delivered to llave {alias}" event.
- **Every UI surface labels "Simulated Bre-B settlement (testnet demo)".** No copy implies real pesos moved.
- **AC:** `ANCHOR_PROVIDER=mock-breb` runs full demo with COP framing; USDC leg real, COP simulated & labeled.

## Phase 4 — Soroban payment-receipt contract (depth lever, non-blocking)
**Files:** new `contracts/receipt/` (Rust), deploy script, backend receipt writer, frontend receipt link.
- Scaffold via OZ Wizard; pin OZ crates `=0.7.2` (**confirm**); `stellar_access::ownable` + `#[only_owner]` for admin writes (confirm import path). Store `{invoiceId, payer, payee, amount, asset, anchorTxId, timestamp, memoHash}` (hash, no PII) + emit event. **Explicit TTL management.** Run `soroban-scanner scan`, fix findings. Deploy testnet → set `RECEIPT_CONTRACT_ID`. Backend writes receipt at SETTLED_FIAT; frontend shows StellarExpert link.
- **AC:** deploys; settled invoice → on-chain receipt w/ verifiable hash, shown in UI, scanner clean. **Non-custodial:** contract records only, never holds funds. If not deploying cleanly by end of phase → §11: cut it, lean on Phases 5–6.

## Phase 5 — Path payments (pay in any asset)
- Payer page: pay XLM/EURC via `pathPaymentStrictReceive` so anchor gets exact USDC; compute `destMin` slippage guard, surface it. Behind a feature flag.
- **AC:** non-USDC payment settles to USDC on testnet; thin-liquidity path-find failure degrades gracefully to "pay USDC directly."

## Phase 6 — Stellar Wallets Kit (listed integration; broaden wallets)
- Integrate on payer flow (Freighter default + xBull/Albedo/Rabet/Lobstr).
- **AC:** payer pays with ≥2 wallet kinds on testnet.

## Phase 7 — Reflector FX preview (optional)
- SEP-40 ReflectorPulse feed → live "receiver gets ≈ COP X" preview, labeled oracle-estimate vs firm SEP-38 quote. Firm pricing stays from adapter quote.

## Phase 8 — Embeddable "Pay with USDC" button (optional)
- Script-tag/iframe widget (merchant id + amount + payout alias) → creates off-ramp request, opens payer flow. Reuse hosted link + create-intent API. Static demo HTML completes mock-breb settlement.

## Phase 9 — Deploy (Vercel + Render)
- Everything env-driven (passphrase, Horizon/RPC, USDC issuer, home domain, ANCHOR_PROVIDER). CSP `frame-src`/`child-src` allow anchor domain for SEP-24 popup; HTTPS+cookies; anchor keys server-side only, proxy via Express, CORS for Vercel origin. Keep helmet/rate-limit/Zod/IDOR intact.
- **AC:** live URLs complete full off-ramp demo, no CORS/CSP/popup errors; security middleware intact.

## Phase 10 — README + ARCHITECTURE.md + DEMO.md
- README: what was built; named load-bearing integration (Abroad + Anchor Platform) + why; AnchorAdapter design; non-custodial flow diagram; honest testnet-vs-mock boundary; setup/env. ARCHITECTURE.md = §2 diagram + state machine. DEMO.md = exact script.
- **AC:** a stranger can clone, configure, run the testnet demo from README alone.

---

## Priority if time runs short (spec §11)
Phases 1–3 (real SEP + mock Bre-B) > 9 (deploy) > 10 (README) > 4 (Soroban) > 6 (Wallets Kit) > 5 (path payments) > 7–8.

## Guardrails (spec §10) — non-negotiable
No custody / no private keys (payer always pays the anchor directly). App session token ≠ SEP-10 JWT. Don't weaken existing security. Never claim real pesos. Don't wire Abroad prod without sandbox creds (ship stubbed `AbroadAdapter`). No stored-value features. Soroban must not block the build.
