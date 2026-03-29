# Link2Pay ZK-Bridge: Demo Agents

This directory contains 3 demo agents showcasing how autonomous agents can use **Link2Pay ZK-Bridge** to make private x402 payments.

## 🎯 Why Privacy Matters for Agents

Traditional x402 payments are public on-chain:
- ❌ Competitors see which APIs you use
- ❌ Query patterns reveal strategies
- ❌ Payment timing enables front-running
- ❌ Service correlation exposes workflows

**Link2Pay ZK-Bridge solves this** with a universal privacy pool:
- ✅ Single pool for ALL x402 services
- ✅ Hides which services agent uses
- ✅ Payment amounts hidden via ZK proofs
- ✅ Maximum anonymity set

---

## 🤖 Demo Agents

### 1. Trading Bot (`trading-bot/`)
**Use case**: Cryptocurrency trading bot

**Problem**: Needs real-time price data, market depth, liquidity info
- Without privacy: Competitors see which APIs → front-run trades
- Observing payment patterns = stealing trading strategy

**With ZK-Bridge**:
- All payments go through universal pool
- Impossible to determine which APIs bot uses
- Trading edge protected

**Run**:
```bash
cd trading-bot
node agent.mjs ../privacy-credentials.json
```

---

### 2. Research Agent (`research-agent/`)
**Use case**: Academic/patent research agent

**Problem**: Queries papers, citations, patents across databases
- Without privacy: Query patterns reveal research direction
- Competitors can anticipate your innovations

**With ZK-Bridge**:
- Research workflow completely hidden
- Multiple database queries aggregated in pool
- Intellectual property protected

**Run**:
```bash
cd research-agent
node agent.mjs ../privacy-credentials.json
```

---

### 3. AI Analyst (`ai-analyst/`)
**Use case**: Multi-AI service pipeline

**Problem**: Uses 4+ ML services (sentiment, entities, trends, anomalies)
- Without privacy: Competitors see exact workflow
- Analysis pipeline = proprietary IP

**With ZK-Bridge**:
- AI pipeline completely obfuscated
- All service payments pooled together
- Workflow remains trade secret

**Run**:
```bash
cd ai-analyst
node agent.mjs ../privacy-credentials.json
```

---

## 🚀 How to Run Demos

### Prerequisites
1. Create a private invoice on Link2Pay
2. Enable "Private Payment" toggle
3. Download privacy credentials JSON

### Running All Agents
```bash
# Trading Bot
node trading-bot/agent.mjs ./privacy-credentials.json

# Research Agent
node research-agent/agent.mjs ./privacy-credentials.json

# AI Analyst
node ai-analyst/agent.mjs ./privacy-credentials.json
```

---

## 🎬 Demo Flow

Each agent demonstrates:

1. **Initialization** with privacy credentials
2. **Multi-service queries** (3-4 different x402 APIs)
3. **Private payments** via universal pool
4. **Complete workflow** with analysis results
5. **Privacy benefits** clearly explained

---

## 💡 Key Differentiators Showcased

### 1. Universal Privacy Pool
- ✅ Single pool for ALL services (vs per-service pools)
- ✅ Hides which service agent uses
- ✅ Maximum anonymity set

### 2. Multi-Service Aggregation
- ✅ Trading bot: 3 different price APIs
- ✅ Research agent: 3 different databases
- ✅ AI analyst: 4 different ML services

### 3. Real-World Use Cases
- ✅ Trading: Front-running protection
- ✅ Research: IP protection
- ✅ AI: Workflow confidentiality

---

## 📊 Privacy Comparison

| Aspect | Traditional x402 | Per-Service Pools | **ZK-Bridge (Ours)** |
|--------|------------------|-------------------|----------------------|
| Service visibility | ❌ Public | ⚠️ Service-level | ✅ Hidden |
| Payment amounts | ❌ Public | ⚠️ Hidden | ✅ Hidden |
| Timing patterns | ❌ Public | ⚠️ Per-service | ✅ Batched |
| Anonymity set | ❌ None | ⚠️ Per-service | ✅ Universal |
| Multi-service use | ❌ Exposed | ⚠️ Partially hidden | ✅ Fully hidden |

---

## 🔧 Production Integration

In production, agents would:

1. **Load credentials** from secure storage
2. **Generate ZK proofs** using snarkjs
3. **Submit proofs** to Soroban contract
4. **Contract verifies** and pays service
5. **Service responds** via x402 protocol

These demos use mock services to show the privacy flow without requiring live x402 endpoints.

---

## 🎓 Educational Value

Each demo teaches:
- How privacy pools work
- Why universal pooling > per-service pooling
- Real-world agent privacy needs
- Zero-knowledge proof concepts
- x402 payment protocol integration

---

## 📝 License

MIT - See root LICENSE file
