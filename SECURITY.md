# Security Reference — Link2Pay

Based on SDF Security Best Practices, STRIDE Threat Modeling, and Stellar/Soroban audit requirements.
This document is a **living reference** — update it whenever the architecture changes.

---

## 1. STRIDE Threat Model

### What are we working on?

**Link2Pay** is a Stellar-based invoicing platform. A freelancer creates an invoice, shares a payment link, and the client pays using their Freighter wallet. Payments are settled natively on the Stellar network (XLM, USDC, EURC).

**Data flow:**

```
[Client Browser] ──HTTPS──► [Vercel Frontend]
                                    │
                              REST API calls
                                    │
                             [Render Backend]  ──► [Stellar Horizon (testnet/mainnet)]
                                    │
                             [PostgreSQL DB]
                                    │
                             [Watcher Service]  ──► [Stellar Horizon (stream)]
```

**Trust boundaries:**
- All HTTP requests from the browser cross a trust boundary into the backend
- The backend trusts Horizon (Stellar) responses but verifies transaction details independently
- The watcher service runs inside the backend trust boundary
- The database is within the backend trust boundary

---

### What can go wrong? (STRIDE)

| Threat | ID | Issue |
|---|---|---|
| **Spoofing** | Spoof.1 | Attacker sends requests with any `x-wallet-address` header, impersonating another user |
| **Spoofing** | Spoof.2 | Attacker replays a valid signed nonce before it expires |
| **Spoofing** | Spoof.3 | Frontend build served from a compromised CDN injects malicious JS |
| **Tampering** | Tamper.1 | Attacker modifies invoice `total` in the pay-intent request body |
| **Tampering** | Tamper.2 | Attacker submits a signed XDR with a different amount than quoted |
| **Tampering** | Tamper.3 | Attacker replays an old signed XDR for a different invoice |
| **Repudiation** | Repud.1 | Payer claims they never initiated a payment |
| **Repudiation** | Repud.2 | Invoice creator claims they never sent an invoice |
| **Information Disclosure** | Info.1 | Public invoice endpoint leaks freelancer wallet address |
| **Information Disclosure** | Info.2 | Error messages expose internal stack traces or DB structure |
| **Information Disclosure** | Info.3 | Sequential or guessable invoice IDs allow enumeration |
| **Information Disclosure** | Info.4 | API returns more fields than the client needs |
| **Denial of Service** | DoS.1 | Attacker floods pay-intent endpoint (expensive Horizon calls) |
| **Denial of Service** | DoS.2 | Attacker creates unlimited invoices to fill the database |
| **Denial of Service** | DoS.3 | Watcher fails silently and stops confirming payments |
| **Elevation of Privilege** | EoP.1 | Attacker accesses another user's private invoices via IDOR |
| **Elevation of Privilege** | EoP.2 | Nonce auth fallback allows address-only access indefinitely |

---

### What are we going to do about it?

| ID | Remediation | Status |
|---|---|---|
| Spoof.1 | **Implemented** — nonce + ed25519 signature verification in `authService.ts`. Legacy address-only fallback removed. | ✅ Done |
| Spoof.2 | **Implemented** — nonces are single-use (consumed on verify) with 5-min TTL in `authService.ts` | ✅ Done |
| Spoof.3 | **Implemented** — `Content-Security-Policy` configured via Helmet (`backend/src/index.ts`) and Vercel headers (`frontend/vercel.json`). | ✅ Done |
| Tamper.1 | **Implemented** — `invoice.total` is read from DB, never from request body. Amount is computed server-side. | ✅ Done |
| Tamper.2 | **Implemented** — backend builds the XDR; client only signs. Amount is embedded in the XDR by the server. | ✅ Done |
| Tamper.3 | XDR has a 5-minute timeout (`setTimeout(300)`). Invoice number is in the memo, verified on confirm. | ✅ Done |
| Repud.1 | **Implemented** — `InvoiceAuditLog` records PAID action with `actorWallet` and `transactionHash`. On-chain proof via Horizon. | ✅ Done |
| Repud.2 | **Implemented** — `InvoiceAuditLog` records CREATED/SENT with `actorWallet`. | ✅ Done |
| Info.1 | Public invoice endpoint (`GET /invoices/:id`) must NOT return `freelancerWallet`. Use `InvoicePublicView` type. | ✅ Done |
| Info.2 | `NODE_ENV=production` suppresses stack traces. Errors return generic messages. | ✅ Done |
| Info.3 | **Implemented** — IDs are CUID (non-sequential, non-guessable). Invoice numbers are random alphanumeric. | ✅ Done |
| Info.4 | Each endpoint returns only the fields needed for its use case (public view vs owner view). | ⚠️ Audit needed |
| DoS.1 | **Implemented** — `payIntentLimiter`: 10 req / 5 min per IP. Add Cloudflare WAF in production. | ⚠️ No WAF yet |
| DoS.2 | **Implemented** — `createInvoiceLimiter`: 20 invoices/hr per wallet in `invoices.ts`. | ✅ Done |
| DoS.3 | **Implemented** — watcher logs errors via Winston, catches `Invoice already paid` gracefully. Add alerting. | ⚠️ No alerting |
| EoP.1 | **Implemented** — all owner routes filter by `freelancerWallet` from auth header, not from request params. | ✅ Done |
| EoP.2 | **Implemented** — Legacy address-only fallback removed from `requireWallet`. All requests now require nonce + signature. | ✅ Done |

