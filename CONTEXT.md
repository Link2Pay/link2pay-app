# Link2Pay ZK-Bridge - Development Context

## Project Context

### What We're Building
A **Universal Privacy Pool** for x402 payments on Stellar that enables autonomous agents to pay for services anonymously using zero-knowledge proofs.

### Why It Matters
x402 enables pay-per-use agent services, but all payments are public on-chain. For competitive agents (trading bots, research systems), this is a critical vulnerability. Our privacy pool solves this by using ZK proofs to hide payment origins while maintaining verifiability.

### Key Innovation
**Multi-Service Aggregation** - Unlike traditional privacy pools (one pool per service), we provide a universal pool where agents deposit once and can pay ANY x402 service anonymously from the same pool.

---

## Development Environment

### Prerequisites

```bash
# System Requirements
- Node.js 18+ (LTS)
- Rust 1.75+ with wasm32-unknown-unknown target
- Stellar CLI (stellar-cli)
- Docker & Docker Compose
- Git

# Install Stellar CLI
cargo install --locked stellar-cli --features opt

# Install Rust wasm target
rustup target add wasm32-unknown-unknown

# Install Node dependencies
cd backend && npm install
cd ../frontend && npm install
cd ../circuits && npm install

# Install Circom
curl -sSL https://github.com/iden3/circom/releases/download/v2.1.6/circom-linux-amd64 -o /usr/local/bin/circom
chmod +x /usr/local/bin/circom

# Install snarkjs
npm install -g snarkjs
```

### Environment Variables

**Backend (.env)**
```bash
# Database
DATABASE_URL="postgresql://localhost:5433/link2pay?schema=public"

# Stellar Network
STELLAR_NETWORK="testnet"
HORIZON_URL="https://horizon-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Privacy Pool
PRIVACY_POOL_CONTRACT_ID="C..."  # Deployed contract ID
OPERATOR_SECRET_KEY="S..."        # Operator secret key
USDC_TOKEN_ADDRESS="C..."         # USDC contract on testnet

# x402
X402_FACILITATOR_URL="https://x402-facilitator.stellar.org"

# Server
PORT=3001
NODE_ENV=development
```

**Frontend (.env)**
```bash
VITE_API_URL="http://localhost:3001"
VITE_STELLAR_NETWORK="testnet"
VITE_HORIZON_URL="https://horizon-testnet.stellar.org"
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_PRIVACY_POOL_CONTRACT="C..."
```

---

## Project Structure

```
link2pay-app/
├── contracts/
│   └── privacy-pool-x402/          # Soroban privacy pool contract
│       ├── src/
│       │   ├── lib.rs              # Main contract logic
│       │   ├── merkle.rs           # Merkle tree implementation
│       │   ├── verifier.rs         # Groth16 verifier (auto-generated)
│       │   └── types.rs            # Contract types
│       ├── Cargo.toml
│       └── README.md
│
├── circuits/                        # Circom ZK circuits
│   ├── circuits/
│   │   ├── x402_payment.circom     # Main payment circuit
│   │   ├── merkle_proof.circom     # Merkle proof helper
│   │   └── test/                   # Circuit tests
│   ├── scripts/
│   │   ├── compile.sh              # Compile circuits
│   │   ├── setup-keys.sh           # Generate proving keys
│   │   └── generate-verifier.sh    # Generate Soroban verifier
│   ├── build/                      # Compiled circuits (WASM, R1CS)
│   ├── keys/                       # Proving/verification keys
│   └── package.json
│
├── backend/                         # Node.js API server
│   ├── src/
│   │   ├── services/
│   │   │   ├── proofGenerationService.ts
│   │   │   ├── privacyScoreService.ts
│   │   │   ├── batchSettlementService.ts
│   │   │   ├── merkleTreeService.ts
│   │   │   └── privacyPoolService.ts
│   │   ├── routes/
│   │   │   ├── privacy.ts          # Privacy pool endpoints
│   │   │   └── x402.ts             # x402 integration
│   │   ├── middleware/
│   │   │   └── privateX402.ts      # Privacy layer for x402
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma           # Database schema (privacy extensions)
│   └── package.json
│
├── frontend/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── Privacy/
│   │   │       ├── PrivacyDashboard.tsx
│   │   │       ├── DepositFlow.tsx
│   │   │       ├── PaymentFlow.tsx
│   │   │       └── PrivacyScore.tsx
│   │   ├── services/
│   │   │   ├── privacyPool.ts
│   │   │   └── privateX402.ts
│   │   └── pages/
│   │       └── PrivacyManager.tsx
│   └── package.json
│
├── agents/                          # Demo agents
│   ├── trading-bot.ts              # Private trading bot
│   ├── research-bot.ts             # Private research agent
│   └── data-bot.ts                 # Data aggregation agent
│
├── docs/                            # Documentation
│   ├── ARCHITECTURE.md             # System architecture
│   ├── CONTEXT.md                  # This file
│   ├── DOCUMENTATION.md            # API documentation
│   └── DEPLOYMENT.md               # Deployment guide
│
├── HACKATHON_PROPOSAL.md           # Hackathon submission
└── README.md                        # Project overview
```

