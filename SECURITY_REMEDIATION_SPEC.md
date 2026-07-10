# Link2Pay security remediation specification

Use this document as the implementation brief. Do not treat it as a request to change product behavior beyond the security requirements below.

## Objective

Resolve the six findings in `.superstack/security-reports/link2pay-app-2026-07-10.md` without weakening existing wallet-signature authentication, on-chain asset validation, or off-ramp controls.

## Delivery requirements

- Make focused source and dependency changes only; do not redesign unrelated UI or invoice flows.
- Add regression tests for every security invariant below.
- Preserve existing API responses where possible. When fields must be removed from public responses, update the frontend to use the reduced DTO.
- Run and report: `backend npm test -- --run`, `backend npm run build`, `frontend npm run build`, and `contracts/receipt cargo test`.
- Run `npm audit --omit=dev` in both `backend` and `frontend` after dependency work. Document any remaining advisories, why they remain, and the planned removal path.
- Do not use `npm audit fix --force` blindly. Review every resulting direct-package and lockfile change.

---

## P0 — Fix now

### SEC-01: Bind Privy authentication to the requested Stellar wallet

**Finding:** A valid Privy token can currently mint a backend session for an arbitrary caller-supplied `walletAddress`.

**Affected files:**

- `backend/src/routes/auth.ts`
- `backend/src/services/authService.ts`
- `frontend/src/services/auth.ts`
- new/updated backend auth tests

**Required implementation:**

1. Keep cryptographic JWT verification (issuer, audience, expiry, ES256 signature via JWKS).
2. Do not issue a Link2Pay session based solely on `walletAddress` from the request body.
3. Use Privy's server-side API/SDK and server credentials to load the authenticated user represented by the verified token subject.
4. Extract that user's linked Stellar wallet(s), normalize addresses, and require an exact match with the requested wallet address. Prefer removing `walletAddress` from the request entirely and deriving the single authorized wallet server-side.
5. Return `401` or `403` for a valid Privy token that is not linked to the requested wallet; do not reveal whether the requested wallet exists in Link2Pay.
6. Fail closed if the server-side Privy lookup fails, has no Stellar wallet, or returns an unexpected shape.
7. Keep the Freighter nonce/signature flow unchanged.

**Tests / acceptance criteria:**

- A valid Privy token for user A can create a session for A's linked Stellar wallet.
- The same valid token cannot create a session for wallet B.
- A forged, expired, wrong-audience, and wrong-issuer token are rejected.
- A session issued through Privy can access only the matching wallet's owner routes.
- No production configuration can enable the Privy endpoint without the server credential needed for wallet binding.

**Security invariant:** `session.walletAddress` must be derived from cryptographically authenticated identity data, never from an untrusted request field.

### SEC-02: Minimize the public invoice/checkout response

**Finding:** `GET /api/invoices/:id` exposes both parties' PII and off-ramp metadata to anyone with the payment link.

**Affected files:**

- `backend/src/services/invoiceService.ts`
- `backend/src/types/index.ts` and/or a dedicated public DTO type
- `backend/src/routes/invoices.ts`
- frontend components/types that read the public invoice
- new API/service tests

**Required implementation:**

1. Create a dedicated `PublicCheckoutInvoice` DTO built from an explicit allowlist. Do not serialize the Prisma invoice model directly.
2. Include only data needed to present and pay an invoice, such as:
   - invoice ID/number, status, title, description, line items, totals, currency, due date, network;
   - merchant display name/company/logo only when intentionally shown;
   - payment-specific fields strictly required by the checkout UI.
3. Remove from every unauthenticated invoice/link/status response unless a documented payment requirement proves otherwise:
   - merchant email, tax ID, street address, phone, wallet address;
   - client name, email, company, address, tax ID;
   - Bre-B payout alias, anchor transaction ID, and other private off-ramp identifiers;
   - internal audit, database, or profile fields.
4. Keep full owner invoice data behind `requireWallet` and the existing ownership check.
5. Review `/api/links/:id`, `/api/links/:id/status`, `/api/payments/:invoiceId/status`, and off-ramp public endpoints for the same fields; minimize them too.

**Tests / acceptance criteria:**

- A public invoice response does not contain any forbidden field, including nested occurrences.
- An authenticated owner response still returns fields required for the dashboard.
- Checkout and payment flows build and work against the reduced DTO.
- Snapshot or schema tests explicitly enforce the public response allowlist.

**Security invariant:** Payment links are bearer URLs, not authorization for unrelated personal or payout data.

### SEC-03: Bind every normal payment confirmation to its invoice

**Finding:** `/api/payments/confirm` accepts a sufficient transfer to the merchant wallet without requiring the invoice memo or payment time to match.

**Affected files:**

- `backend/src/routes/payments.ts`
- preferably a new shared `verifyInvoicePayment(...)` helper/service
- `backend/src/services/watcherService.ts`
- new route/service tests

**Required implementation:**

1. Centralize normal crypto invoice verification in one helper used by:
   - `POST /api/payments/submit`
   - `POST /api/payments/confirm`
   - the watcher before `markAsPaid`
2. The helper must require all of the following:
   - transaction was successful and exists on the invoice's Stellar network;
   - `tx.memo` exactly equals `invoice.invoiceNumber`;
   - memo type is the expected text type for normal invoices;
   - a payment operation targets `invoice.freelancerWallet`;
   - the operation uses the canonical issuer for USDC/EURC, or native XLM;
   - paid amount is at least the fixed invoice amount;
   - transaction creation time is not earlier than the invoice creation time (allow a small documented clock-skew tolerance only if needed);
   - transaction hash has not already been associated with another invoice.
