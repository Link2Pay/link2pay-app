# Link2Pay Receipt Contract (Soroban)

An on-chain payment-receipt / attestation contract. For each settled off-ramp
invoice it stores `{ invoice_id, payer, payee, amount, asset, anchor_tx_id,
timestamp, memo_hash }` and emits a `receipt` event for indexing.

- **Admin-gated writes** via OpenZeppelin `stellar-access::ownable` + `#[only_owner]`.
- **No PII:** the memo is stored as a 32-byte SHA-256 hash (`memo_hash`).
- **Non-custodial:** records receipts only — never holds, transfers, or escrows funds.
- **Explicit TTL management:** persistent + instance storage TTL is bumped on write/read
  (OZ does not auto-manage it).

## Pinned versions (verified against OpenZeppelin/stellar-contracts v0.7.2)

```
soroban-sdk    = 26.1.0
stellar-access = =0.7.2
stellar-macros = =0.7.2
```

## Test (native)

```bash
cd contracts/receipt
cargo test
```

## Build (wasm)

```bash
rustup target add wasm32-unknown-unknown   # or wasm32v1-none for newer toolchains
# Preferred (Stellar CLI):
stellar contract build
# or raw cargo:
cargo build --release --target wasm32-unknown-unknown
```

## Security scan (OZ detectors)

```bash
cargo install soroban-scanner   # if not installed
soroban-scanner scan .
```

## Deploy to testnet

```bash
# 1. Fund an admin identity
stellar keys generate receipt-admin --network testnet --fund
ADMIN=$(stellar keys address receipt-admin)

# 2. Deploy, passing the owner to the constructor
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/link2pay_receipt.wasm \
  --source receipt-admin --network testnet \
  -- --owner "$ADMIN"
# → prints the contract id (C...)
```

## Wire into the backend

Set in `backend/.env` (or Render secrets):

```
RECEIPT_CONTRACT_ID=C...                       # the deployed contract id
RECEIPT_SIGNER_SECRET=S...                     # receipt-admin secret seed (attestation only)
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

When both `RECEIPT_CONTRACT_ID` and `RECEIPT_SIGNER_SECRET` are present, the backend writes
a receipt the moment an invoice reaches `SETTLED_FIAT` and stores the tx hash on the invoice
(`receiptTxHash`), which the UI links to on StellarExpert. If either is unset, receipt writing
is skipped and the off-ramp still settles normally.