---

## Development Workflow

### Phase 1: Smart Contract Development

**Location:** `contracts/privacy-pool-x402/`

```bash
# 1. Write contract code
cd contracts/privacy-pool-x402
code src/lib.rs

# 2. Build contract
stellar contract build

# 3. Run tests
cargo test

# 4. Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/privacy_pool_x402.wasm \
  --network testnet

# 5. Initialize contract
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- initialize \
  --admin <ADMIN_ADDRESS> \
  --operator <OPERATOR_ADDRESS> \
  --usdc_token <USDC_CONTRACT>

# 6. Test deposit
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- deposit \
  --from <YOUR_ADDRESS> \
  --amount 10000000 \
  --commitment 0x1234...
```

### Phase 2: Circuit Development

**Location:** `circuits/`

```bash
cd circuits

# 1. Write circuit
code circuits/x402_payment.circom

# 2. Compile circuit
./scripts/compile.sh

# Output:
# - build/x402_payment.r1cs
# - build/x402_payment.wasm
# - build/x402_payment.sym

# 3. Download Powers of Tau (one-time)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau -O ptau/powersOfTau28_hez_final_14.ptau

# 4. Generate proving key
snarkjs groth16 setup \
  build/x402_payment.r1cs \
  ptau/powersOfTau28_hez_final_14.ptau \
  keys/x402_payment_0000.zkey

# 5. Contribute randomness
snarkjs zkey contribute \
  keys/x402_payment_0000.zkey \
  keys/x402_payment_final.zkey \
  --name="Link2Pay Contribution"

# 6. Export verification key
snarkjs zkey export verificationkey \
  keys/x402_payment_final.zkey \
  keys/verification_key.json

# 7. Generate Soroban verifier
soroban-verifier-gen \
  --vk keys/verification_key.json \
  --public-input-count 3 \
  > ../contracts/privacy-pool-x402/src/verifier.rs

# 8. Test proof generation
node test-proof-generation.js
```

### Phase 3: Backend Development

**Location:** `backend/`

```bash
cd backend

# 1. Setup database
npm run prisma:migrate
npm run prisma:generate

# 2. Start development server
npm run dev

# 3. Test proof generation endpoint
curl -X POST http://localhost:3001/api/privacy/generate-proof \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10.0",
    "secret": "0x7f3a...",
    "nullifier": "0x2b1c...",
    "serviceAddress": "GSERVICE...",
    "paymentAmount": "0.01",
    "merkleProof": {...}
  }'

# 4. Run tests
npm test

# 5. Build for production
npm run build
```

### Phase 4: Frontend Development

**Location:** `frontend/`

```bash
cd frontend

# 1. Start dev server
npm run dev

# 2. Open browser
open http://localhost:5173

# 3. Test deposit flow
# Navigate to /privacy/deposit
# Connect Freighter wallet
# Deposit 10 USDC

# 4. Test payment flow
# Navigate to /privacy/pay
# Select service
# Generate proof and pay

# 5. Build for production
npm run build
npm run preview
```

---

## Testing Strategy

### Unit Tests

```typescript
// Example: Test proof generation
describe('ProofGenerationService', () => {
  it('should generate valid payment proof', async () => {
    const proof = await proofService.generatePaymentProof({
      amount: '10.0',
      secret: '0x123...',
      nullifier: '0x456...',
      serviceAddress: 'GSERVICE...',
      paymentAmount: '0.01',
      merkleProof: mockMerkleProof,
    });

    expect(proof).toBeDefined();
    expect(proof.proof).toHaveLength(256); // Serialized proof size

    // Verify locally
    const valid = await proofService.verifyProof(
      proof.proof,
      proof.publicSignals
    );
    expect(valid).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Example: End-to-end deposit flow
describe('Privacy Pool Deposit', () => {
  it('should deposit and retrieve commitment', async () => {
    // 1. Generate commitment
    const secret = randomBytes(32);
    const nullifier = randomBytes(32);
    const commitment = poseidon([amount, secret, nullifier]);

    // 2. Submit deposit
    const result = await privacyPool.deposit({
      from: testWallet,
      amount: '10.0',
      commitment,
    });

    expect(result.index).toBeDefined();

    // 3. Verify commitment in tree
    const merkleProof = await privacyPool.getMerkleProof(result.index);
    expect(merkleProof.root).toBe(await privacyPool.getMerkleRoot());
  });
});
```

