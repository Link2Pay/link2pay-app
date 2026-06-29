# COP → USDC On-Ramp — Research & Design Notes

Companion to the USDC→COP off-ramp. Goal: let a user pay **Colombian pesos** via a
local rail and receive **USDC on Stellar**, keeping Link2Pay non-custodial
(quote → pay-in instructions → provider delivers USDC to the user's Stellar
address → app polls status), mirroring the existing `AnchorAdapter` pattern.

> Status: **research + design only.** Not implemented. The recommended production
> path is mainnet-only on the fiat leg; a testnet demo uses a labeled mock.

## The core constraint (verified)

**No single provider today does both Colombian digital-rail COP pay-in
(Bre-B/PSE/Nequi) AND native USDC delivery on Stellar.**

- **Koywe** — supports COP pay-in (PSE, Nequi) but delivers USDC only on EVM
  chains (Ethereum, Polygon, BSC). **Stellar is not a supported delivery network.**
- **MoneyGram Ramps** — does USDC-on-Stellar on-ramp in Colombia, but cash-in via
  physical agents only (no digital COP rail). Has SEP-10+SEP-24 + testnet sandbox.
- **Abroad / Zypto** — USDC→COP (off-ramp) only.

## Architectures evaluated

| # | Path | Viable? | Notes |
|---|------|---------|-------|
| 1 | **Koywe (COP→USDC on EVM) → Circle CCTP V2 → Stellar** ⭐ | ✅ Best | Non-custodial end-to-end; native USDC on Stellar |
| 2 | Koywe → **Allbridge Core** bridge → Stellar | ✅ Fallback | Non-custodial pools; adds bridge trust + manual trustline |
| 3 | COP stablecoin on Stellar → **path-payment** COP→USDC | ❌ Not realizable | No COP-pegged token on Stellar with DEX liquidity exists |
| 4 | Build a **custom SEP-24/SEP-6 COP deposit anchor** | ⚠️ Heavy | Anchor Platform supports it; all PSP/Bre-B licensing + KYC + settlement is on us |
| 5 | **MoneyGram** | ⚠️ Cash-only | USDC-on-Stellar on-ramp but physical cash-in, no digital COP |

Path 3 would have been the most elegant (it reuses Link2Pay's existing
path-payment code), but it's dead until someone issues a COP stablecoin on
Stellar with liquidity. Minteo's COPM is EVM/Solana; Anclap issues 1:1 local
stablecoins on Stellar but only ARS and PEN are live — no COP token found.

## Recommended path: Koywe → CCTP V2 → Stellar

```
User pays COP (PSE/Nequi)
   → Koywe mints USDC on Polygon            [POST /quotes ONRAMP → POST /deals → GET /deals/{id} + webhooks]
   → Circle CCTP V2 burns it, mints native  [depositForBurn(mintRecipient = user's Stellar address)]
     USDC 1:1 to the user's Stellar address
   → Link2Pay polls status
```

- **CCTP V2 is live on Stellar (May 2026)**: native USDC, 1:1 burn-and-mint, no
  wrapped assets, no pools, caller-specified `mintRecipient` → deliverable to an
  arbitrary Stellar address, **fully non-custodial**.
- Both legs expose REST/contract APIs that fit an `AnchorAdapter`-style flow.

### Key insight: source from Polygon, use CCTP Standard (free *and* fast)

CCTP V2 finality (verified, developers.circle.com/cctp/concepts/finality-and-block-confirmations):
**Polygon Standard Transfer hard finality is ~8 seconds** (Ethereum is ~15–19 min,
which is the usual "bridges are slow" assumption). Polygon isn't even in the
Fast-Transfer table because Standard is already fast enough. So sourcing from
**Polygon** makes the bridge leg **free (0 bps) AND sub-minute**.

### Total cost — for 1,000,000 COP (≈ $250)

| Component | Cost | Verified? |
|-----------|------|-----------|
| **Koywe** (fee + COP→USD FX spread) | **~2–4%** ≈ 20,000–40,000 COP (~$5–10) | ❌ **Estimated** — not published; returned per-quote (`quote.data.fee` / `finalAmountIn`). Industry on-ramps run up to ~4.5% |
| **CCTP V2** (Polygon→Stellar, Standard) | **Free** (0 bps) | ✅ Verified — developers.circle.com/cctp/concepts/fees |
| **Gas** (Polygon burn + Stellar mint) | **< $0.10** total | ✅ Verified (cents) |
| **TOTAL** | **≈ 2–4%** (~$5–10 on $250) — essentially **all Koywe** | bridge + gas ≈ free |