---

## 2. Web Security Checklist

### Transport & Headers

- [x] **TLS/HTTPS** — enforced by Render (backend) and Vercel (frontend). No HTTP in production.
- [x] **Helmet.js** — sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, etc.
- [x] **Content-Security-Policy** — Configured via Helmet in `backend/src/index.ts` and Vercel headers in `frontend/vercel.json`.
- [x] **HTTP Strict-Transport-Security (HSTS)** — `max-age=31536000; includeSubDomains; preload` set via Helmet and Vercel headers.
- [x] **CORS** — restricted to known frontend origins only. No wildcard `*`.

### Authentication & Authorization

- [x] **Crypto auth** — nonce issued by server, signed with Freighter ed25519 key, verified server-side.
- [x] **Nonces are single-use** — consumed on first verify, 5-minute TTL, cleaned up on interval.
- [x] **No secrets stored** — no private keys on the server. Only public key verification.
- [x] **Remove legacy address-only fallback** — `requireWallet` now requires all three headers (`x-wallet-address`, `x-auth-nonce`, `x-auth-signature`). Address-only fallback removed.
- [ ] **Token expiry on frontend** — auth cache in `auth.ts` has 5-min expiry. Ensure it refreshes correctly on 401.

### Input Validation

- [x] **Zod schemas** — all request bodies validated with Zod in `validation.ts`.
- [x] **Prisma ORM** — no raw SQL. All queries use parameterized Prisma methods.
- [x] **Amount computed server-side** — `invoice.total` from DB, never trusted from client.
- [x] **Env vars validated** — Zod schema at startup; server exits on misconfiguration.
- [x] **Invoice item count limit** — capped at 50 items for creation and draft edits.
- [ ] **String length limits** — ensure every new request field has an explicit schema limit.

### Rate Limiting

- [x] **General limiter** — 100 req / 15 min per IP on all `/api/` routes.
- [x] **Pay-intent limiter** — 10 req / 5 min per IP.
- [x] **Price feed limiter** — 30 req / 60 s per IP.
- [x] **Per-wallet invoice creation limit** — `createInvoiceLimiter`: 20 invoices/hr per wallet on `POST /api/invoices`.
- [ ] **Cloudflare / WAF** — not configured. Required for production DDoS protection.

### Data & Privacy

- [x] **Soft delete** — `deletedAt` timestamp; data preserved for audit trail.
- [x] **Audit trail** — `InvoiceAuditLog` table records all state transitions with actor wallet.
- [x] **Non-sequential IDs** — CUID for DB IDs, random alphanumeric for invoice numbers.
- [x] **Public vs owner views** — separate TypeScript types enforce field-level access control.
- [ ] **PII minimization** — `clientEmail`, `clientAddress` stored but never used in any downstream flow. Evaluate if necessary.
- [ ] **DB encryption at rest** — depends on Render's PostgreSQL configuration. Verify it is enabled.

### Dependency & Supply Chain

- [x] **`npm audit`** — 0 vulnerabilities. Upgraded `vitest` to v4 to resolve 4 moderate `esbuild` CVEs (dev-only).
- [x] **`@types/winston`** — deprecated stub removed from `devDependencies`.
- [ ] **Dependency scanning** — integrate Snyk or `npm audit` in CI pipeline.
- [ ] **Lock files committed** — `package-lock.json` committed for both backend and frontend. ✅

### Monitoring & Incident Response

- [x] **Structured logging** — Winston with JSON format in production, timestamps on all log entries.
- [x] **Graceful shutdown** — SIGTERM/SIGINT handlers stop watcher and close server cleanly.
- [ ] **Error tracking** — no Sentry or equivalent configured. Unhandled errors only logged to stdout.
- [ ] **Watcher health alerting** — watcher failure is logged but not alerted (no PagerDuty, webhook, etc.).
- [ ] **Uptime monitoring** — configure Render health check on `GET /api/health`.

---

## 3. Soroban / Smart Contract Checklist

> Link2Pay currently uses **native Stellar payments only** (no Soroban contracts). If contracts are added in the future, apply the following:

### Before Writing a Contract

- [ ] Define **invariants** explicitly (e.g., "only the payer can initiate payment", "amount must equal invoice total").
- [ ] Write a **threat model** for the contract before coding.
- [ ] Use **test-driven development** — Soroban's local testing mode supports fast Rust unit tests without running a chain.

### Storage

- [ ] Never store **unbounded data in Instance Storage** (e.g., lists of invoices). Use Persistent Storage with per-key slots instead.
- [ ] Use **Temporary Storage** for nonces, session tokens, and oracle prices (short-lived data).
- [ ] Use **Persistent Storage** for financially meaningful data (balances, invoice state).
- [ ] Always store the **expiration ledger sequence** alongside time-bounded data — do not rely solely on TTL expiry.

### Arithmetic & Error Handling

- [ ] Use `checked_add`, `checked_sub`, `checked_mul` for all arithmetic to prevent overflow/underflow.
- [ ] Use `panic_with_error!` instead of `panic!` to allow fuzzer to distinguish expected errors.
- [ ] Never use `.unwrap()` on fallible operations in production contract code.

### Access Control

- [ ] Call `require_auth()` on every function that modifies state.
- [ ] Store admin/owner in **Instance Storage** (small, always loaded with contract).
- [ ] Define and document **trust assumptions** for privileged roles.

### Dependencies (contractimport!)

- [ ] Add cross-contract dependencies to `Cargo.toml` so `cargo` builds them in correct order.
- [ ] After adding a crate dep, change import path from `release/contract.wasm` to `release/deps/contract.wasm`.
- [ ] Run `soroban contract build --print-commands-only` to verify build order before deploy.

### Audit Readiness (SDF Audit Bank)

- [ ] Test suite coverage > 80% of contract functions.
- [ ] Threat model document completed (this file covers the backend; create a separate one for any contract).
- [ ] All contract invariants and edge cases documented.
- [ ] Open-source previous audit reports reviewed (40+ available at SDF Audit Bank).
- [ ] Static analysis with [Scout by CoinFabrik](https://github.com/CoinFabrik/scout) run and findings addressed.

---

## 4. Priority Action Items

Items that represent active security gaps in the current codebase:

| Priority | Item | File | Status |
|---|---|---|---|
| ~~🔴 Critical~~ | ~~Remove legacy address-only auth fallback~~ | `backend/src/middleware/validation.ts` | ✅ Fixed |
| ~~🔴 Critical~~ | ~~Add `Content-Security-Policy` headers~~ | `backend/src/index.ts` + `frontend/vercel.json` | ✅ Fixed |
| ~~🟠 High~~ | ~~Add per-wallet invoice creation rate limit~~ | `backend/src/routes/invoices.ts` | ✅ Fixed |
| ~~🟠 High~~ | ~~Patch 4 npm moderate vulnerabilities~~ | `backend/package.json` | ✅ Fixed |
| ~~🟠 High~~ | ~~Configure HSTS header~~ | `backend/src/index.ts` + `frontend/vercel.json` | ✅ Fixed |
| ~~🟡 Medium~~ | ~~Remove `@types/winston` deprecated stub~~ | `backend/package.json` | ✅ Fixed |
| 🟠 High | Configure Cloudflare WAF in production | Infrastructure | ❌ Pending |
| 🟡 Medium | Add Sentry error tracking | Backend + Frontend | ❌ Pending |
| 🟡 Medium | Add cap on line items per invoice (50 already enforced) | `backend/src/middleware/validation.ts` | ✅ Already done |
| 🟢 Low | Evaluate necessity of storing `clientAddress` / `clientEmail` | `backend/prisma/schema.prisma` | ❌ Pending |
| 🟢 Low | Add watcher health alerting webhook | `backend/src/services/watcherService.ts` | ❌ Pending |

---

## 5. Did We Do a Good Job? (SDF Self-Assessment)

| Question | Answer |
|---|---|
| Has the data flow diagram been referenced since it was created? | Yes — used to identify IDOR risk on invoice routes and public view field leakage. |
| Did STRIDE uncover new issues not previously addressed? | Yes — the address-only auth fallback (Spoof.1/EoP.2) and missing CSP (Spoof.3) were not previously tracked. |
| Do treatments adequately address identified issues? | Mostly yes. Two critical items (auth fallback, CSP) remain open. |
| Have additional issues been found after the threat model? | DoS.2 (per-wallet invoice creation limit) was identified during review of rate limiting coverage. |

---

*Last updated: 2026-02-19 | Architecture: Stellar native payments (no Soroban contracts) | Branch: feat/improvements | Security fixes applied: Spoof.1, Spoof.3, DoS.2, EoP.2 + HSTS + npm vuln patches*
