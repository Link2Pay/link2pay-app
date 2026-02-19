# Security Reference — Stellar / Web3 Applications

Based on SDF Security Best Practices, STRIDE Threat Modeling, and Stellar/Soroban audit requirements.
This is a **general reference document** — apply it to any Stellar-based or Web3-adjacent project.

---

## Table of Contents

1. [STRIDE Threat Modeling Framework](#1-stride-threat-modeling-framework)
2. [Web Application Security Checklist](#2-web-application-security-checklist)
3. [Stellar-Specific Security Practices](#3-stellar-specific-security-practices)
4. [Soroban Smart Contract Security](#4-soroban-smart-contract-security)
5. [Audit Readiness — SDF Audit Bank](#5-audit-readiness--sdf-audit-bank)
6. [Dependency & Supply Chain](#6-dependency--supply-chain)
7. [Monitoring & Incident Response](#7-monitoring--incident-response)
8. [SDF Self-Assessment Checklist](#8-sdf-self-assessment-checklist)

---

## 1. STRIDE Threat Modeling Framework

STRIDE is a structured method for identifying security threats. Apply it at the start of every feature and revisit it whenever the architecture changes.

### How to run a STRIDE session

1. **Draw the data flow diagram** — map every component, every trust boundary, and every data store.
2. **Enumerate threats** using the six categories below.
3. **Assign a remediation** to each identified threat.
4. **Track status** — keep the threat table as a living document.

### The six STRIDE categories

| Category | Definition | Example in a Stellar app |
|---|---|---|
| **Spoofing** | Claiming to be something you are not | Attacker sends requests with a forged `x-wallet-address` header |
| **Tampering** | Modifying data in transit or at rest | Attacker changes an invoice amount in the request body |
| **Repudiation** | Denying an action was performed | Payer claims they never initiated a transaction |
| **Information Disclosure** | Exposing data to unauthorized parties | API leaking a wallet address on a public endpoint |
| **Denial of Service** | Preventing legitimate use | Flooding an expensive Horizon-calling endpoint |
| **Elevation of Privilege** | Gaining capabilities beyond authorization | Accessing another user's private invoices via IDOR |

### Threat table template

```
| Threat Category | Threat ID | Description | Remediation | Status |
|---|---|---|---|---|
| Spoofing        | Spoof.1   | ...         | ...         | ❌/⚠️/✅ |
```

### Trust boundaries to always define

- Browser → Backend API
- Backend API → Blockchain node / Horizon
- Backend API → Database
- External services (price feeds, CDNs) → Backend

---

## 2. Web Application Security Checklist

### 2.1 Transport & Headers

- [ ] **TLS/HTTPS everywhere** — no HTTP in production; enforce via hosting config (Render, Vercel, Cloudflare).
- [ ] **HTTP Strict-Transport-Security (HSTS)** — `max-age=31536000; includeSubDomains; preload`.
- [ ] **Content-Security-Policy (CSP)** — configure explicitly; never rely on framework defaults.
  ```
  default-src 'none';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' <trusted-api-origins>;
  font-src 'self';
  object-src 'none';
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  upgrade-insecure-requests
  ```
- [ ] **Helmet.js** (Node.js) — sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] **CORS** — restrict `origin` to known frontend domains; never use wildcard `*` on authenticated routes.
- [ ] **Referrer-Policy** — `strict-origin-when-cross-origin` to avoid leaking paths.
- [ ] **Permissions-Policy** — disable unused browser features: `camera=(), microphone=(), geolocation=(), payment=()`.

### 2.2 Authentication & Authorization

- [ ] **No server-side private keys** — for Stellar apps, auth is proven via client-side wallet signatures (Freighter, Albedo, xBull). The server only holds public keys and verifies signatures.
- [ ] **Nonce-based challenge-response** — server issues a random nonce; client signs `"<app-name>-auth:<wallet>:<nonce>"` with their ed25519 key; server verifies and consumes the nonce.
- [ ] **Nonces are single-use** — consumed immediately on verification, not reusable.
- [ ] **Nonce TTL** — expire after a short window (5 minutes). Store in memory or Redis; clean up on interval.
- [ ] **No address-only fallback** — never accept a wallet address header alone as authentication. Always require signature proof.
- [ ] **Authorization on every route** — every owner-scoped route must filter by the authenticated wallet, never by a request parameter.
- [ ] **IDOR prevention** — enforce ownership at the query level (e.g., `WHERE freelancerWallet = $authWallet`), not in application logic after fetching.
- [ ] **Token/auth expiry** — frontend auth cache should expire and refresh automatically before TTL.

### 2.3 Input Validation

- [ ] **Schema validation** — validate all request bodies with a schema library (Zod, Joi, Yup) before touching business logic.
- [ ] **No raw SQL** — use parameterized queries or an ORM (Prisma, Drizzle). No string interpolation in queries.
- [ ] **Server-side computation** — never trust amounts, totals, or financially meaningful values from the client. Always compute from the database.
- [ ] **String length limits** — apply `max()` constraints on every free-text field.
- [ ] **Array size limits** — cap the number of items in arrays (e.g., line items, batch operations).
- [ ] **Enum validation** — restrict string fields to known allowed values.
- [ ] **Env var validation** — validate all environment variables at startup with a schema; fail fast on misconfiguration.

### 2.4 Rate Limiting

- [ ] **General API limiter** — apply to all `/api/` routes (e.g., 100 req / 15 min per IP).
- [ ] **Sensitive endpoint limiter** — stricter limits on expensive or security-critical endpoints (auth, payment initiation).
- [ ] **Per-resource limiter** — limit creation operations per authenticated identity, not just per IP (e.g., 20 invoices/hr per wallet).
- [ ] **Price feed / external API limiter** — prevent clients from forcing repeated expensive external calls.
- [ ] **WAF / DDoS layer** — configure Cloudflare or equivalent in production for volumetric attack protection.

### 2.5 Error Handling & Information Disclosure

- [ ] **Generic error messages in production** — `NODE_ENV=production` must suppress stack traces and internal details.
- [ ] **Structured error responses** — always return `{ error: "..." }` with no internal schema hints.
- [ ] **Non-sequential IDs** — use CUID, UUID v4, or similar non-guessable identifiers. Never auto-increment integers as public-facing IDs.
- [ ] **Field-level access control** — define separate response types for public vs. owner vs. admin views. Never return more fields than required.
- [ ] **Logs vs. responses** — detailed error context goes to logs (server-side), never into HTTP responses.

### 2.6 Data & Privacy

- [ ] **Soft delete** — use `deletedAt` timestamps to preserve audit trails; never hard-delete financially relevant records.
- [ ] **Audit log** — record every state-changing action with: actor identity, timestamp, previous state, new state.
- [ ] **PII minimization** — only collect and store the personal data you actively use. Evaluate every field.
- [ ] **DB encryption at rest** — verify your hosting provider enables encryption at rest for PostgreSQL / databases.
- [ ] **Secrets management** — no secrets in code or version control. Use environment variables, Vault, or hosted secrets managers.

---

## 3. Stellar-Specific Security Practices

### 3.1 Transaction Construction

- [ ] **Server builds XDR, client only signs** — the backend constructs the transaction (amounts, destination, memo). The client wallet signs the pre-built XDR. Never trust a client-supplied XDR amount.
- [ ] **Set transaction timeouts** — every transaction must have a `timeBounds` or `setTimeout(seconds)`. Use short windows (300 seconds / 5 minutes) for payment flows.
- [ ] **Verify on-chain independently** — after a transaction is submitted, confirm its details via Horizon (`/transactions/:hash/operations`) before marking state as settled. Do not trust the client's claim.
- [ ] **Memo binding** — include a unique identifier (invoice number, order ID) in the memo field and verify it in the confirmation step to prevent replay across different invoices.
- [ ] **Minimum balance awareness** — accounts need a minimum XLM balance (base reserve + per-entry reserve). Build UI guidance for users who lack reserves.
- [ ] **Asset trust lines** — for non-XLM assets (USDC, EURC), the recipient account must have an established trust line. Verify before constructing a payment transaction.

### 3.2 Horizon Interaction

- [ ] **Use streaming with care** — `EventSource` streams from Horizon can reconnect silently. Log reconnection events; alert if the watcher stops processing for too long.
- [ ] **Handle `Invoice already paid` idempotently** — the watcher and a submit endpoint may race to mark the same invoice as paid. Use database-level serializable transactions and treat "already paid" as a non-error path.
- [ ] **Testnet vs. Mainnet segregation** — ensure `network_passphrase` is validated from config, never derived from client input. Use environment variables to enforce the network.
- [ ] **Horizon rate limits** — Horizon testnet has strict rate limits. Production apps should use a dedicated Horizon instance or an SDF-operated mainnet endpoint.

### 3.3 Wallet Integration (Freighter / Passkey Kit)

- [ ] **Never request or store the seed phrase or private key** — wallet APIs expose only signing capabilities.
- [ ] **Verify `isConnected()` before every signing operation** — Freighter can disconnect between page loads.
- [ ] **Handle API version differences** — Freighter's API changed between v2 and v5 (`getPublicKey` → `getAddress`, `signTransaction` return type changed). Write adapters with graceful fallbacks.
- [ ] **`signMessage` vs `signTransaction`** — use `signMessage` for auth nonces (arbitrary bytes); use `signTransaction` for XDR transactions. Do not misuse one for the other.
- [ ] **Display what the user is signing** — show the full transaction summary (amount, asset, destination) before calling `signTransaction`.

---

## 4. Soroban Smart Contract Security

> Apply this section only when writing Soroban (Rust-based) contracts on Stellar.

### 4.1 Before Writing a Contract

- [ ] **Write a threat model first** — define invariants, trust assumptions, and access control rules before touching code.
- [ ] **Define invariants explicitly** — document what can never be violated (e.g., "only the invoice creator can cancel", "amount must equal the stored total").
- [ ] **Test-driven development** — Soroban's local testing framework supports fast Rust unit tests without running a chain. Write tests before implementation.

### 4.2 Storage

| Storage Type | When to Use |
|---|---|
| **Instance Storage** | Small data always needed with the contract (admin address, contract config). Never store unbounded collections here. |
| **Persistent Storage** | Financially meaningful data (balances, invoice state, user records). Survives TTL expiry. |
| **Temporary Storage** | Short-lived data (nonces, oracle prices, session tokens). Cheaper but expires automatically. |

- [ ] **Never store unbounded data in Instance Storage** — lists, maps with unknown size, or any growing collection. Use Persistent Storage with per-key slots instead.
- [ ] **Store expiration ledger sequence** alongside time-bounded data. Do not rely solely on TTL; record the explicit expiry ledger number.
- [ ] **Bump TTLs explicitly** — call `env.storage().instance().extend_ttl()` when needed to prevent critical data from expiring.

### 4.3 Arithmetic & Error Handling

- [ ] **Checked arithmetic** — use `checked_add`, `checked_sub`, `checked_mul` for all financial calculations. Unchecked arithmetic can silently overflow.
- [ ] **`panic_with_error!` not `panic!`** — use the Soroban macro so fuzzers and test harnesses can distinguish expected errors from unexpected panics.
- [ ] **No `.unwrap()` in production code** — every fallible operation must use explicit error handling (`?`, `match`, `ok_or`).
- [ ] **No floating point** — use integer fixed-point arithmetic with defined precision (e.g., `i128` with 7 decimal places, matching Stellar's native precision).

### 4.4 Access Control

- [ ] **`require_auth()` on every state-modifying function** — without this, anyone can call the function.
- [ ] **`require_auth_for_args()`** — use when you need to restrict authorization to specific argument values (e.g., this address can only withdraw their own balance).
- [ ] **Privileged roles in Instance Storage** — store the admin/owner address in Instance Storage so it is always loaded with the contract.
- [ ] **Document trust assumptions** — for each privileged role, document: who holds it, what they can do, and the procedure to rotate it.
- [ ] **Multi-sig or DAO for upgrades** — if the contract is upgradeable, require multi-party authorization for `upgrade()` to prevent a single-key compromise from taking over.

### 4.5 Cross-Contract Dependencies (`contractimport!`)

- [ ] **Add dependencies to `Cargo.toml`** — so `cargo` resolves build order correctly.
- [ ] **Change WASM path after adding a crate dep** — from `release/contract.wasm` → `release/deps/contract.wasm`.
- [ ] **Verify build order** — run `soroban contract build --print-commands-only` before deploying to confirm the dependency graph.
- [ ] **Pin contract addresses** — store the address of imported contracts in Instance Storage; do not hardcode in source. This allows emergency rotation.

### 4.6 Re-entrancy & Reentrancy Guards

- [ ] **Soroban does not have re-entrancy by default** — each contract invocation is atomic and isolated. However, cross-contract calls can introduce ordering issues; reason about each call's side effects.
- [ ] **Check-effects-interactions pattern** — even in Soroban, update state before making external calls.

### 4.7 Oracle & Price Feed Security

- [ ] **Validate oracle freshness** — check the `timestamp` or `ledger_sequence` of any oracle price. Reject stale data older than your acceptable threshold.
- [ ] **Use Temporary Storage for oracle prices** — they are short-lived and should not be treated as persistent truth.
- [ ] **Multiple oracles or circuit breaker** — if your contract depends on a price feed, define a fallback or halt condition if the feed is unavailable or extreme.

---

## 5. Audit Readiness — SDF Audit Bank

The SDF Audit Bank offers free security audits for qualifying Stellar/Soroban projects. These requirements apply regardless of whether you seek an audit.

### 5.1 Prerequisites

- [ ] **Threat model document** — completed and up to date (this document).
- [ ] **Test suite coverage ≥ 80%** — of all contract functions and critical backend endpoints.
- [ ] **All invariants documented** — every assumption about valid state must be written down.
- [ ] **Edge cases documented** — zero amounts, duplicate submissions, concurrent state transitions.

### 5.2 Static Analysis

- [ ] **Scout by CoinFabrik** — run `cargo scout-audit` on all Soroban contracts. Address every finding before submission.
  - Repo: https://github.com/CoinFabrik/scout
- [ ] **`cargo clippy -- -D warnings`** — treat all Clippy warnings as errors before audit.
- [ ] **`cargo audit`** — no known vulnerabilities in Rust dependencies.
- [ ] **`npm audit`** — no high/critical vulnerabilities in JS/TS dependencies.

### 5.3 Prior Audit Review

- [ ] **Review SDF Audit Bank reports** — 40+ open-source audit reports available. Search for contracts similar to yours and review their findings.
- [ ] **Common findings to proactively address:**
  - Missing `require_auth()` calls
  - Unbounded storage growth in Instance Storage
  - Unchecked arithmetic
  - Oracle staleness not validated
  - Admin key with no rotation mechanism
  - Missing re-entrancy guards on cross-contract calls

### 5.4 Audit Submission Checklist

- [ ] README explains the contract's purpose, invariants, and roles.
- [ ] All functions documented with expected inputs, outputs, and error conditions.
- [ ] Deployment scripts and initialization procedure documented.
- [ ] Test suite runs cleanly with `cargo test`.
- [ ] No `TODO`, `FIXME`, or commented-out code in the submitted version.

---

## 6. Dependency & Supply Chain

### 6.1 Runtime Dependencies

- [ ] **Minimize dependencies** — each dependency is an attack surface. Question every new package.
- [ ] **Pin versions** — commit `package-lock.json` / `Cargo.lock`. Never use `*` or `latest` in production manifests.
- [ ] **Regular audits** — run `npm audit` / `cargo audit` on every CI run and before every release.
- [ ] **Automated scanning** — integrate Snyk, Dependabot, or equivalent in CI/CD.
- [ ] **Review dependency licenses** — copyleft licenses (GPL) may have legal implications for commercial products.

### 6.2 Development Dependencies

- [ ] **Separate dev from prod** — dev tools (test runners, linters, type stubs) must not appear in production bundles or Docker images.
- [ ] **Remove deprecated stubs** — deprecated type definition packages (e.g., `@types/winston`) add confusion and sometimes pull in vulnerable transitive dependencies.

### 6.3 Build & CI

- [ ] **Reproducible builds** — use `npm ci` (not `npm install`) in CI to enforce lock file compliance.
- [ ] **No secrets in build artifacts** — verify `.env` files are in `.gitignore`; run `git secret scan` or equivalent.
- [ ] **Signed commits / tags** — for production releases, enforce GPG-signed tags.
- [ ] **Dependency review in PRs** — require human review of lock file changes in pull requests.

---

## 7. Monitoring & Incident Response

### 7.1 Logging

- [ ] **Structured logging** — use JSON-format logs in production (Winston, Pino, structured Rust tracing). Every log entry must include a timestamp.
- [ ] **Log levels** — use `error`, `warn`, `info`, `debug` correctly. Production should default to `info`.
- [ ] **Never log secrets** — scrub private keys, signatures, auth tokens, and PII before logging. Log wallet addresses only when necessary for debugging.
- [ ] **Correlation IDs** — attach a request ID to every log entry in a request's lifecycle for traceability.

### 7.2 Error Tracking

- [ ] **Centralized error tracking** — integrate Sentry, Rollbar, or equivalent. Unhandled exceptions must be captured and alerted.
- [ ] **Separate environments** — use separate Sentry projects/DSNs for production, staging, and development.
- [ ] **PII scrubbing in Sentry** — configure `beforeSend` to strip wallet addresses, emails, and other PII from error reports.

### 7.3 Alerting

- [ ] **Background service health** — any watcher / queue worker / cron job must alert (PagerDuty, webhook, email) if it stops processing for longer than a defined threshold.
- [ ] **Spike alerts** — alert on abnormal request volume, error rate spikes, or latency increases.
- [ ] **Payment anomalies** — alert if a transaction is confirmed on-chain but fails to update internal state.

### 7.4 Incident Response

- [ ] **Runbook per critical failure mode** — documented steps for: DB unreachable, Horizon unreachable, watcher crashed, suspected exploit.
- [ ] **Contact list** — who to call for infrastructure (hosting provider), blockchain (SDF support), and legal.
- [ ] **Key rotation procedure** — documented steps for rotating: DB credentials, API keys, admin wallet, contract admin role.
- [ ] **Post-mortem process** — after every incident, write a blameless post-mortem with root cause and preventative measures.

### 7.5 Uptime

- [ ] **Health check endpoint** — expose `GET /api/health` returning uptime, version, network, and dependency status.
- [ ] **External uptime monitoring** — configure Render health checks, UptimeRobot, or equivalent.
- [ ] **Graceful shutdown** — handle `SIGTERM` / `SIGINT`: stop accepting new requests, finish in-flight requests, close DB connections and background services cleanly.

---

## 8. SDF Self-Assessment Checklist

Use these questions at the end of every threat modeling session or sprint:

| Question | Expected Answer |
|---|---|
| Has the data flow diagram been drawn and kept up to date? | Yes — revisited with every architectural change |
| Has STRIDE been applied to every trust boundary crossing? | Yes — threats enumerated for each boundary |
| Does every identified threat have a remediation and an owner? | Yes — no threat is left without a treatment decision |
| Did the threat model uncover issues not previously tracked? | Document any new findings immediately |
| Are all critical and high threats fully remediated before launch? | Yes — no known critical/high items open at release |
| Is there an audit trail for every financially meaningful operation? | Yes — log actor, action, timestamp, and state delta |
| Can every action be attributed to a specific authenticated identity? | Yes — no anonymous state-modifying operations |
| Have dependencies been scanned for known vulnerabilities? | Yes — `npm audit` / `cargo audit` clean |
| Is there a tested incident response plan? | Yes — runbooks written and reviewed |
| Has the contract / backend been reviewed by at least one other person? | Yes — code review required before merge to main |

---

## Quick Reference — Severity Definitions

| Level | Definition | Required Action |
|---|---|---|
| 🔴 **Critical** | Exploitable without authentication; allows fund theft, account takeover, or data breach | Fix before any deployment |
| 🟠 **High** | Exploitable with low effort or basic auth; significant impact | Fix before production launch |
| 🟡 **Medium** | Requires specific conditions; limited blast radius | Fix within one sprint |
| 🟢 **Low** | Defense in depth; minimal direct risk | Fix when convenient |
| ⚪ **Info** | No direct impact; hygiene or best practice | Address at discretion |

---

*This document is based on SDF Security Best Practices, STRIDE Threat Modeling (Microsoft), and Stellar/Soroban audit requirements from the SDF Audit Bank. Review and update whenever the architecture, dependencies, or threat landscape changes.*
