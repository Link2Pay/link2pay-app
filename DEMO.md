# Link2Pay Off-Ramp Demo

> **Honest boundary**: The SEP-24/38 USDC flow runs against the real SDF testanchor.
> The Bre-B COP leg is **simulated** and labeled "Simulated Bre-B settlement (testnet demo)" everywhere.

## Prerequisites

1. **Freighter browser extension** (or other Stellar wallet)
2. **Stellar Testnet XLM** (for fees — get from [Friendbot](https://laboratory.stellar.org/#account-creator?network=test))
3. **Testnet USDC trustline** on your wallet
4. **Node.js 18+** + **npm**
5. **PostgreSQL** (run `docker compose up -d` in repo root)

## Setup

```bash
# Clone and checkout
git clone <repo-url>
cd link2pay-app
git checkout feat/anchor-offramp

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start PostgreSQL
docker compose up -d

# Configure backend
cd backend
cp .env.example .env
# Edit .env — ensure:
#   DATABASE_URL="postgresql://link2pay:link2pay@localhost:5433/link2pay?schema=public"
#   STELLAR_NETWORK=testnet
#   HORIZON_URL=https://horizon-testnet.stellar.org
#   ANCHOR_PROVIDER=mock-breb    # or testnet for real SEP-38
#   ANCHOR_HOME_DOMAIN=testanchor.stellar.org

# Apply migrations
npx prisma db push

# Run backend
npm run dev
```

## Demo Script

### 1. Create a Bre-B invoice (backend API)

```bash
# Get a nonce
NONCE=$(curl -s http://localhost:3001/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"<YOUR_TESTNET_WALLET>"}' | jq -r '.nonce')

# Sign nonce with wallet (manual in Freighter)
# ... then authenticate with signature header:

# Create Bre-B invoice
curl -X POST http://localhost:3001/api/invoices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SESSION_TOKEN>" \
  -d '{
    "freelancerWallet": "<YOUR_WALLET>",
    "clientName": "Colombia Client",
    "clientEmail": "client@example.com",
    "clientWallet": "<CLIENT_WALLET>",
    "title": "Services - COP Off-Ramp",
    "currency": "USDC",
    "lineItems": [{"description": "Development work", "quantity": 1, "rate": 50}]
  }'

# Note the invoice ID from the response
```

### 2. Get a quote and initiate off-ramp

```bash
INVOICE_ID="<from step 1>"

# Get quote
curl -X POST "http://localhost:3001/api/invoices/$INVOICE_ID/offramp/quote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SESSION_TOKEN>" \
  -d '{"sellAmount":"50.00","payoutAlias":"+573001234567"}'

# Note the quoteId from the response

# Initiate off-ramp
curl -X POST "http://localhost:3001/api/invoices/$INVOICE_ID/offramp/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SESSION_TOKEN>" \
  -d '{"quoteId":"<QUOTE_ID>"}'

# Response includes: depositAddress, memo, anchorTxId
```

### 3. Payer pays

The payer sends USDC to the `depositAddress` with the exact `memo` from step 2.

With MockBreBAdapter: the on-chain USDC payment is real testnet. The COP payout is simulated and labeled.

### 4. Watch status

```bash
# Poll status
curl "http://localhost:3001/api/invoices/$INVOICE_ID/offramp/status"

# MockBreB state progression:
# INITIATED → AWAITING_PAYMENT → PAYMENT_DETECTED → SETTLING → SETTLED

# The settlement note will say "Simulated Bre-B settlement (testnet demo)"
```

### 5. Verify on-chain

- **StellarExpert**: Look up the `depositAddress` to see the USDC payment
- **Transaction hash**: Shown in the invoice response after payment is detected

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `ANCHOR_PROVIDER` | `testnet` / `mock-breb` / `abroad` | `testnet` |
| `ANCHOR_HOME_DOMAIN` | Anchor SEP-1 domain | `testanchor.stellar.org` |
| `RECEIPT_CONTRACT_ID` | Soroban receipt contract (optional) | — |
| `ABROAD_API_BASE` | Abroad API base URL | — |
| `ABROAD_API_KEY` | Abroad API key | — |
| `STELLAR_NETWORK` | `testnet` / `public` | `testnet` |
| All existing env vars | `PORT`, `DATABASE_URL`, `HORIZON_URL`, etc. | See `.env.example` |

## Honest Boundary Summary

- ✅ **USDC on-chain leg** — real Stellar testnet payment
- ✅ **SEP-10/38/24** — real anchor integration against testanchor.stellar.org
- ❌ **COP fiat settlement** — simulated (Bre-B sandbox not available)
- ❌ **No real pesos moved** — labeled "Simulated Bre-B settlement (testnet demo)" on every UI surface
