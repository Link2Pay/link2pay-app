# Link2Pay ZK-Bridge - System Architecture

## Table of Contents
1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Smart Contracts](#smart-contracts)
5. [Backend Services](#backend-services)
6. [Frontend Components](#frontend-components)
7. [Security Architecture](#security-architecture)
8. [Scalability Considerations](#scalability-considerations)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AGENT LAYER                              │
│  TradingBot │ ResearchBot │ AnalysisBot │ DataBot │ CustomBot  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AGENT SDK LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  @link2pay/zk-bridge-sdk                                 │   │
│  │  - deposit()    - payService()    - getPrivacyScore()    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVACY LAYER (Core)                          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  ZK Proof    │  │   Privacy    │  │   Batch      │         │
│  │  Generator   │  │   Pool       │  │   Settler    │         │
│  │  (Backend)   │  │  (Soroban)   │  │  (Operator)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         ↓                 ↓                  ↓                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Merkle Tree State Manager                      │  │
│  │  - Track commitments  - Generate proofs  - Sync roots    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Privacy Score   │  │  Diff. Privacy   │                    │
│  │  Engine          │  │  Analytics       │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      x402 SERVICE LAYER                          │
│  SearchAPI │ DataAPI │ AnalysisAPI │ NewsAPI │ PriceAPI        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    STELLAR NETWORK                               │
│  Soroban Contracts │ Horizon API │ RPC │ Ledger                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Privacy Pool Contract (Soroban)

**Location:** `contracts/privacy-pool-x402/`

**Purpose:** Core smart contract managing deposits, payments, and batching on Stellar

**Key Components:**

```rust
// contracts/privacy-pool-x402/src/lib.rs
#[contract]
pub struct PrivacyPoolX402 {
    // State
    admin: Address,
    operator: Address,
    usdc_token: Address,

    // Merkle tree
    commitments: Vec<BytesN<32>>,
    merkle_root: BytesN<32>,
    tree_depth: u32,

    // Privacy tracking
    nullifiers_spent: Map<BytesN<32>, bool>,
    pending_payments: Vec<PendingPayment>,

    // Analytics
    total_deposits: u64,
    total_payments: u64,
    anonymity_set_size: u64,
}

// Core functions
impl PrivacyPoolX402 {
    // Initialize contract
    pub fn initialize(
        env: Env,
        admin: Address,
        operator: Address,
        usdc_token: Address
    ) -> Result<(), Error>;

    // Deposit USDC anonymously
    pub fn deposit(
        env: Env,
        from: Address,
        amount: i128,
        commitment: BytesN<32>
    ) -> Result<u32, Error>;

    // Pay x402 service privately
    pub fn pay_x402_service(
        env: Env,
        nullifier: BytesN<32>,
        service_address: Address,
        amount: i128,
        merkle_root: BytesN<32>,
        proof: Bytes
    ) -> Result<(), Error>;

    // Batch settle pending payments
    pub fn batch_settle(
        env: Env,
        operator: Address
    ) -> Result<BatchResult, Error>;

    // Get privacy metrics
    pub fn get_privacy_score(env: Env) -> PrivacyMetrics;

    // Get Merkle proof for commitment
    pub fn get_merkle_proof(
        env: Env,
        index: u32
    ) -> Result<MerkleProof, Error>;
}
```

**Storage Layout:**

```rust
// Storage keys
const ADMIN: Symbol = symbol!("admin");
const OPERATOR: Symbol = symbol!("operator");
const COMMITMENTS: Symbol = symbol!("commits");
const MERKLE_ROOT: Symbol = symbol!("root");
const NULLIFIERS: Symbol = symbol!("nulls");
const PENDING: Symbol = symbol!("pending");
const METRICS: Symbol = symbol!("metrics");
```

**Events:**

```rust
#[event(name = "deposit")]
pub struct DepositEvent {
    commitment: BytesN<32>,
    index: u32,
    timestamp: u64,
}

#[event(name = "payment_queued")]
pub struct PaymentQueuedEvent {
    nullifier: BytesN<32>,
    service: Address,
    amount: i128,
    timestamp: u64,
}

#[event(name = "batch_settled")]
pub struct BatchSettledEvent {
    payment_count: u32,
    total_amount: i128,
    timestamp: u64,
}
```

---

### 2. ZK Circuits (Circom)

**Location:** `circuits/`

**Purpose:** Generate zero-knowledge proofs for anonymous payments

**Circuit Structure:**

```circom
// circuits/circuits/x402_payment.circom
pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkle_proof.circom";

template X402Payment(levels) {
    // ========== PRIVATE INPUTS (Agent only knows) ==========
    signal input amount;              // Original deposit amount
    signal input secret;              // Random 256-bit secret
    signal input nullifier;           // Unique per payment
    signal input pathElements[levels]; // Merkle proof siblings
    signal input pathIndices[levels]; // Merkle proof path (0=left, 1=right)

    // ========== PUBLIC INPUTS (On-chain visible) ==========
    signal input serviceAddress;      // x402 service address
    signal input paymentAmount;       // Amount to pay service
    signal input merkleRoot;          // Current pool Merkle root

    // ========== OUTPUT ==========
    signal output nullifierHash;      // Prevents double-spend

    // Step 1: Compute commitment
    component commitmentHasher = Poseidon(3);
    commitmentHasher.inputs[0] <== amount;
    commitmentHasher.inputs[1] <== secret;
    commitmentHasher.inputs[2] <== nullifier;

    // Step 2: Verify commitment is in Merkle tree
    component merkleProof = MerkleProof(levels);
    merkleProof.leaf <== commitmentHasher.out;
    merkleProof.pathElements <== pathElements;
    merkleProof.pathIndices <== pathIndices;
    merkleProof.root === merkleRoot;

    // Step 3: Verify payment amount <= deposit amount
    component amountCheck = LessEqThan(64);
    amountCheck.in[0] <== paymentAmount;
    amountCheck.in[1] <== amount;
    amountCheck.out === 1;

    // Step 4: Compute nullifier hash (public)
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash <== nullifierHasher.out;
}

// Main component with 10-level Merkle tree (1024 capacity)
component main {public [serviceAddress, paymentAmount, merkleRoot]} = X402Payment(10);
```

**Merkle Proof Helper:**

```circom
// circuits/circuits/merkle_proof.circom
template MerkleProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;

    component hashers[levels];
    signal hashes[levels + 1];
    hashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);

        // If pathIndices[i] == 0: hash(current, sibling)
        // If pathIndices[i] == 1: hash(sibling, current)
        hashers[i].inputs[0] <== hashes[i] - pathIndices[i] * (hashes[i] - pathElements[i]);
        hashers[i].inputs[1] <== pathElements[i] + pathIndices[i] * (hashes[i] - pathElements[i]);

        hashes[i + 1] <== hashers[i].out;
    }

    root <== hashes[levels];
}
```

**Circuit Compilation:**

```bash
# Compile circuit
circom circuits/x402_payment.circom \
    --r1cs --wasm --sym \
    -o build/

# Generate proving key (using Powers of Tau)
snarkjs groth16 setup \
    build/x402_payment.r1cs \
    ptau/powersOfTau28_hez_final_14.ptau \
    keys/x402_payment_0000.zkey

# Contribute randomness
snarkjs zkey contribute \
    keys/x402_payment_0000.zkey \
    keys/x402_payment_final.zkey \
    --name="Link2Pay" -v

# Export verification key
snarkjs zkey export verificationkey \
    keys/x402_payment_final.zkey \
    keys/verification_key.json

# Generate Soroban verifier
soroban-verifier-gen \
    --vk keys/verification_key.json \
    --public-input-count 3 \
    > contracts/privacy-pool-x402/src/verifier.rs
```

---

### 3. Backend Services

**Location:** `backend/src/services/`

#### 3.1 Proof Generation Service

```typescript
// backend/src/services/proofGenerationService.ts
import { groth16 } from 'snarkjs';
import { poseidon } from 'circomlibjs';

export class ProofGenerationService {
    private wasmPath: string;
    private zkeyPath: string;

    constructor() {
        this.wasmPath = './circuits/build/x402_payment.wasm';
        this.zkeyPath = './circuits/keys/x402_payment_final.zkey';
    }

    /**
     * Generate ZK proof for anonymous payment
     */
    async generatePaymentProof(params: {
        amount: string;
        secret: string;
        nullifier: string;
        serviceAddress: string;
        paymentAmount: string;
        merkleProof: MerkleProof;
    }): Promise<ProofData> {
        // Prepare circuit inputs
        const input = {
            // Private
            amount: params.amount,
            secret: params.secret,
            nullifier: params.nullifier,
            pathElements: params.merkleProof.pathElements,
            pathIndices: params.merkleProof.pathIndices,

            // Public
            serviceAddress: params.serviceAddress,
            paymentAmount: params.paymentAmount,
            merkleRoot: params.merkleProof.root,
        };

        // Generate proof
        const { proof, publicSignals } = await groth16.fullProve(
            input,
            this.wasmPath,
            this.zkeyPath
        );

        return {
            proof: this.serializeProof(proof),
            publicSignals,
            nullifierHash: publicSignals[0],
        };
    }

    /**
     * Verify proof locally before submission
     */
    async verifyProof(
        proof: any,
        publicSignals: any[]
    ): Promise<boolean> {
        const vKey = await this.loadVerificationKey();
        return await groth16.verify(vKey, publicSignals, proof);
    }

    /**
     * Serialize proof for Soroban contract
     */
    private serializeProof(proof: any): Buffer {
        // Serialize G1 points (pi_a, pi_c)
        const piA = this.serializeG1Point(proof.pi_a);
        const piC = this.serializeG1Point(proof.pi_c);

        // Serialize G2 point (pi_b) - imaginary first ordering
        const piB = this.serializeG2Point(proof.pi_b);

        return Buffer.concat([piA, piB, piC]);
    }

    private serializeG1Point(point: string[]): Buffer {
        // Convert to little-endian bytes
        const x = BigInt(point[0]);
        const y = BigInt(point[1]);
        return Buffer.concat([
            this.bigIntToLE(x, 32),
            this.bigIntToLE(y, 32)
        ]);
    }

    private serializeG2Point(point: string[][]): Buffer {
        // G2 point has 4 coordinates: X = (x1, x0), Y = (y1, y0)
        // Soroban expects imaginary-first: (x1, x0, y1, y0)
        const x1 = BigInt(point[0][0]);
        const x0 = BigInt(point[0][1]);
        const y1 = BigInt(point[1][0]);
        const y0 = BigInt(point[1][1]);

        return Buffer.concat([
            this.bigIntToLE(x1, 32),
            this.bigIntToLE(x0, 32),
            this.bigIntToLE(y1, 32),
            this.bigIntToLE(y0, 32)
        ]);
    }

    private bigIntToLE(value: bigint, length: number): Buffer {
        const hex = value.toString(16).padStart(length * 2, '0');
        const bytes = Buffer.from(hex, 'hex');
        return bytes.reverse(); // Convert to little-endian
    }
}
```

#### 3.2 Privacy Score Service

```typescript
// backend/src/services/privacyScoreService.ts
export class PrivacyScoreService {
    /**
     * Calculate privacy score for current state
     */
    async calculatePrivacyScore(params: {
        anonymitySetSize: number;
        paymentAmount: string;
        recentPayments: Payment[];
    }): Promise<PrivacyScore> {
        // 1. Anonymity set score (0-100)
        const anonymityScore = this.calculateAnonymityScore(
            params.anonymitySetSize
        );

        // 2. Amount mixing score (0-100)
        const amountScore = this.calculateAmountMixingScore(
            params.paymentAmount,
            params.recentPayments
        );

        // 3. Timing score (0-100)
        const timingScore = this.calculateTimingScore(
            params.recentPayments
        );

        // Overall score (weighted average)
        const overallScore = Math.floor(
            anonymityScore * 0.5 +
            amountScore * 0.3 +
            timingScore * 0.2
        );

        return {
            anonymitySetSize: params.anonymitySetSize,
            anonymityScore,
            amountScore,
            timingScore,
            overallScore,
            rating: this.getRating(overallScore),
            recommendations: this.generateRecommendations({
                anonymityScore,
                amountScore,
                timingScore,
            }),
        };
    }

    private calculateAnonymityScore(size: number): number {
        // Score based on anonymity set size
        if (size < 10) return 20;
        if (size < 50) return 50;
        if (size < 100) return 70;
        if (size < 200) return 85;
        return 95;
    }

    private calculateAmountMixingScore(
        amount: string,
        recentPayments: Payment[]
    ): number {
        // Calculate how common this amount is
        const amountFloat = parseFloat(amount);
        const similarPayments = recentPayments.filter(p => {
            const pAmount = parseFloat(p.amount);
            // Within 10% of this amount
            return Math.abs(pAmount - amountFloat) / amountFloat < 0.1;
        });

        const percentageSimilar = similarPayments.length / recentPayments.length;
        return Math.floor(percentageSimilar * 100);
    }

    private calculateTimingScore(recentPayments: Payment[]): number {
        // Analyze timing patterns
        if (recentPayments.length < 2) return 100;

        const intervals: number[] = [];
        for (let i = 1; i < recentPayments.length; i++) {
            const interval = recentPayments[i].timestamp - recentPayments[i-1].timestamp;
            intervals.push(interval);
        }

        // Calculate variance (higher = better privacy)
        const mean = intervals.reduce((a, b) => a + b) / intervals.length;
        const variance = intervals.reduce((sum, val) =>
            sum + Math.pow(val - mean, 2), 0
        ) / intervals.length;

        // Normalize to 0-100 (higher variance = higher score)
        const normalizedVariance = Math.min(variance / 10000, 1);
        return Math.floor(normalizedVariance * 100);
    }

    private getRating(score: number): PrivacyRating {
        if (score >= 90) return 'EXCELLENT';
        if (score >= 75) return 'HIGH';
        if (score >= 50) return 'MEDIUM';
        return 'LOW';
    }

    private generateRecommendations(scores: {
        anonymityScore: number;
        amountScore: number;
        timingScore: number;
    }): string[] {
        const recommendations: string[] = [];

        if (scores.anonymityScore < 70) {
            recommendations.push(
                'Wait for more users to join the pool for better anonymity'
            );
        }

        if (scores.amountScore < 50) {
            recommendations.push(
                'Consider rounding amounts to common values (0.01, 0.05, 0.1, etc.)'
            );
        }

        if (scores.timingScore < 50) {
            recommendations.push(
                'Add random delays between payments (30-120 seconds)'
            );
        }

        if (recommendations.length === 0) {
            recommendations.push('Privacy settings are optimal');
        }

        return recommendations;
    }
}
```

#### 3.3 Batch Settlement Service

```typescript
// backend/src/services/batchSettlementService.ts
export class BatchSettlementService {
    private minBatchSize: number = 10;
    private maxWaitTime: number = 120_000; // 2 minutes

    /**
     * Run batch settlement loop
     */
    async start() {
        setInterval(async () => {
            await this.processBatch();
        }, 30_000); // Check every 30 seconds
    }

    private async processBatch() {
        // Get pending payments from contract
        const pending = await this.getPendingPayments();

        if (pending.length === 0) return;

        // Check if should batch now
        const shouldBatch =
            pending.length >= this.minBatchSize ||
            this.oldestPaymentAge(pending) > this.maxWaitTime;

        if (!shouldBatch) return;

        console.log(`Processing batch of ${pending.length} payments`);

        // Group by service for aggregation
        const grouped = this.groupByService(pending);

        // Execute batch settlement
        const result = await this.executeSettlement(grouped);

        console.log(`Batch settled: ${result.transactionHash}`);
        console.log(`Gas saved: ${result.gasSaved}%`);
    }

    private groupByService(
        payments: PendingPayment[]
    ): Map<string, i128> {
        const grouped = new Map<string, i128>();

        for (const payment of payments) {
            const current = grouped.get(payment.service) || 0;
            grouped.set(payment.service, current + payment.amount);
        }

        return grouped;
    }

    private async executeSettlement(
        grouped: Map<string, i128>
    ): Promise<SettlementResult> {
        // Build Soroban transaction
        const xdr = await stellarService.buildContractInvocation({
            contractId: PRIVACY_POOL_CONTRACT_ID,
            method: 'batch_settle',
            args: [OPERATOR_ADDRESS],
        });

        // Submit transaction
        const result = await stellarService.submitTransaction(xdr);

        // Calculate gas savings
        const individualGas = grouped.size * 100_000; // Estimated
        const batchGas = result.gasUsed;
        const gasSaved = Math.floor(
            ((individualGas - batchGas) / individualGas) * 100
        );

        return {
            transactionHash: result.hash,
            paymentCount: grouped.size,
            totalAmount: Array.from(grouped.values()).reduce((a, b) => a + b),
            gasSaved,
        };
    }
}
```

---

### 4. Frontend Components

**Location:** `frontend/src/components/Privacy/`

#### 4.1 Privacy Dashboard

```typescript
// frontend/src/components/Privacy/PrivacyDashboard.tsx
import { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { privacyScoreService } from '../../services/privacyScore';

export function PrivacyDashboard() {
    const { publicKey } = useWalletStore();
    const [privacyScore, setPrivacyScore] = useState<PrivacyScore | null>(null);
    const [deposits, setDeposits] = useState<Deposit[]>([]);

    useEffect(() => {
        loadPrivacyData();
        const interval = setInterval(loadPrivacyData, 10_000); // Update every 10s
        return () => clearInterval(interval);
    }, [publicKey]);

    const loadPrivacyData = async () => {
        const score = await privacyScoreService.getScore();
        setPrivacyScore(score);

        const userDeposits = await privacyPoolService.getDeposits(publicKey!);
        setDeposits(userDeposits);
    };

    return (
        <div className="privacy-dashboard">
            {/* Privacy Score Card */}
            <div className="privacy-score-card">
                <h2>🛡️ Privacy Score</h2>
                <div className="score-display">
                    <div className="score-number">{privacyScore?.overallScore}/100</div>
                    <div className="score-rating">{privacyScore?.rating}</div>
                </div>

                <div className="score-breakdown">
                    <ScoreBar
                        label="Anonymity Set"
                        score={privacyScore?.anonymityScore}
                        value={`${privacyScore?.anonymitySetSize} users`}
                    />
                    <ScoreBar
                        label="Amount Mixing"
                        score={privacyScore?.amountScore}
                    />
                    <ScoreBar
                        label="Timing"
                        score={privacyScore?.timingScore}
                    />
                </div>

                <div className="recommendations">
                    <h3>💡 Recommendations</h3>
                    {privacyScore?.recommendations.map(rec => (
                        <div key={rec} className="recommendation-item">
                            {rec}
                        </div>
                    ))}
                </div>
            </div>

            {/* Deposits Card */}
            <div className="deposits-card">
                <h2>Your Private Deposits</h2>
                {deposits.map(deposit => (
                    <DepositCard key={deposit.id} deposit={deposit} />
                ))}
            </div>
        </div>
    );
}
```

---

## Data Flow

### Deposit Flow

```
Agent Wallet
    │
    ├─1. Generate secrets
    │   - secret = random(32 bytes)
    │   - nullifier = random(32 bytes)
    │
    ├─2. Compute commitment
    │   commitment = Poseidon(amount, secret, nullifier)
    │
    └─3. Submit deposit transaction
        │
        ▼
Privacy Pool Contract (Soroban)
    │
    ├─4. Verify sender signature
    ├─5. Transfer USDC to pool
    ├─6. Insert commitment to Merkle tree
    ├─7. Update Merkle root
    └─8. Emit DepositEvent
        │
        ▼
Agent (Local Storage)
    │
    └─9. Save credentials
        {
            amount: "10.0",
            secret: "0x7f3a...",
            nullifier: "0x2b1c...",
            index: 47
        }
```

### Payment Flow

```
Agent
    │
    ├─1. Request Merkle proof
    │   GET /api/privacy/merkle-proof?index=47
    │
    ├─2. Generate ZK proof (Backend)
    │   - Load circuit WASM
    │   - Generate witness
    │   - Generate Groth16 proof (~8s)
    │
    └─3. Submit payment request
        POST /api/privacy/pay-x402
        {
            nullifier: "0x2b1c...",
            serviceAddress: "GSERVICE...",
            amount: "0.01",
            proof: {...}
        }
        │
        ▼
Privacy Pool Contract
    │
    ├─4. Verify proof (Groth16)
    │   - Check nullifier not spent
    │   - Verify Merkle root valid
    │   - Verify proof cryptographically
    │
    ├─5. Mark nullifier spent
    ├─6. Queue payment for batch
    └─7. Emit PaymentQueuedEvent
        │
        ▼
Batch Settler (Every 2 min)
    │
    ├─8. Fetch pending payments
    ├─9. Group by service
    ├─10. Execute batch settlement
    │     - Transfer aggregated amounts
    └─11. Emit BatchSettledEvent
        │
        ▼
x402 Service
    │
    └─12. Receive payment
          Return data to agent
```

---

## Security Architecture

### Threat Model

```
┌──────────────────────────────────────────────────────────────┐
│                    TRUST BOUNDARIES                           │
└──────────────────────────────────────────────────────────────┘

1. Agent → Privacy Pool
   ✅ ZK proofs (agent can't cheat)
   ✅ Nullifiers (no double-spend)
   ✅ Merkle proofs (must have deposit)

2. Privacy Pool → Services
   ✅ Soroban auth (contract-signed TXs)
   ✅ USDC transfers (atomic)
   ✅ Batch verification (gas optimized)

3. Operator → Privacy Pool
   ✅ Authorized operator address
   ✅ Can only settle, not withdraw
   ✅ All actions auditable on-chain

4. Observer → On-chain Data
   ❌ Cannot link payments to agents
   ❌ Cannot determine deposit amounts
   ❌ Cannot correlate service usage
   ✅ Can verify all proofs (transparency)
```

### Key Security Properties

1. **Anonymity:** Agent identity hidden via ZK proofs
2. **Non-Linkability:** Payments cannot be linked to same agent
3. **Double-Spend Protection:** Nullifiers prevent reuse
4. **Completeness:** Valid proofs always verify
5. **Soundness:** Invalid proofs never verify
6. **Zero-Knowledge:** Proof reveals nothing beyond validity

---

## Scalability Considerations

### Performance Metrics

| Component | Metric | Target | Notes |
|-----------|--------|--------|-------|
| Proof Generation | Time | 5-10s | Backend (Node.js) |
| Proof Verification | Time | <100ms | On-chain (Soroban) |
| Merkle Tree Depth | Capacity | 1,024 | 2^10 commitments |
| Batch Size | Payments | 10-50 | Per settlement |
| Privacy Score | Latency | <100ms | Real-time calculation |

### Optimization Strategies

1. **Proof Generation Caching**
   - Cache circuit WASM in memory
   - Reuse loaded proving key
   - Parallel proof generation (multiple agents)

2. **Merkle Tree Optimization**
   - Sparse tree (only store non-empty nodes)
   - Pre-compute zero values
   - Incremental root updates

3. **Batch Settlement**
   - Group by service address
   - Aggregate amounts
   - Single contract call for multiple payments

4. **Privacy Score Caching**
   - Cache for 30 seconds
   - Update on deposit/payment events
   - Background calculation (no blocking)

---

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      TECH STACK                              │
├─────────────────────────────────────────────────────────────┤
│ Smart Contracts  │ Rust, soroban-sdk 21.x, BN254 crypto     │
│ Circuits         │ Circom 2.0, snarkjs 0.7.x, Groth16      │
│ Backend          │ Node.js 18+, TypeScript, Express        │
│ Frontend         │ React 18, TypeScript, TailwindCSS       │
│ Database         │ PostgreSQL 14+, Prisma ORM              │
│ Blockchain       │ Stellar, Soroban, Horizon API           │
│ Cryptography     │ BN254 curve, Poseidon hash, Groth16    │
│ Infrastructure   │ Docker, Render, Vercel                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

See [CONTEXT.md](./CONTEXT.md) for development context and [DOCUMENTATION.md](./DOCUMENTATION.md) for detailed API documentation.