### Contract Tests

```rust
#[test]
fn test_deposit_and_payment() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PrivacyPoolX402);
    let client = PrivacyPoolX402Client::new(&env, &contract_id);

    // Initialize
    client.initialize(&admin, &operator, &usdc_token);

    // Deposit
    let commitment = BytesN::from_array(&env, &[1u8; 32]);
    let index = client.deposit(&user, &10_000_000, &commitment);
    assert_eq!(index, 0);

    // Queue payment
    let nullifier = BytesN::from_array(&env, &[2u8; 32]);
    let proof = Bytes::new(&env);
    client.pay_x402_service(
        &nullifier,
        &service_address,
        &100_000,
        &client.get_merkle_root(),
        &proof
    );

    // Verify payment queued
    let pending = client.get_pending_payments();
    assert_eq!(pending.len(), 1);
}
```

---

## Common Development Tasks

### 1. Deploy New Contract Version

```bash
# Build
cd contracts/privacy-pool-x402
stellar contract build

# Deploy
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/privacy_pool_x402.wasm \
  --network testnet \
  --source <SECRET_KEY>)

echo "Deployed contract: $CONTRACT_ID"

# Update environment variables
echo "PRIVACY_POOL_CONTRACT_ID=$CONTRACT_ID" >> ../../backend/.env
echo "VITE_PRIVACY_POOL_CONTRACT=$CONTRACT_ID" >> ../../frontend/.env
```

### 2. Regenerate ZK Circuits

```bash
cd circuits

# Modify circuit
code circuits/x402_payment.circom

# Recompile
./scripts/compile.sh

# Regenerate keys
./scripts/setup-keys.sh

# Regenerate Soroban verifier
./scripts/generate-verifier.sh

# Redeploy contract (verifier changed)
cd ../contracts/privacy-pool-x402
stellar contract build
stellar contract deploy ...
```

### 3. Add New Privacy Metric

```typescript
// backend/src/services/privacyScoreService.ts

// 1. Add new metric calculation
private calculateNewMetric(data: Data[]): number {
  // Your calculation logic
  return score;
}

// 2. Update calculatePrivacyScore()
async calculatePrivacyScore(params: Params): Promise<PrivacyScore> {
  const newMetric = this.calculateNewMetric(params.data);

  const overallScore = Math.floor(
    anonymityScore * 0.4 +
    amountScore * 0.3 +
    timingScore * 0.2 +
    newMetric * 0.1  // New metric with 10% weight
  );

  return { ...score, newMetric };
}

// 3. Update frontend to display new metric
// frontend/src/components/Privacy/PrivacyScore.tsx
<ScoreBar
  label="New Metric"
  score={privacyScore?.newMetric}
/>
```

### 4. Test End-to-End Flow Locally

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Run demo agent
cd agents
node trading-bot.js deposit 10
node trading-bot.js pay search-api "stellar news"
```

---

## Debugging Guide

### Contract Debugging

```bash
# Enable debug logs
export RUST_LOG=soroban_sdk=debug

# Run specific test with logs
cargo test test_deposit -- --nocapture

# Check contract state
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_merkle_root

# View recent transactions
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_pending_payments
```

### Circuit Debugging

```bash
# Generate witness for debugging
snarkjs wtns calculate \
  build/x402_payment.wasm \
  input.json \
  witness.wtns

# Export witness to JSON
snarkjs wtns export json \
  witness.wtns \
  witness.json

# Check witness values
cat witness.json | jq '.[] | select(. != "0")'

# Verify constraints satisfied
snarkjs r1cs print \
  build/x402_payment.r1cs \
  witness.wtns
```

### Proof Verification Debugging

```typescript
// backend/test-proof-verification.ts
import { groth16 } from 'snarkjs';

