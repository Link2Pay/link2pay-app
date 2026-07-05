# Wallet roller on payment links + richer login

Date: 2026-07-04 · Status: awaiting approval

Two payer/auth improvements designed together because both touch "which
identity signs":

1. **Wallet roller** — a branded wallet selector on the payment-link payer
   flow so payers choose among compatible Stellar wallets instead of the
   Freighter-only path.
2. **Login expansion** — add LinkedIn and X to Privy login, plus the
   account-linking UI that stops duplicate-account/lost-wallet accidents.

## Part 1 — Wallet roller

### Current state

- `services/walletsKit.ts` wraps Stellar Wallets Kit v2 (Freighter, xBull,
  Albedo, Rabet, Lobstr, Hana, WalletConnect) but only `OffRampPayment.tsx`
  uses it, via the Kit's stock `createButton` modal (generic-looking).
- `PaymentFlow.tsx` (the main crypto payer flow) signs only via the wallet
  store's Freighter binding (`signTransaction`), with a SEP-7 deep-link
  fallback when no in-page wallet is connected, and a 2s-interval Freighter
  network-mismatch check.
- Flag: `config.walletsKitEnabled` (`VITE_ENABLE_WALLETS_KIT`, default on).

### Design

**New component `components/Payment/WalletRoller.tsx`** — one horizontal,
scroll-snapped row of wallet cards, rendered in the "connect to pay" section
of both `PaymentFlow` and `OffRampPayment` (replacing both the stock Kit
button and the Freighter-only prompt):

- Card = wallet logo + name + state dot: green "detected" (extension
  available), neutral "tap to connect" (always-available web/deep-link
  wallets like WalletConnect/Albedo), muted "install" linking to the
  wallet's site when absent.
- Order: detected extensions first, then WalletConnect, then installable
  ones. Selected card gets the ink ring + green rail treatment (same tokens
  as the app shell; mono address chip once connected).
- Data comes from the Kit's module registry (`id`, `name`, `icon`,
  `isAvailable()`); the roller never hardcodes a wallet list, so new Kit
  modules appear automatically.
- Selecting a card: `StellarWalletsKit.setWallet(id)` → `getAddress()` →
  store the address in local component state (payer identity stays
  page-local; it must NOT touch `walletStore`, which belongs to the
  logged-in freelancer).
- Mobile (<640px): same roller, larger touch targets; WalletConnect card
  promoted to second position.

**Signing unification** — `walletsKit.ts` gains
`kitSignWith(address, xdr, passphrase)`; both payer flows call one helper:
Kit wallet connected → Kit signs; else SEP-7 deep-link fallback (unchanged).
The Freighter-specific path in `PaymentFlow` is deleted, not kept alongside:
Freighter is just another Kit module. The Freighter network-mismatch check
generalizes: after connect, compare `getNetwork()` (where the module
supports it) against the invoice's `networkPassphrase` and show the existing
mismatch banner.

**Flag behavior** — `VITE_ENABLE_FIAT`-style tri-state stays as-is for
`VITE_ENABLE_WALLETS_KIT`: flag off → roller hidden, SEP-7 fallback only
(kill switch; the old Freighter path no longer exists to fall back to).

**Out of scope** — freelancer-side wallet connection (dashboard login),
which stays Privy/Freighter via `walletStore`; path payments; adding wallets
not in the Kit.

### Error handling

- `setWallet`/`getAddress` rejection (user closes popup) → card returns to
  idle, non-blocking toast.
- Sign rejection → existing payment error banner (unchanged codes).
- Wallet on wrong network → existing mismatch banner, pay button disabled.

### Testing

- Unit: roller renders modules from a mocked Kit registry; availability
  sorting; selection wiring calls `setWallet` with the right id.
- Manual (testnet, test.link2pay.xyz): pay one invoice each with Freighter
  and xBull; sign-rejection path; mobile WalletConnect handshake with
  Lobstr; flag-off renders SEP-7-only.

## Part 2 — Login expansion + account linking

### Current state

