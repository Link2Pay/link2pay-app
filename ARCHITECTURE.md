# Link2Pay Architecture — Off-Ramp (Bre-B Rail)

> Generated: 2026-06-28 | Branch: `feat/anchor-offramp`

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         LINK2PAY                                 │
│  (orchestrates quotes, links, memos, status, receipts only)     │
│                                                                  │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────────┐  │
│  │ Receiver │───▶│ Invoice   │───▶│ OffRampService            │  │
│  │ creates  │    │ BRE_B     │    │  ├─ getQuote()            │  │
│  │ invoice  │    │ PENDING   │    │  ├─ initiateOffRamp()     │  │
│  └──────────┘    └───────────┘    │  └─ pollStatus()          │  │
│                       │           └──────────┬───────────────┘  │
│                       │                      │                  │
│                       ▼                      ▼                  │
│                 ┌───────────┐    ┌──────────────────────────┐  │
│                 │ Payment   │    │ AnchorAdapter             │  │
│                 │ Page      │    │  ├─ testnet  (real SEP)   │  │
│                 │ (payer)   │    │  ├─ mock-breb (demo)      │  │
│                 └─────┬─────┘    │  └─ abroad   (production) │  │
│                       │          └──────────────────────────┘  │
└───────────────────────┼────────────────────────────────────────┘
                        │
                        │ USDC payment (on-chain, Stellar)
                        ▼
            ┌───────────────────────┐
            │  ANCHOR (testanchor)   │
            │  SEP-10 auth           │
            │  SEP-38 quote          │
            │  SEP-24 withdraw       │
            │  → depositAddress+memo │
            └───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  Bre-B Rail (simulated │
            │  COP settlement)       │
            └───────────────────────┘
```

**Key principle**: The payer ALWAYS pays the anchor's address directly. Link2Pay never holds funds.

## Invoice State Machine

### Crypto Path (existing, unchanged)
```
DRAFT → PENDING → PROCESSING → PAID
                           ↘ FAILED/EXPIRED/CANCELLED
```

### Bre-B Off-Ramp Path (new, additive)
```
DRAFT → PENDING → AWAITING_ANCHOR → AWAITING_PAYMENT → PROCESSING
                    (SEP-10+38          (deposit addr       (USDC paid
                     initiated)          + memo ready)       on-chain)

         → SETTLING → SETTLED_FIAT
           (anchor       (COP delivered)
            paying COP)

Terminals: ANCHOR_ERROR, NEEDS_KYC, EXPIRED
```

Both paths use `SERIALIZABLE` isolation for race-free status transitions.

## AnchorAdapter Pattern

```typescript
interface AnchorAdapter {
  readonly id: 'testnet' | 'mock-breb' | 'abroad';

  getQuote(params: { sellAmount: string; buyCurrency: 'COP'; payoutAlias: string }): Promise<Quote>;
  initiateOffRamp(params: { quoteId: string; receiverAccount: string; payoutAlias: string }): Promise<OffRampIntent>;
  getStatus(anchorTxId: string): Promise<AnchorStatus>;
}
```

Swappable via `ANCHOR_PROVIDER` env var:
- `testnet` → `TestAnchorAdapter` (real SEP-10/38/24 against testanchor.stellar.org)
- `mock-breb` → `MockBreBAdapter` (simulated COP, real USDC on-chain)
- `abroad` → AbroadAdapter (production Bre-B, needs sandbox creds)

## Non-Custodial Design

1. Payer always sends USDC directly to the anchor's `withdraw_anchor_account`
2. Link2Pay only orchestrates quotes, links, memos, status checks, and receipts
3. No private keys stored server-side
4. App session token ≠ SEP-10 anchor JWT (separate scopes, separate lifetimes)

## Security Model

- **Auth**: ed25519 nonce-based wallet authentication (Freighter signMessage)
- **Validation**: Zod fail-fast schemas on all inputs
- **Rate limiting**: express-rate-limit (general + per-endpoint)
- **CSP**: Helmet with frame-src allowing anchor popup domains
- **IDOR protection**: All invoice mutations validate wallet ownership
- **DB isolation**: SERIALIZABLE transactions prevent race conditions