→ The bridge is a rounding error. The entire cost is the **Koywe spread**, the one
number not verifiable from public docs. Get it from Koywe's sandbox `POST /quotes`
(`originCurrencySymbol: COP`, `destinationCurrencySymbol: USDC`) → `fee` + `finalAmountIn`.

### Total time

| Leg | Time | Verified? |
|-----|------|-----------|
| **Bre-B / Nequi** COP payment | **< 20 sec** | ✅ Verified — Banco de la República (Bre-B is 24/7 instant A2A) |
| **Koywe** processing (PENDING→COMPLETED, incl. Polygon mint) | **~1–5 min** | ❌ Estimated (waits for fiat clearing) |
| **CCTP** Polygon→Stellar (Standard) | **~10–60 sec** (8s finality + attestation + mint) | ✅ finality verified |
| **TOTAL** | **best ~1–2 min · typical ~2–6 min** | mixed |

Not instant, but a few minutes — the peso payment is the only truly instant part;
**Koywe processing is the bottleneck**, not the bridge.

### "Via Bre-B" specifically (caveat)

- Bre-B is real and instant (launched 2025-10-06, <20s, mandatory for licensed
  institutions, Nequi interoperable through it; PSE is the older separate rail).
- **But Koywe does not name Bre-B** — its payment-methods page lists **PSE and
  Nequi**. Since Nequi now settles via Bre-B, paying Koywe *through a Bre-B-connected
  wallet works in practice*, but a **direct "pay to a Bre-B llave" Koywe integration
  is unconfirmed.** ❌ Confirm with Koywe.

### Testnet vs mainnet

- **Bridge leg:** demoable on testnet — Circle's Stellar CCTP quickstart pairs
  Stellar Testnet ↔ Arc Testnet (burn-and-mint).
- **Fiat leg:** Koywe COP pay-in is **mainnet-only** (no test COP rail).
- ⇒ A *fully real* end-to-end can't run on testnet — same honesty boundary as the
  off-ramp's `mock-breb`.

### Two unverified items (need Koywe sandbox/sales)

1. Koywe's exact COP→USDC spread/fee.
2. Whether Koywe accepts **Bre-B** directly as a pay-in method (vs only PSE/Nequi).

## Proposed implementation (mirror the off-ramp)

1. Add an on-ramp method pair to `AnchorAdapter` — e.g. `getDepositQuote()` /
   `initiateOnRamp()` → returns pay-in instructions + the destination Stellar
   address + a poll-able id, so both directions share one interface.
2. **`MockCopOnRamp` adapter** (labeled **"Simulated COP pay-in (testnet demo)"**)
   — synthetic COP→USDC quote + simulated PSE/Nequi/Bre-B pay-in, then a **real
   testnet USDC delivery** to the user's Stellar address. Demoable today.
3. **`KoyweCctpOnRamp`** — documented/stubbed production adapter (same treatment as
   `AbroadAdapter`): Koywe COP→USDC(Polygon) → CCTP V2 → Stellar. Real,
   non-custodial, mainnet. Wire when Koywe sandbox + a Polygon signer are available.

This yields a **bidirectional** Link2Pay (USDC→COP off-ramp + COP→USDC on-ramp),
testnet-demoable via mocks, honestly labeled, non-custodial throughout.

## Non-custodial & regulatory caveats

- CCTP and Allbridge never take custody of user funds; the user's wallet/Stellar
  address is the `mintRecipient`. Link2Pay only orchestrates and polls.
- Real COP collection (PSE/Nequi/Bre-B) sits with the licensed provider (Koywe) —
  Link2Pay must not touch fiat. KYC/AML is the provider's responsibility; expect
  unverified-partner caps until KYB.
- Bridges add trust assumptions (CCTP: Circle attestation; Allbridge: pool +
  validator/messaging). State these plainly in any UI/README.

## Sources

- Circle CCTP on Stellar — stellar.org/blog/foundation-news/circle-cctp-v2-is-coming-to-stellar
- Circle CCTP docs & fees — developers.circle.com/cctp , /cctp/concepts/fees
- Stellar cross-chain transfers — developers.stellar.org/docs/tokens/cross-chain-transfers
- Koywe on-ramp API — docs.koywe.com/en/crypto-operations/onramp
- Allbridge Core — docs-core.allbridge.io
- MoneyGram Ramps — developer.moneygram.com/moneygram-developer/docs/integrate-moneygram-ramps
- Anclap — home.anclap.com ; Minteo — transparency.minteo.com/blockchain
