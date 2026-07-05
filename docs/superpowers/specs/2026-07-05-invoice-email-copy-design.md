# Merchant invoice copy by email (on payment)

**Date:** 2026-07-05
**Status:** Approved (pending user review of this document)

## Problem

Merchants get no record of a payment outside the dashboard. When a client
pays an invoice, a copy of that invoice should land in the merchant's email
(the address now guaranteed by the profile completion gate — see
`2026-07-05-profile-completion-gate-design.md`).

## Decisions (made with the user)

- **Trigger:** when the invoice is **paid** (transition to `PAID`), not at
  creation. One email per invoice; abandoned links generate nothing.
- **Provider:** **Resend** (3k emails/month free, single API key, DNS
  verification on the Vercel-hosted zone we control).
- **Format:** branded HTML summary **with the invoice PDF attached**.

## Design

### 1. Email subsystem — `backend/src/email/`

Mirrors the existing provider patterns (`kyc/providers/*`, anchor adapters):

- `EmailProvider` interface:
  ```ts
  send(input: {
    to: string;
    subject: string;
    html: string;
    attachments?: { filename: string; content: Buffer }[];
  }): Promise<void>
  ```
- `ResendEmailProvider` — plain `fetch` to `POST https://api.resend.com/emails`
  with `Authorization: Bearer <RESEND_API_KEY>`; attachments passed as
  base64 `content`. `AbortSignal.timeout` like `AbroadAdapter`; non-2xx →
  throw with response body in the message. No SDK dependency.
- `MockEmailProvider` — logs the send and resolves. Used whenever the real
  provider is not configured.
- `emailService` — resolves the provider from config once, exposes
  `sendInvoicePaidCopy(invoice, merchantEmail)`.

### 2. Config (`backend/src/config/index.ts`)

- `EMAIL_PROVIDER`: `z.enum(['mock', 'resend']).default('mock')`
- `RESEND_API_KEY`: optional string
- `EMAIL_FROM`: optional string, default `Link2Pay <invoices@link2pay.xyz>`

Selecting `resend` without an API key fails config validation at boot (same
strictness as the KYC provider config). Default `mock` keeps dev/testnet
working with zero setup.

### 3. Server-side PDF — `backend/src/email/invoicePdf.tsx`

- Add `react` and `@react-pdf/renderer` to backend dependencies; enable
  `"jsx": "react-jsx"` in the backend `tsconfig.json`.
- Adapt the frontend `InvoicePDF.tsx` template (same layout, fonts it can
  load server-side, brand hex `#4F51B8` — the sanctioned literal-color
  exception). Export `renderInvoicePdf(invoice): Promise<Buffer>` via
  `renderToBuffer`.
- The template reads only invoice + business profile data already available
  server-side; no HTTP calls during render.

### 4. HTML body — `backend/src/email/templates.ts`

Inline-styled HTML (email clients ignore stylesheets): merchant-facing
summary with client name, line items, totals, currency, payment tx hash,
paid-at timestamp, and a button linking to
`${config.frontendUrl}/dashboard/links/<id>`. Text kept i18n-simple:
English only for v1 (noted as future work).

### 5. Trigger

At the single code path where an invoice transitions to `PAID` (the watcher
/ payment-confirmation flow in `watcherService` → `invoiceService`):

1. Load the merchant's `BusinessProfile.email`.
2. No email on file (legacy account) → `log.info` and skip.
3. Otherwise `void emailService.sendInvoicePaidCopy(...)` — **fire and
   forget**, wrapped so any render/send failure is `log.error`'d and never
   blocks or fails payment processing.

Idempotency: the send is attached to the state *transition* (which executes
once), not to observers of the `PAID` state, so watcher re-polls cannot
duplicate it. A crash between DB update and send loses at most that one
email — accepted for v1 (no `merchant_copy_sent_at` column).

### 6. One-time ops (not code)

- Create the Resend account/API key; verify `link2pay.xyz` (DKIM/SPF
  records added to the Vercel-hosted DNS zone).
- Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` on Railway
  **production**. Development environment stays `mock`.

## Non-goals

- Emailing the payer/client a copy.
- Emails at invoice creation, expiry, or off-ramp settlement.
- Per-invoice or per-merchant opt-out.
- Localized email copy (v1 is English).
- Delivery tracking / resend UI.

## Error handling summary

| Failure | Behavior |
|---|---|
| No merchant email on profile | Skip + info log |
| PDF render throws | Error log; payment processing unaffected |
| Resend API non-2xx / timeout | Error log; no retry in v1 |
| `EMAIL_PROVIDER=resend` without key | Boot-time config error |

## Testing

- Typecheck backend.
- Unit-ish manual: local backend with `EMAIL_PROVIDER=mock` logs the send
  on a simulated payment; with a real Resend key + own inbox, pay a small
  testnet invoice locally and verify HTML + attached PDF render correctly
  in Gmail (light/dark).
- Confirm a failing send (bad key) leaves the invoice PAID and the watcher
  healthy.