`main.tsx` → `PrivyProvider config={{ loginMethods: ['google', 'email'] }}`.
No account-linking UI. `ProfileOptions.tsx` is the profile surface.

### Design

**Login methods** (user-decided): `['google', 'email', 'linkedin',
'twitter']`. Google/email stay primary; LinkedIn targets the professional
invoicing audience; X covers crypto-native payers. Apple rejected (needs
$99/yr dev account; revisit with the native app). SMS deferred (auto-linking
risk below; free on Privy but gated to <500 MAU pricing anyway).

**The duplicate-account risk** — Privy auto-merges logins only when the
provider returns the same verified email (Google/LinkedIn/email do). X
usually returns no email → a fresh Privy user → a fresh embedded wallet →
"my money disappeared". Mitigations, all in scope:

1. `components/Profile/LinkedAccounts.tsx` in `ProfileOptions`: rows for
   Google / LinkedIn / X / email showing linked state, using Privy's
   `useLinkAccount` (`linkGoogle`, `linkLinkedIn`, `linkTwitter`,
   `linkEmail`) + `user.linkedAccounts` for state. Unlink is out of scope
   (v1 links only).
2. Login screen hint under the buttons (i18n en/es/pt):
   "Use the same method you signed up with."
3. X is listed last so it lands behind Privy's "more options" fold.

**Dashboard prerequisites** (owner task, before merge to `develop`):
LinkedIn OAuth app + X OAuth app created and credentials pasted into Privy →
Login methods; Privy's shared dev credentials are fine for local testing
only.

### Error handling

- Link attempt where the social's email belongs to another Privy user →
  Privy raises `linked_to_another_user`; show a toast explaining the account
  conflict (i18n key `profile.linkConflict`).
- OAuth popup closed → silent no-op (Privy default).

### Testing

- Unit: LinkedAccounts renders linked/unlinked states from a mocked
  `usePrivy` user.
- Manual: fresh signup via LinkedIn (same email as a Google user) lands in
  the same account; X login creates a user, then linking Google from
  Profile attaches it; login hint renders in all three languages.

## Rollout

One feature branch off `develop` (`feature/wallet-roller-login`), two
commits minimum (roller; login+linking), validated on test.link2pay.xyz
(testnet) before the develop→main PR. No backend changes; no schema changes;
no new env vars.

## Hand-off notes for coding agents

Context an implementer needs that is not obvious from the tree:

- **Local dev**: backend `cd backend && PORT=3007 npm run dev`; frontend
  `cd frontend && VITE_API_URL=http://localhost:3007 npm run dev` (port 3001
  is taken on the dev machine). Local runs on testnet; off-ramp needs
  `FIAT_ENABLED=true` / `VITE_ENABLE_FIAT=true` (already in local .env).
- **Key files**: `frontend/src/services/walletsKit.ts` (Kit wrapper —
  extend, don't fork), `frontend/src/components/Payment/PaymentFlow.tsx`
  (crypto payer flow; Freighter path to remove is around the
  `getFreighterNetwork` effect and the `signTransaction` call),
  `frontend/src/components/Payment/OffRampPayment.tsx` (kit button to
  replace: `kitMountButton` ref), `frontend/src/main.tsx` (PrivyProvider
  `loginMethods`), `frontend/src/pages/ProfileOptions.tsx` (profile surface
  for LinkedAccounts), `frontend/src/i18n/translations.ts` (all user-facing
  strings need en/es/pt keys — no hardcoded copy).
- **Design tokens**: use the existing 3-layer CSS token system
  (`frontend/src/index.css`, tailwind.config.js) — ink sidebar palette,
  `--success` green for active/positive states, JetBrains Mono +
  `[font-variant-numeric:tabular-nums]` for addresses/amounts. Do not
  introduce new hex colors.
- **Conventions**: coherent scoped conventional commits; never push —
  the owner pushes; never commit secrets or .env files; TypeScript strict;
  match surrounding code style.
- **Verify before done**: `npm run build` passes in `frontend/`; pay a
  testnet invoice end-to-end locally with at least one Kit wallet; all
  three languages render the new strings.