async function debugProofVerification() {
  // 1. Generate proof
  console.log('Generating proof...');
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    'circuits/build/x402_payment.wasm',
    'circuits/keys/x402_payment_final.zkey'
  );
  console.log('Proof generated:', proof);

  // 2. Verify locally
  console.log('Verifying locally...');
  const vKey = JSON.parse(fs.readFileSync(
    'circuits/keys/verification_key.json',
    'utf8'
  ));
  const validLocal = await groth16.verify(vKey, publicSignals, proof);
  console.log('Valid locally:', validLocal);

  // 3. Serialize for Soroban
  console.log('Serializing for Soroban...');
  const serialized = serializeProofForSoroban(proof);
  console.log('Serialized bytes:', serialized.toString('hex'));

  // 4. Submit to contract
  console.log('Submitting to Soroban...');
  try {
    const result = await submitProofToContract(serialized, publicSignals);
    console.log('✅ Verification succeeded on-chain');
  } catch (error) {
    console.log('❌ Verification failed:', error.message);

    // Try alternative serializations
    console.log('Trying alternative serializations...');
    await tryAlternativeSerializations(proof, publicSignals);
  }
}
```

---

## Performance Benchmarks

### Target Metrics

| Operation | Target | Notes |
|-----------|--------|-------|
| Deposit TX | <3s | Including Stellar confirmation |
| Proof Generation | 5-10s | Backend (Node.js + snarkjs) |
| Proof Verification | <100ms | On-chain (Soroban) |
| Batch Settlement | <5s | 10-50 payments aggregated |
| Privacy Score Calc | <100ms | Cached for 30s |
| Merkle Proof Gen | <50ms | Sparse tree lookup |

### Profiling Commands

```bash
# Profile proof generation
node --prof agents/profile-proof-gen.js
node --prof-process isolate-*.log > proof-gen-profile.txt

# Profile backend API
npm run dev -- --inspect
# Open chrome://inspect in browser

# Profile Soroban contract
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --fee 10000000 \
  -- pay_x402_service ...
# Check transaction resource usage in Stellar Explorer
```

---

## Troubleshooting

### Common Issues

**Issue: Proof verification fails on-chain**
```bash
# Check if proof is valid locally first
node backend/test-proof-verification.js

# Common causes:
# 1. G2 serialization order (try imaginary-first)
# 2. Endianness (use little-endian for Soroban)
# 3. Verification key mismatch (regenerate verifier)

# Fix: Regenerate Soroban verifier from latest VK
soroban-verifier-gen \
  --vk circuits/keys/verification_key.json \
  --public-input-count 3 \
  > contracts/privacy-pool-x402/src/verifier.rs
```

**Issue: Merkle root mismatch**
```bash
# Sync Merkle tree state from contract
node backend/sync-merkle-tree.js

# Verify root matches
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- get_merkle_root

# Compare with local tree
node backend/check-merkle-root.js
```

**Issue: Out of gas in batch settlement**
```bash
# Reduce batch size
# backend/src/services/batchSettlementService.ts
private minBatchSize: number = 5; // Reduced from 10

# Or increase fee
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --fee 1000000 \
  -- batch_settle ...
```

---

## Resources

### Documentation
- [Stellar Docs](https://developers.stellar.org/)
- [Soroban Docs](https://soroban.stellar.org/)
- [Circom Docs](https://docs.circom.io/)
- [snarkjs Docs](https://github.com/iden3/snarkjs)
- [x402 Protocol](https://developers.stellar.org/docs/build/apps/x402)

### Tools
- [Stellar Lab](https://laboratory.stellar.org/)
- [Stellar Expert](https://stellar.expert/)
- [Freighter Wallet](https://freighter.app/)
- [soroban-verifier-gen](https://github.com/OpenZeppelin/soroban-verifier)

### Community
- [Stellar Discord](https://discord.gg/stellar)
- [Stellar Stack Exchange](https://stellar.stackexchange.com/)
- [Circom Telegram](https://t.me/circom_support)

---

## Next Steps

1. **Read ARCHITECTURE.md** - Understand system design
2. **Read DOCUMENTATION.md** - Learn API interfaces
3. **Setup environment** - Install dependencies
4. **Deploy contracts** - Get testnet contract IDs
5. **Run demo** - Test end-to-end flow
6. **Start developing** - Pick a component and code!

---

## Contact & Support

For questions during hackathon:
- Stellar Hacks Telegram: [Link]
- Stellar Dev Discord: [Link]
- Project Issues: [GitHub Issues]

Good luck building! 🚀