3. Keep the off-ramp verifier separate: it must continue checking the anchor deposit address and exact anchor memo/type.
4. Return a generic 400 for a mismatched transaction. Do not disclose which predicate failed beyond useful user-safe messaging.

**Tests / acceptance criteria:**

- Correct destination/asset/amount but missing memo is rejected.
- Correct destination/asset/amount with another invoice's memo is rejected.
- A pre-invoice historical transfer is rejected.
- A correct transaction with the matching memo is accepted exactly once.
- The same hash cannot settle a second invoice.
- Watcher, `/submit`, and `/confirm` make identical accept/reject decisions for the same transaction fixture.

**Security invariant:** An on-chain transfer may settle an invoice only when it is uniquely and verifiably attributable to that invoice.

---

## P1 — Fix this sprint

### SEC-04: Make open-amount crypto payment intents single-claim and attempt-bound

**Finding:** Anyone holding an open-amount crypto link can overwrite `invoice.total` while the invoice is `PROCESSING`.

**Affected files:**

- `backend/src/routes/payments.ts`
- `backend/src/services/invoiceService.ts`
- Prisma schema/migration only if a payment-attempt record is needed
- new concurrency tests

**Required implementation:**

1. Permit setting the amount only once for an open-amount crypto invoice.
2. Claim the invoice atomically with a conditional database update, for example a state transition from `PENDING` to `PROCESSING` that also persists the amount. A second request must update zero rows and receive a conflict response.
3. Do not permit an amount update when the invoice is already `PROCESSING`.
4. Associate the generated payment intent with a unique server-side attempt ID or immutable expected payment details. If retries are supported, retry the same immutable intent rather than generating a new amount.
5. Give merchants an authenticated cancellation/reset flow only if product requirements need it; never let an anonymous link holder reset the amount.
6. Preserve the existing Bre-B `PENDING → AWAITING_ANCHOR` atomic claim behavior.

**Tests / acceptance criteria:**

- Two concurrent pay-intent calls for different amounts result in exactly one success and one `409`.
- After intent creation, the stored total cannot change through a public endpoint.
- A signed XDR generated for the winning intent remains confirmable.
- A losing or stale intent cannot change invoice state or amount.

**Security invariant:** The amount and payment details used for confirmation are immutable once an anonymous payer starts an open-amount payment.

### SEC-05: Remediate backend production dependency vulnerabilities

**Finding:** Backend production audit currently reports 7 advisories (4 high).

**Affected files:**

- `backend/package.json`
- `backend/package-lock.json`
- any source adjustments required by supported Stellar SDK upgrade

**Required implementation:**

1. Upgrade `@stellar/stellar-sdk` and `@stellar/typescript-wallet-sdk` to mutually compatible patched versions. The audit currently proposes SDK 16.x; verify the vendor migration guide before changing APIs.
2. Upgrade Express and resolve `path-to-regexp` and `qs` to non-vulnerable versions through supported direct dependency updates.
3. Keep a deterministic lockfile. Do not add broad override/resolution entries unless a direct upgrade is impossible; document any temporary override.
4. Regression-test: signature verification, payment XDR construction/submission parsing, Horizon reads, SEP-10, SEP-24, and path payments.
5. Add a CI job that runs `npm ci`, `npm audit --omit=dev --audit-level=high`, tests, and build.

**Acceptance criteria:**

- `backend npm audit --omit=dev --audit-level=high` exits clean, or every remaining advisory has a written, reviewed exception with no feasible fixed version.
- Backend tests and build pass.
- Wallet/anchor integration interfaces are type-checked and smoke-tested with safe testnet fixtures.

### SEC-06: Reduce frontend wallet/auth dependency risk

**Finding:** Frontend production audit reports 61 advisories (1 critical, 15 high), mainly through Wallets Kit, Privy, and the Stellar SDK dependency graph.

**Affected files:**

- `frontend/package.json`
- `frontend/package-lock.json`
- wallet/auth integration code if vendor APIs change

**Required implementation:**

1. Upgrade `@creit.tech/stellar-wallets-kit`, `@privy-io/react-auth`, and `@stellar/stellar-sdk` to supported releases whose resolved tree removes or materially reduces `protobufjs`, Axios, `ws`, `elliptic`, and related advisories.
2. Audit actual wallet connectors in the UI. Remove or lazy-load unused EVM/Trezor/WalletConnect connector code; the product is Stellar-focused and should not ship unneeded high-risk connector graphs.
3. If a vendor cannot provide a safe dependency path, disable that optional connector rather than retaining a critical advisory in the default production bundle.
4. Re-run production build and manual smoke tests for Freighter, Privy embedded wallets, QR scanning, and any enabled WalletConnect path.
5. Add an SBOM or dependency inventory to CI/release artifacts.

**Acceptance criteria:**

- `frontend npm audit --omit=dev --audit-level=high` has no unreviewed critical/high results.
- The production build succeeds.
- Enabled wallet flows work on the intended networks.
- The final dependency tree does not retain unused multi-chain connector libraries merely as transitives of an optional feature.

---

## Implementation order

1. SEC-01 Privy binding.
2. SEC-02 public DTO minimization.
3. SEC-03 invoice-bound payment verification.
4. SEC-04 open-amount atomic claim.
5. SEC-05 backend dependencies.
6. SEC-06 frontend dependencies.

Do not deploy the Privy path or public checkout changes independently without their regression tests. Re-run the full security audit after the fixes and compare finding IDs.

## Out of scope for this implementation pass

- Live WAF, DNS, database-encryption, hosting, and monitoring configuration; create separate infrastructure tickets.
- Replacing the receipt contract or changing on-chain upgrade authority; no high-confidence contract flaw was found in the repository review.
- Product changes to invoice visibility beyond removal of unnecessary public PII.
