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

### Fees

| Leg | Fee | Source |
|-----|-----|--------|
| **CCTP V2 — Standard Transfer** | **Free** (0 bps protocol fee, all chains; ~10–20 min finality) | developers.circle.com/cctp/concepts/fees |
| **CCTP V2 — Fast Transfer** | 0–14 bps by source chain (Ethereum/Solana = 1 bps / 0.01%) | same |
| **Gas** | EVM burn (use **Polygon** → cents, not Ethereum) + Stellar mint (fractions of a cent) | — |
| **Koywe (COP→USDC)** | **Not publicly disclosed** — returned per-quote as `quote.data.fee` (COP) + `finalAmountIn`. Partner-negotiated spread + COP→USD FX spread. LatAm on-ramps typically ~1–5% all-in. | docs.koywe.com |

**Bottom line:** the CCTP bridge is effectively free (~0% + cents of gas); the
real cost is Koywe's spread + FX, likely low-single-digit %, but **unconfirmed**.
Get the exact number from Koywe's sandbox `POST /quotes` (`originCurrencySymbol:
COP`, `destinationCurrencySymbol: USDC`) — it returns `fee` and `finalAmountIn`.

### Testnet vs mainnet

- **Bridge leg:** demoable on testnet — Circle's Stellar CCTP quickstart pairs
  Stellar Testnet ↔ Arc Testnet (burn-and-mint).
- **Fiat leg:** Koywe COP pay-in is **mainnet-only** (no test COP rail).
- ⇒ A *fully real* end-to-end can't run on testnet — same honesty boundary as the
  off-ramp's `mock-breb`.

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
