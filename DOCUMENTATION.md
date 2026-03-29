# Link2Pay ZK-Bridge - API Documentation

## Table of Contents
1. [Smart Contract API](#smart-contract-api)
2. [Backend REST API](#backend-rest-api)
3. [Agent SDK](#agent-sdk)
4. [Circuit Interface](#circuit-interface)
5. [Data Types](#data-types)
6. [Error Handling](#error-handling)

---

## Smart Contract API

### Privacy Pool Contract (Soroban)

**Contract Address:** `CPRIVACY...` (testnet)

#### `initialize`

Initialize the privacy pool contract (one-time setup).

```rust
pub fn initialize(
    env: Env,
    admin: Address,
    operator: Address,
    usdc_token: Address
) -> Result<(), Error>
```

**Parameters:**
- `admin`: Administrator address (can upgrade contract)
- `operator`: Operator address (can batch settle)
- `usdc_token`: USDC token contract address

**Authorization:** None (anyone can initialize once)

**Returns:** `Ok(())` on success

**Example:**
```bash
stellar contract invoke \
  --id CPRIVACY... \
  --network testnet \
  -- initialize \
  --admin GADMIN123... \
  --operator GOPERATOR456... \
  --usdc_token CUSDC789...
```

---

#### `deposit`

Deposit USDC anonymously into the privacy pool.

```rust
pub fn deposit(
    env: Env,
    from: Address,
    amount: i128,
    commitment: BytesN<32>
) -> Result<u32, Error>
```

**Parameters:**
- `from`: Depositor's Stellar address
- `amount`: Amount in stroops (1 USDC = 10^7 stroops)
- `commitment`: Poseidon hash of (amount, secret, nullifier)

**Authorization:** Requires signature from `from` address

**Returns:** Merkle tree index (u32) where commitment was inserted

**Events:**
```rust
#[event(name = "deposit")]
pub struct DepositEvent {
    commitment: BytesN<32>,
    index: u32,
    timestamp: u64,
}
```

**Example:**
```bash
# Compute commitment off-chain first
# commitment = Poseidon(10000000, secret, nullifier)

stellar contract invoke \
  --id CPRIVACY... \
  --network testnet \
  --source GUSER123... \
  -- deposit \
  --from GUSER123... \
  --amount 10000000 \
  --commitment 0x9d4e3f2a1b...
```

**Errors:**
- `InvalidAmount`: Amount is zero or negative
- `InvalidCommitment`: Commitment is all zeros
- `InsufficientBalance`: Depositor doesn't have enough USDC
- `TransferFailed`: USDC transfer to pool failed

---

#### `pay_x402_service`

Pay an x402 service anonymously using ZK proof.

```rust
pub fn pay_x402_service(
    env: Env,
    nullifier: BytesN<32>,
    service_address: Address,
    amount: i128,
    merkle_root: BytesN<32>,
    proof: Bytes
) -> Result<(), Error>
```

**Parameters:**
- `nullifier`: Unique nullifier for this payment (prevents double-spend)
- `service_address`: Address of x402 service to pay
- `amount`: Payment amount in stroops
- `merkle_root`: Expected Merkle root (must match current root)
- `proof`: Serialized Groth16 proof (256 bytes)

**Authorization:** None (proof provides authorization)

**Returns:** `Ok(())` on success

**Events:**
```rust
#[event(name = "payment_queued")]
pub struct PaymentQueuedEvent {
    nullifier: BytesN<32>,
    service: Address,
    amount: i128,
    timestamp: u64,
}
```

**Proof Requirements:**
The proof must demonstrate:
1. Knowledge of a commitment in the Merkle tree
2. Commitment = Poseidon(deposit_amount, secret, nullifier)
3. payment_amount <= deposit_amount
4. Nullifier has never been used before

**Example:**
```bash
# Generate proof off-chain first using Agent SDK

stellar contract invoke \
  --id CPRIVACY... \
  --network testnet \
  -- pay_x402_service \
  --nullifier 0x2b1c8e4f... \
  --service_address GSERVICE789... \
  --amount 100000 \
  --merkle_root 0x5a8b9c2d... \
  --proof 0x1a2b3c4d...  # 256 bytes
```

**Errors:**
- `NullifierSpent`: This nullifier was already used
- `InvalidMerkleRoot`: Provided root doesn't match current root
- `InvalidProof`: ZK proof verification failed
- `InvalidAmount`: Amount exceeds deposit amount
- `InsufficientPoolBalance`: Pool doesn't have enough USDC

---

#### `batch_settle`

Settle all pending payments in one transaction (operator only).

```rust
pub fn batch_settle(
    env: Env,
    operator: Address
) -> Result<BatchResult, Error>
```

**Parameters:**
- `operator`: Must be the authorized operator address

**Authorization:** Requires operator signature

**Returns:**
```rust
pub struct BatchResult {
    payment_count: u32,
    total_amount: i128,
    gas_saved: u32,  // Percentage
}
```

**Events:**
```rust
#[event(name = "batch_settled")]
pub struct BatchSettledEvent {
    payment_count: u32,
    total_amount: i128,
    timestamp: u64,
}
```

**Example:**
```bash
stellar contract invoke \
  --id CPRIVACY... \
  --network testnet \
  --source GOPERATOR456... \
  -- batch_settle \
  --operator GOPERATOR456...
```

**Errors:**
- `Unauthorized`: Caller is not the operator
- `NoPendingPayments`: Queue is empty
- `BatchTransferFailed`: One or more transfers failed

---

#### `get_merkle_root`

Get the current Merkle root.

```rust
pub fn get_merkle_root(env: Env) -> BytesN<32>
```

**Authorization:** None (public read)

**Returns:** Current Merkle tree root (32 bytes)

**Example:**
```bash
stellar contract invoke \
  --id CPRIVACY... \
  --network testnet \
  -- get_merkle_root
```

---

#### `get_merkle_proof`

Get Merkle proof for a commitment at given index.

```rust
pub fn get_merkle_proof(
    env: Env,
    index: u32
) -> Result<MerkleProof, Error>
```

**Parameters:**
- `index`: Index of commitment in tree

**Returns:**
```rust
pub struct MerkleProof {
    root: BytesN<32>,
    leaf: BytesN<32>,
    path_elements: Vec<BytesN<32>>,  // Length = tree_depth
    path_indices: Vec<u32>,          // 0 = left, 1 = right
}
```

**Example:**
```bash
stellar contract invoke \
  --id CPRIVACY... \
  --network testnet \
  -- get_merkle_proof \
  --index 42
```

**Errors:**
- `InvalidIndex`: Index out of bounds

---

#### `get_privacy_score`

Get current privacy metrics for the pool.

```rust
pub fn get_privacy_score(env: Env) -> PrivacyMetrics
```

**Returns:**
```rust
pub struct PrivacyMetrics {
    anonymity_set_size: u64,      // Total unique depositors
    total_deposits: u64,           // Total deposits made
    total_payments: u64,           // Total payments processed
    average_deposit: i128,         // Average deposit amount
    merkle_tree_size: u32,         // Current tree size
}
```

**Authorization:** None (public read)

**Example:**
```bash
stellar contract invoke \
  --id CPRIVACY... \
  --network testnet \
  -- get_privacy_score
```

---

#### `is_nullifier_spent`

Check if a nullifier has been used.

```rust
pub fn is_nullifier_spent(
    env: Env,
    nullifier: BytesN<32>
) -> bool
```

**Parameters:**
- `nullifier`: Nullifier to check

**Returns:** `true` if spent, `false` if available

**Authorization:** None (public read)

**Example:**
```bash
stellar contract invoke \
  --id CPRIVACY... \
  --network testnet \
  -- is_nullifier_spent \
  --nullifier 0x2b1c8e4f...
```

---

## Backend REST API

**Base URL:** `http://localhost:3001/api` (development)
**Production:** `https://api.link2pay.app`

### Privacy Endpoints

#### POST `/privacy/generate-proof`

Generate a ZK proof for anonymous payment.

**Request:**
```json
{
  "amount": "10.0000000",
  "secret": "0x7f3a2b1c...",
  "nullifier": "0x9e8d7c6b...",
  "serviceAddress": "GSERVICE123...",
  "paymentAmount": "0.0100000",
  "merkleProof": {
    "root": "0x5a8b9c2d...",
    "pathElements": ["0x1a2b...", "0x3c4d...", ...],
    "pathIndices": [0, 1, 0, ...]
  }
}
```

**Response:**
```json
{
  "proof": "0x1a2b3c4d...",  // 256 bytes hex-encoded
  "publicSignals": [
    "0x9e8d7c6b...",  // nullifierHash
    "GSERVICE123...",  // serviceAddress
    "0.0100000"        // paymentAmount
  ],
  "nullifierHash": "0x9e8d7c6b...",
  "generationTime": 8.2  // seconds
}
```

**Errors:**
- `400`: Invalid input parameters
- `500`: Proof generation failed

---

#### GET `/privacy/merkle-proof/:index`

Get Merkle proof for commitment at index.

**Path Parameters:**
- `index`: Commitment index (0-1023)

**Response:**
```json
{
  "root": "0x5a8b9c2d...",
  "leaf": "0x9d4e3f2a...",
  "pathElements": [
    "0x1a2b3c4d...",
    "0x5e6f7a8b...",
    "0x9c0d1e2f...",
    ...  // 10 elements (tree depth)
  ],
  "pathIndices": [0, 1, 0, 1, 0, 0, 1, 1, 0, 0]
}
```

**Errors:**
- `404`: Index not found
- `400`: Invalid index

---

#### GET `/privacy/score`

Get current privacy score and recommendations.

**Query Parameters:**
- `walletAddress` (optional): Calculate score for specific wallet

**Response:**
```json
{
  "anonymitySetSize": 347,
  "anonymityScore": 95,
  "amountScore": 87,
  "timingScore": 91,
  "overallScore": 92,
  "rating": "EXCELLENT",
  "recommendations": [
    "Anonymity set is large (optimal)",
    "Your amounts are common (good mixing)",
    "Consider waiting 2 minutes before next payment"
  ]
}
```

---

#### GET `/privacy/analytics`

Get privacy-preserving analytics for services.

**Query Parameters:**
- `serviceAddress`: Service to get analytics for
- `timeRange`: `24h` | `7d` | `30d` (default: `24h`)

**Response:**
```json
{
  "totalPayments": 423,
  "averageAmount": "0.0150000",
  "medianAmount": "0.0100000",
  "peakHours": [9, 10, 11, 14, 15, 16],
  "paymentDistribution": {
    "micro": 70,    // 0.001-0.01 USDC
    "small": 20,    // 0.01-0.1 USDC
    "medium": 10    // 0.1-1.0 USDC
  },
  "privacyPreserved": true,
  "differentialPrivacyEpsilon": 0.1
}
```

**Note:** Uses differential privacy to protect individual users

---

### x402 Integration Endpoints

#### POST `/x402/pay-private`

Pay x402 service using privacy pool.

**Request:**
```json
{
  "serviceUrl": "https://search-api.example.com",
  "paymentAmount": "0.0100000",
  "proof": "0x1a2b3c4d...",
  "nullifier": "0x9e8d7c6b...",
  "servicePayload": {
    "query": "stellar news"
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "abc123...",
  "serviceResponse": {
    "results": [...]
  },
  "privacyScore": 92
}
```

**Flow:**
1. Backend generates proof
2. Backend queues payment to privacy pool
3. Backend calls x402 service with proof
4. Service verifies with privacy pool
5. Service returns data

---

## Agent SDK

### Installation

```bash
npm install @link2pay/zk-bridge-sdk
```

### Usage

```typescript
import { PrivateX402Client } from '@link2pay/zk-bridge-sdk';

const client = new PrivateX402Client({
  privacyPoolContract: 'CPRIVACY123...',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
});
```

---

### `deposit()`

Deposit USDC anonymously into privacy pool.

```typescript
async deposit(params: {
  walletSecret: string;
  amount: string;
}): Promise<DepositReceipt>
```

**Parameters:**
- `walletSecret`: Stellar secret key (S...)
- `amount`: Amount in USDC (e.g., "10.0")

**Returns:**
```typescript
interface DepositReceipt {
  transactionHash: string;
  commitment: string;
  index: number;
  credentials: {
    amount: string;
    secret: string;
    nullifiers: string[];  // Pre-generated for future payments
  };
}
```

**Example:**
```typescript
const receipt = await client.deposit({
  walletSecret: 'SXXXXXX...',
  amount: '10.0',
});

// Save credentials securely
saveCredentials(receipt.credentials);

console.log(`Deposited at index ${receipt.index}`);
console.log(`Commitment: ${receipt.commitment}`);
```

---

### `payService()`

Pay x402 service anonymously.

```typescript
async payService(params: {
  serviceUrl: string;
  amount: string;
  credentials: PrivacyCredentials;
  payload?: any;
}): Promise<ServiceResponse>
```

**Parameters:**
- `serviceUrl`: x402 service endpoint
- `amount`: Payment amount
- `credentials`: Saved from deposit
- `payload`: Service-specific data

**Returns:**
```typescript
interface ServiceResponse {
  success: boolean;
  transactionHash: string;
  data: any;  // Service response data
  privacyScore: PrivacyScore;
}
```

**Example:**
```typescript
const credentials = loadCredentials();

const response = await client.payService({
  serviceUrl: 'https://search-api.example.com',
  amount: '0.01',
  credentials,
  payload: {
    query: 'stellar defi',
  },
});

console.log('Results:', response.data);
console.log('Privacy score:', response.privacyScore.overallScore);
```

---

### `getPrivacyScore()`

Get current privacy score.

```typescript
async getPrivacyScore(): Promise<PrivacyScore>
```

**Returns:**
```typescript
interface PrivacyScore {
  anonymitySetSize: number;
  anonymityScore: number;
  amountScore: number;
  timingScore: number;
  overallScore: number;
  rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
  recommendations: string[];
}
```

**Example:**
```typescript
const score = await client.getPrivacyScore();

console.log(`Privacy: ${score.rating} (${score.overallScore}/100)`);
console.log(`Anonymity set: ${score.anonymitySetSize} users`);

for (const rec of score.recommendations) {
  console.log(`💡 ${rec}`);
}
```

---

### `getBalance()`

Get anonymous balance (sum of unused deposits).

```typescript
async getBalance(
  credentials: PrivacyCredentials
): Promise<string>
```

**Parameters:**
- `credentials`: Saved from deposit

**Returns:** Available balance as string (e.g., "9.82")

**Example:**
```typescript
const balance = await client.getBalance(credentials);
console.log(`Private balance: ${balance} USDC`);
```

---

### `setPrivacyPolicy()`

Configure privacy preferences.

```typescript
setPrivacyPolicy(policy: PrivacyPolicy): void
```

**Parameters:**
```typescript
interface PrivacyPolicy {
  minAnonymitySet: number;      // Min users before paying
  maxBatchDelay: number;        // Max wait time (seconds)
  amountRounding: boolean;      // Round to common amounts
  timingRandomization: boolean; // Add random delays
}
```

**Example:**
```typescript
// High privacy, can wait
client.setPrivacyPolicy({
  minAnonymitySet: 100,
  maxBatchDelay: 300,  // 5 min
  amountRounding: true,
  timingRandomization: true,
});

// Low latency, less privacy
client.setPrivacyPolicy({
  minAnonymitySet: 10,
  maxBatchDelay: 30,  // 30 sec
  amountRounding: false,
  timingRandomization: false,
});
```

---

## Circuit Interface

### Input Format

**x402_payment.circom**

```json
{
  "amount": "10000000",          // Stroops (10.0 USDC)
  "secret": "12345678...",       // 32-byte hex string
  "nullifier": "87654321...",    // 32-byte hex string
  "pathElements": [              // Merkle proof siblings
    "1a2b3c4d...",
    "5e6f7a8b...",
    ...  // 10 elements
  ],
  "pathIndices": [0, 1, 0, ...], // 0=left, 1=right
  "serviceAddress": "GSERVICE...",
  "paymentAmount": "100000",     // Stroops (0.01 USDC)
  "merkleRoot": "5a8b9c2d..."
}
```

### Output Format

```json
{
  "proof": {
    "pi_a": ["x", "y", "1"],
    "pi_b": [["x1", "x0"], ["y1", "y0"], ["1", "0"]],
    "pi_c": ["x", "y", "1"],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": [
    "nullifierHash",    // Poseidon(nullifier)
    "serviceAddress",
    "paymentAmount"
  ]
}
```

---

## Data Types

### Core Types

```typescript
// Privacy Credentials (stored locally by agent)
interface PrivacyCredentials {
  amount: string;
  secret: string;          // 32-byte hex
  nullifiers: string[];    // Array of unused nullifiers
  depositIndex: number;
}

// Merkle Proof
interface MerkleProof {
  root: string;
  leaf: string;
  pathElements: string[];  // Length = tree depth
  pathIndices: number[];   // 0 = left, 1 = right
}

// Privacy Score
interface PrivacyScore {
  anonymitySetSize: number;
  anonymityScore: number;    // 0-100
  amountScore: number;       // 0-100
  timingScore: number;       // 0-100
  overallScore: number;      // 0-100
  rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
  recommendations: string[];
}

// Proof Data
interface ProofData {
  proof: string;             // 256 bytes hex-encoded
  publicSignals: string[];
  nullifierHash: string;
  generationTime?: number;   // seconds
}
```

---

## Error Handling

### Contract Errors

```rust
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidCommitment = 5,
    InvalidProof = 6,
    InvalidMerkleRoot = 7,
    NullifierSpent = 8,
    InvalidIndex = 9,
    InsufficientBalance = 10,
    TransferFailed = 11,
    NoPendingPayments = 12,
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Missing auth headers |
| 402 | Payment Required | x402 payment needed |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Error | Server error |
| 503 | Service Unavailable | Contract unreachable |

### Error Response Format

```json
{
  "error": "NullifierSpent",
  "message": "This nullifier has already been used",
  "code": 8,
  "details": {
    "nullifier": "0x9e8d7c6b...",
    "spentAt": "2026-03-28T10:30:00Z"
  }
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/privacy/generate-proof` | 10 req | 5 min |
| `/privacy/merkle-proof/:id` | 100 req | 1 min |
| `/privacy/score` | 30 req | 1 min |
| `/x402/pay-private` | 20 req | 5 min |

**Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1711624800
```

---

## Examples

### Complete Deposit → Pay Flow

```typescript
import { PrivateX402Client } from '@link2pay/zk-bridge-sdk';

async function main() {
  const client = new PrivateX402Client({
    privacyPoolContract: 'CPRIVACY123...',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
  });

  // 1. Deposit
  console.log('Depositing 10 USDC...');
  const receipt = await client.deposit({
    walletSecret: process.env.AGENT_SECRET!,
    amount: '10.0',
  });
  console.log(`✅ Deposited at index ${receipt.index}`);

  // 2. Save credentials
  fs.writeFileSync(
    'credentials.json',
    JSON.stringify(receipt.credentials, null, 2)
  );

  // 3. Wait for anonymity set to grow
  await waitForAnonymitySet(50);

  // 4. Pay service
  console.log('Paying SearchAPI...');
  const response = await client.payService({
    serviceUrl: 'https://search-api.example.com',
    amount: '0.01',
    credentials: receipt.credentials,
    payload: { query: 'stellar news' },
  });

  console.log(`✅ Payment successful: ${response.transactionHash}`);
  console.log(`Privacy score: ${response.privacyScore.overallScore}/100`);
  console.log(`Results:`, response.data);
}

main().catch(console.error);
```

---

## Appendix

### Proof Serialization Format

**Groth16 Proof Structure:**
```
Bytes 0-63:    pi_a (G1 point, 64 bytes)
Bytes 64-191:  pi_b (G2 point, 128 bytes, imaginary-first)
Bytes 192-255: pi_c (G1 point, 64 bytes)
Total: 256 bytes
```

**G1 Point (64 bytes):**
```
Bytes 0-31:  X coordinate (little-endian)
Bytes 32-63: Y coordinate (little-endian)
```

**G2 Point (128 bytes, imaginary-first):**
```
Bytes 0-31:   X1 (imaginary part, little-endian)
Bytes 32-63:  X0 (real part, little-endian)
Bytes 64-95:  Y1 (imaginary part, little-endian)
Bytes 96-127: Y0 (real part, little-endian)
```

### Poseidon Hash Parameters

- **Curve:** BN254
- **Field:** Fr (scalar field)
- **Inputs:** 1-16 (variable)
- **Security:** 128-bit
- **Implementation:** circomlib

**Constants:**
- t=2: Two inputs (binary tree hash)
- t=3: Three inputs (commitment)
- t=4: Four inputs (extended commitment)

---

## Support

For API questions or issues:
- Documentation: [docs.link2pay.app](https://docs.link2pay.app)
- GitHub Issues: [github.com/Link2Pay/link2pay-app/issues](https://github.com/Link2Pay/link2pay-app/issues)
- Discord: [discord.gg/link2pay](https://discord.gg/link2pay)
- Email: dev@link2pay.app
