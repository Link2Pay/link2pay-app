# Profile completion gate + KYC scope for fiat receiving

**Date:** 2026-07-05
**Status:** Approved (pending user review of this document)

## Problem

1. After creating an account, nothing requires the merchant to complete their
   profile. The existing `/register` page ("Complete your builder profile") is
   decorative: its submit handler only navigates to `/dashboard`, it saves
   nothing, and it offers a "Skip for now" link. `BusinessProfile` rows are
   created lazily with every field nullable.
2. KYC today gates fiat invoice creation and business/service invoices
   (server-side, `requireKyc.ts`), but an **unverified** merchant can still
   save a Bre-B llave (`defaultPayoutAlias`) in their profile and see the
   fiat receive setup. The rule the product wants: **everything related to
   receiving fiat (Bre-B) — including adding the llave/QR — requires KYC.
   Simple (direct payment) crypto invoices never do.**

## Decisions (made with the user)

- **Gate style:** hard gate. After account creation the dashboard is fully
  blocked until the required profile fields are saved. No skip button.
- **Required fields ("essentials"):** `displayName`, `email`, `phone`,
  `country`. Everything else (legal name, tax ID, address, city, logo,
  payout defaults) stays optional.
- **KYC scope:** unchanged for invoices (fiat → KYC, business/service → KYC,
  direct payment → free). New: adding/changing the Bre-B llave requires KYC
  VERIFIED, enforced in UI and server.
- **Approach:** A — make `/register` real and guard the dashboard shell
  (rejected: blocking overlay inside the dashboard; full backend enforcement
  of profile completeness on every API).

## Design

### 1. Completeness rule (shared definition)

A profile is **complete** when `displayName`, `email`, `phone`, and `country`
are all non-empty after trimming. Frontend owns this check in one helper:

`frontend/src/lib/profileCompleteness.ts`
```ts
isProfileComplete(profile: BusinessProfile | null): boolean
```
`null` profile (never saved) → incomplete.

### 2. Real Register page (`frontend/src/pages/Register.tsx`)

- Replace the mock fields (name/email/company) with the four essentials:
  display name, email, phone, country. All marked required; native +
  minimal client validation (non-empty, email format via `type="email"`).
- Country as a text input consistent with ProfileOptions' existing country
  field (no new country-picker dependency).
- On mount, fetch the existing profile (`getBusinessProfile`) and prefill —
  returning users with partial data only fill the gaps.
- Submit calls `saveBusinessProfile` (existing `PUT /profile`) merging the
  four fields, then navigates to `/dashboard`. Show inline error + keep the
  form on failure.
- **Delete the "Skip for now" link.**
- Keep the page's existing per-page `COPY` i18n pattern (en/es/pt) and
  design-token styling. Add copy for phone/country labels and save errors.
- Keep the existing redirect to `/` when no wallet is connected.

### 3. Dashboard gate (`frontend/src/components/Layout.tsx`)

`Layout` is the shell for every `/dashboard/*` route and already redirects to
`/login` when disconnected — the gate slots in beside that:

- After the wallet is connected, fetch the business profile once
  (`useEffect` + local state; Layout stays mounted across dashboard
  navigation, so no store is needed).
- While the check is pending, render the existing loading treatment (no
  dashboard flash).
- If `!isProfileComplete(profile)` → `<Navigate to="/register" replace />`.
- **Fail-open:** if the profile fetch itself errors (network/API down), let
  the user through — the gate is a UX requirement, not a security boundary,
  and must not lock merchants out during an API blip.
- After Register saves successfully, the navigation back re-mounts Layout,
  which re-fetches and passes.

Existing accounts with incomplete profiles hit the same gate on their next
dashboard visit — intended.

### 4. Routing after login/signup

No changes needed: the gate in Layout catches every path into the dashboard
(fresh signup, deep link, refresh). Any existing post-login navigation
straight to `/dashboard` simply bounces to `/register` until complete.

### 5. KYC wall on fiat receive setup

**Backend** (`backend/src/routes/profile.ts` or a small middleware in
`requireKyc.ts`, consistent with the existing gates): in `PUT /profile`,
when the request would set a **non-empty `defaultPayoutAlias` that differs
from the stored value**, require `kycService.isVerified(walletAddress)`;
otherwise respond `403 { error: 'KYC_REQUIRED', message: ... }`. Clearing
the alias or re-saving the same value passes. Respect `config.kyc.enforced`
(same off-switch as the other gates, keeps testnet/dev usable).

**Frontend:**
- `ProfileOptions.tsx`: the Bre-B llave input renders locked (disabled +
  hint linking to the KYC section on the same page) until `kycStatus` is
  VERIFIED. The page already mounts `<KycGate active />`, which exposes the
  status.
- `GetPaid.tsx`: the fiat (Bre-B) receive card — already hidden when
  `config.fiatRailsEnabled` is false — additionally shows a "verify your
  identity first" locked state instead of the llave/QR setup when the
  merchant is not VERIFIED.
- Handle the 403 `KYC_REQUIRED` from `PUT /profile` with a clear toast, so
  a stale tab can't silently fail.

Invoice-side walls (`requireKycForFiat`, `requireKycForInvoiceType`,
`requireBreBKeyForFiat`) are **unchanged**.

### 6. Environment behavior

On fiat-disabled environments (testnet), the fiat receive setup does not
render at all (existing rule), so the new KYC lock never shows there. The
profile completion gate applies on **all** environments — it is about
merchant data, not fiat.

## Non-goals

- Backend enforcement of profile completeness on dashboard/invoice APIs.
- Changes to which invoice types require KYC.
- Country/phone format validation beyond non-empty (no libphonenumber).
- Migrating existing `BusinessProfile` columns or backfilling data.

## Error handling summary

| Failure | Behavior |
|---|---|
| Profile fetch fails in Layout | Fail-open into dashboard |
| Profile save fails in Register | Inline error, stay on form |
| `PUT /profile` with new alias, unverified | 403 `KYC_REQUIRED`; UI toast + lock state |

## Testing

- Typecheck both packages.
- Manual, local (backend :3007 / frontend :5175): new wallet → dashboard
  redirects to /register → partial save impossible → complete save lands in
  dashboard; refresh stays in; existing incomplete account gets gated;
  unverified alias save returns 403; verified alias save passes; light/dark
  pass on Register.
