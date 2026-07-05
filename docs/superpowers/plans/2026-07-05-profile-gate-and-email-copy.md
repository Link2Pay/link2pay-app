# Profile Completion Gate + Merchant Email Copy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (A) Force every account to complete display name, email, phone, and country before entering the dashboard, and gate adding a Bre-B llave behind KYC; (B) email the merchant a branded HTML + PDF copy of every invoice the moment it is paid, via Resend.

**Architecture:** Part A makes the existing (currently decorative) `/register` page a real form saving through the existing `PUT /profile`, and adds a redirect gate in the dashboard shell (`Layout.tsx`); a new backend middleware refuses saving a *new* Bre-B llave without KYC. Part B adds a `backend/src/email/` subsystem (provider interface, Resend via plain `fetch`, mock for dev), server-side PDF rendering with `@react-pdf/renderer`, and a fire-and-forget hook on the invoice PAID transition in `invoiceService.markAsPaid`.

**Tech Stack:** React 18 + Vite + TS + Tailwind (frontend), Express + Prisma + Zod (backend), `@react-pdf/renderer` + `react` (new backend deps), Resend HTTP API, vitest (backend tests — first tests in this repo).

**Specs:** `docs/superpowers/specs/2026-07-05-profile-completion-gate-design.md` and `docs/superpowers/specs/2026-07-05-invoice-email-copy-design.md`. Read both before starting.

## Global Constraints

- **Branch:** create `feature/profile-gate-email-copy` off `develop`. Commit per task. **Never push; never commit to `develop`/`main` directly.** No AI attribution or sign-off lines in commit messages.
- **Design tokens only** (see `CLAUDE.md`): no hex colors, no `bg-[#...]`, no inline color styles in frontend components. Use existing primitives (`.card`, `.input`, `.btn-primary`, `.badge-*`, `Field`, `SectionCard`). Exception: PDF templates (`@react-pdf/renderer`) require literals; brand hex is `#4F51B8`.
- **i18n:** `Register.tsx`, `ProfileOptions.tsx`, and `GetPaid.tsx` use per-page `COPY: Record<Language, {...}>` objects — extend those (en/es/pt all required). Do NOT add keys to `frontend/src/i18n/translations.ts` for these pages.
- **Local dev:** backend `cd backend && PORT=3007 npm run dev`; frontend `cd frontend && VITE_API_URL=http://localhost:3007 npm run dev -- --port 5175 --strictPort`. Postgres runs in Docker (`link2pay-postgres`, port 5433 shadow / 5432 main — see `backend/.env`). **Never run `prisma db push`.** No schema changes are needed in this plan.
- **Typecheck** after every frontend task: `cd frontend && npx tsc --noEmit`. Backend: `cd backend && npm run build` (tsc).
- **Backend auth:** requests carry the wallet address; middleware `requireWallet` populates `req.walletAddress`. To exercise the API by hand, copy the auth header shape from existing calls in `frontend/src/services/api.ts` (`request()` helper).
- `config.kyc.enforced` (`KYC_ENFORCED` env) is the global KYC off-switch — every new KYC gate must respect it, matching `backend/src/middleware/requireKyc.ts`.
- KYC status values: `'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'`.

---

## Part A — Profile completion gate

### Task 1: Profile completeness helper

**Files:**
- Create: `frontend/src/lib/profileCompleteness.ts`

**Interfaces:**
- Produces: `isProfileComplete(profile: BusinessProfile | null | undefined): boolean` and `REQUIRED_PROFILE_FIELDS` — consumed by Tasks 2 and 3.

- [ ] **Step 1: Write the helper**

```ts
// frontend/src/lib/profileCompleteness.ts
import type { BusinessProfile } from '../types';

// The four "essentials" a merchant must save before entering the dashboard.
// Everything else on BusinessProfile stays optional.
export const REQUIRED_PROFILE_FIELDS = ['displayName', 'email', 'phone', 'country'] as const;

export function isProfileComplete(profile: BusinessProfile | null | undefined): boolean {
  if (!profile) return false;
  return REQUIRED_PROFILE_FIELDS.every((field) => {
    const value = profile[field];
    return typeof value === 'string' && value.trim().length > 0;
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit` — Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/profileCompleteness.ts
git commit -m "feat(profile): add profile completeness helper"
```

### Task 2: Make Register a real, mandatory form

**Files:**
- Modify: `frontend/src/pages/Register.tsx` (full rewrite of the component body; keep the file path and default export)

**Interfaces:**
- Consumes: `getBusinessProfile`, `saveBusinessProfile` from `../services/api`; `isProfileComplete` (Task 1).
- Produces: a `/register` page that saves the four essentials and navigates to `/dashboard`; Task 3 redirects here.

- [ ] **Step 1: Rewrite Register.tsx**

Replace the whole file with:

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';
import { useWalletStore } from '../store/walletStore';
import { useI18n } from '../i18n/I18nProvider';
import { getBusinessProfile, saveBusinessProfile } from '../services/api';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  title: string;
  subtitle: string;
  connectedAs: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  countryPlaceholder: string;
  required: string;
  getStarted: string;
  saving: string;
  saveError: string;
}> = {
  en: {
    title: 'Welcome to Link2Pay',
    subtitle: 'Complete your business profile to start generating payment links',
    connectedAs: 'Authenticated as',
    name: 'Business or display name',
    email: 'Email address',
    phone: 'Phone',
    country: 'Country',
    namePlaceholder: 'Jane Doe Studio',
    emailPlaceholder: 'you@company.com',
    phonePlaceholder: '+57 300 123 4567',
    countryPlaceholder: 'Colombia',
    required: '*',
    getStarted: 'Enter Dashboard',
    saving: 'Saving…',
    saveError: 'Could not save your profile. Please try again.',
  },
  es: {
    title: 'Bienvenido a Link2Pay',
    subtitle: 'Completa tu perfil de negocio para comenzar a generar links de pago',
    connectedAs: 'Autenticado como',
    name: 'Nombre del negocio o público',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    country: 'País',
    namePlaceholder: 'Estudio Jane Doe',
    emailPlaceholder: 'tu@empresa.com',
    phonePlaceholder: '+57 300 123 4567',
    countryPlaceholder: 'Colombia',
    required: '*',
    getStarted: 'Entrar al panel',
    saving: 'Guardando…',
    saveError: 'No se pudo guardar tu perfil. Inténtalo de nuevo.',
  },
  pt: {
    title: 'Bem-vindo ao Link2Pay',
    subtitle: 'Complete seu perfil de negócio para começar a gerar links de pagamento',
    connectedAs: 'Autenticado como',
    name: 'Nome do negócio ou público',
    email: 'Endereço de email',
    phone: 'Telefone',
    country: 'País',
    namePlaceholder: 'Estúdio João Silva',
    emailPlaceholder: 'voce@empresa.com',
    phonePlaceholder: '+55 11 91234 5678',
    countryPlaceholder: 'Brasil',
    required: '*',
    getStarted: 'Entrar no painel',
    saving: 'Salvando…',
    saveError: 'Não foi possível salvar seu perfil. Tente novamente.',
  },
};

export default function Register() {
  const navigate = useNavigate();
  const { publicKey, connected, privyLoading } = useWalletStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  // Prefill from any partially-saved profile so returning users only fill gaps.
  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getBusinessProfile(publicKey);
        if (cancelled || !profile) return;
        setName((v) => v || profile.displayName || '');
        setEmail((v) => v || profile.email || '');
        setPhone((v) => v || profile.phone || '');
        setCountry((v) => v || profile.country || '');
      } catch {
        // Prefill is best-effort — an empty form is fine.
      }
    })();
    return () => { cancelled = true; };
  }, [publicKey]);

  useEffect(() => {
    if (!privyLoading && (!connected || !publicKey)) navigate('/login', { replace: true });
  }, [connected, publicKey, privyLoading, navigate]);

  if (!connected || !publicKey) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setSaving(true);
    try {
      await saveBusinessProfile(
        {
          displayName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim(),
        },
        publicKey
      );
      navigate('/dashboard');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const truncateAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen gradient-bg p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-4 flex justify-end gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>

        <div className="animate-in">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-lg font-bold font-display">S</span>
            </div>
            <h1 className="text-xl font-bold text-foreground font-display mb-1 sm:text-2xl">{copy.title}</h1>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <div className="card p-5 sm:p-6">
            <div className="mb-6 p-3 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">{copy.connectedAs}</span>
              </div>
              <p className="text-sm font-mono text-foreground mt-1">{truncateAddress(publicKey)}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{copy.name} <span className="text-destructive">{copy.required}</span></label>
                <input type="text" className="input" placeholder={copy.namePlaceholder}
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">{copy.email} <span className="text-destructive">{copy.required}</span></label>
                <input type="email" className="input" placeholder={copy.emailPlaceholder}
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">{copy.phone} <span className="text-destructive">{copy.required}</span></label>
                <input type="tel" className="input" placeholder={copy.phonePlaceholder}
                  value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              <div>
                <label className="label">{copy.country} <span className="text-destructive">{copy.required}</span></label>
                <input type="text" className="input" placeholder={copy.countryPlaceholder}
                  value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>

              {error && <p className="text-xs text-danger">{copy.saveError}</p>}

              <button type="submit" className="btn-primary w-full py-3 text-base mt-2" disabled={saving}>
                {saving ? copy.saving : copy.getStarted}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
```

Notes:
- The "Skip for now" link is gone — that is the point of the feature.
- `navigate('/login')` moved into a `useEffect` (the old code navigated during render, a React error).
- If the repo's `Register.tsx` has drifted from what this plan assumes, keep its outer styling and only guarantee: 4 required fields, prefill, real save, no skip.

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit` — Expected: exit 0.

- [ ] **Step 3: Manual verification**

With both dev servers running: log in, visit `http://localhost:5175/register`. Submit with a missing field → browser blocks (native `required`). Fill all four → lands on `/dashboard`; reload `/register` → fields prefilled from the saved profile.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Register.tsx
git commit -m "feat(onboarding): make Register a real mandatory profile form"
```

### Task 3: Dashboard gate in Layout

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

**Interfaces:**
- Consumes: `isProfileComplete` (Task 1), `getBusinessProfile` from `../services/api`.

- [ ] **Step 1: Add the gate state + fetch**

In `Layout.tsx`, add to the imports:

```tsx
import { getBusinessProfile } from '../services/api';
import { isProfileComplete } from '../lib/profileCompleteness';
```

Inside the component, next to the existing state (`const [accountMenuOpen, ...]`), add:

```tsx
// Profile completion gate: the dashboard is closed until the merchant has
// saved the four profile essentials (see lib/profileCompleteness). Fail-open
// on fetch errors — this is a UX gate, not a security boundary, and an API
// blip must not lock merchants out.
const [profileGate, setProfileGate] = useState<'checking' | 'complete' | 'incomplete'>('checking');

useEffect(() => {
  if (!connected || !publicKey) return;
  let cancelled = false;
  setProfileGate('checking');
  (async () => {
    try {
      const profile = await getBusinessProfile(publicKey);
      if (!cancelled) setProfileGate(isProfileComplete(profile) ? 'complete' : 'incomplete');
    } catch {
      if (!cancelled) setProfileGate('complete');
    }
  })();
  return () => { cancelled = true; };
}, [connected, publicKey]);
```

- [ ] **Step 2: Wire the gate into the render**

Find the existing outlet block near the bottom of the file:

```tsx
{connected || isDevPreview ? (
  <Outlet />
) : privyLoading ? (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
  </div>
) : (
  <Navigate to="/login" replace />
)}
```

Replace it with (dev previews bypass the gate; the spinner markup is the existing one, reused while the profile check is in flight):

```tsx
{isDevPreview ? (
  <Outlet />
) : connected ? (
  profileGate === 'incomplete' ? (
    <Navigate to="/register" replace />
  ) : profileGate === 'checking' ? (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
    </div>
  ) : (
    <Outlet />
  )
) : privyLoading ? (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
  </div>
) : (
  <Navigate to="/login" replace />
)}
```

- [ ] **Step 3: Typecheck**

Run: `cd frontend && npx tsc --noEmit` — Expected: exit 0.

- [ ] **Step 4: Manual verification**

1. In the local DB, blank your test account's phone: `docker exec link2pay-postgres psql -U link2pay -d link2pay -c "UPDATE business_profiles SET phone = NULL WHERE wallet_address = '<your G... address>';"`
2. Visit `http://localhost:5175/dashboard` → must redirect to `/register` (phone empty, others prefilled).
3. Fill phone, submit → dashboard opens. Refresh `/dashboard` → stays in (no redirect, no flash of dashboard before the gate resolves).
4. Stop the backend, reload `/dashboard` → dashboard shell still renders (fail-open; data cards may error, that is fine). Restart the backend after.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat(onboarding): gate the dashboard behind profile completion"
```

### Task 4: Backend — KYC required to add a new Bre-B llave

**Files:**
- Modify: `backend/src/middleware/requireKyc.ts` (append the new middleware)
- Modify: `backend/src/routes/profile.ts` (mount it on PUT)

**Interfaces:**
- Produces: `requireKycForBrebKeyChange` middleware; `PUT /profile` responds `403 { error: 'KYC_REQUIRED' }` when an unverified wallet tries to set a **new** `defaultPayoutAlias`. Tasks 5–6 rely on this error shape.

- [ ] **Step 1: Add the middleware**

Append to `backend/src/middleware/requireKyc.ts` (imports `config`, `kycService`, `log`, `prisma` already exist at the top of the file):

```ts
//
// requireKycForBrebKeyChange — saving a NEW Bre-B llave (defaultPayoutAlias)
// requires a verified merchant. Everything else about the profile can be
// saved freely: omitting the field, clearing it, or re-sending the value
// already stored all pass through. Mount on PUT /profile after requireWallet
// and validateBody.
//
export async function requireKycForBrebKeyChange(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!config.kyc.enforced) return next();

  const raw = req.body?.defaultPayoutAlias;
  const incoming = typeof raw === 'string' ? raw.trim() : '';
  if (!incoming) return next(); // omitted or cleared — always allowed

  const walletAddress = req.walletAddress;
  if (!walletAddress) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { walletAddress },
      select: { defaultPayoutAlias: true },
    });
    if (profile?.defaultPayoutAlias === incoming) return next(); // unchanged

    if (await kycService.isVerified(walletAddress)) return next();

    return res.status(403).json({
      error: 'KYC_REQUIRED',
      message:
        'Identity verification is required before adding a Bre-B key to your profile.',
    });
  } catch (error) {
    log.error('requireKycForBrebKeyChange error', {
      walletAddress,
      error: (error as Error)?.message,
    });
    return res.status(500).json({ error: 'KYC check failed' });
  }
}
```

- [ ] **Step 2: Mount it**

In `backend/src/routes/profile.ts`, import it and add it to the PUT chain after `validateBody`:

```ts
import { requireKycForBrebKeyChange } from '../middleware/requireKyc';

router.put(
  '/',
  requireWallet,
  validateBody(saveProfileSchema),
  requireKycForBrebKeyChange,
  async (req: Request, res: Response) => {
    // ... existing handler unchanged
```

- [ ] **Step 3: Build**

Run: `cd backend && npm run build` — Expected: exit 0.

- [ ] **Step 4: Manual verification (local, mock KYC)**

With the local backend running and your test wallet **unverified** (reset if needed: `docker exec link2pay-postgres psql -U link2pay -d link2pay -c "UPDATE business_profiles SET kyc_status = 'UNVERIFIED', default_payout_alias = NULL WHERE wallet_address = '<G...>';"`):

1. From the app's ProfileOptions page, try saving a llave → the save must fail (network tab: `PUT /api/profile` → 403 `KYC_REQUIRED`). (Task 5 adds the friendly UI for this.)
2. Complete the mock KYC on the same page (Approve), save the llave again → 200.
3. Save the profile again with the *same* llave still in the form after resetting `kyc_status` to `UNVERIFIED` in the DB → 200 (unchanged value passes).

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/requireKyc.ts backend/src/routes/profile.ts
git commit -m "feat(kyc): require verification to add a new Bre-B key"
```

### Task 5: ProfileOptions — lock the llave input until verified

**Files:**
- Modify: `frontend/src/pages/ProfileOptions.tsx`

**Interfaces:**
- Consumes: `KycGate`'s existing `onVerifiedChange?: (verified: boolean) => void` prop (it reports `true` when verified OR when the gate is globally disabled); the 403 `KYC_REQUIRED` shape from Task 4.

- [ ] **Step 1: Track verification state**

The page already renders `<KycGate active />` inside the `kyc-section` SectionCard. Add state near the other `useState` calls and pass the callback:

```tsx
const [kycVerified, setKycVerified] = useState(false);
```

```tsx
<KycGate active onVerifiedChange={setKycVerified} />
```

- [ ] **Step 2: Lock the alias input**

Find the alias `<Field>` (id `pf-alias`, uses `settlementRail?.aliasLabel`). Disable it and swap the hint while unverified:

```tsx
<Field
  id="pf-alias"
  label={settlementRail ? settlementRail.aliasLabel : copy.defaultAliasLabel}
  hint={kycVerified ? copy.aliasHint : copy.aliasKycLocked}
>
  <input id="pf-alias" className="input" value={form.defaultPayoutAlias ?? ''}
    onChange={(e) => set('defaultPayoutAlias', e.target.value)}
    placeholder={settlementRail?.aliasPlaceholder ?? '@nequi-3001234567'}
    disabled={!kycVerified} />
</Field>
```

Add `aliasKycLocked` to the page's `COPY` object (all three languages):

- en: `'Verify your identity below to add a Bre-B key.'`
- es: `'Verifica tu identidad más abajo para agregar una llave Bre-B.'`
- pt: `'Verifique sua identidade abaixo para adicionar uma chave Bre-B.'`

- [ ] **Step 3: Surface the 403 on save**

In the page's save handler (the function calling `saveBusinessProfile`), catch the KYC rejection specifically. The API `request()` helper throws an `Error` whose message comes from the response body's `message`/`error`; detect it and toast:

```tsx
} catch (err) {
  const message = err instanceof Error ? err.message : '';
  if (message.includes('KYC_REQUIRED') || message.toLowerCase().includes('identity verification')) {
    toast.error(copy.aliasKycLocked);
  } else {
    toast.error(copy.saveError); // reuse the page's existing save-error copy key
  }
}
```

(Match the page's existing error-handling style — if it already toasts a generic error, add the KYC branch above it. Check how `request()` formats errors in `frontend/src/services/api.ts` and adjust the detection so it actually matches.)

- [ ] **Step 4: Typecheck + manual verification**

`cd frontend && npx tsc --noEmit` → exit 0. In the browser (wallet unverified): alias input is disabled with the locked hint; complete mock KYC → input unlocks without a reload; save works.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ProfileOptions.tsx
git commit -m "feat(kyc): lock Bre-B key input until identity is verified"
```

### Task 6: GetPaid — KYC-locked fiat receive card

**Files:**
- Modify: `frontend/src/pages/GetPaid.tsx`

**Interfaces:**
- Consumes: `getKycStatus(walletAddress): Promise<KycStatusView>` from `../services/api` where `KycStatusView = { status: 'UNVERIFIED'|'PENDING'|'VERIFIED'|'REJECTED', enforced: boolean, ... }`.

- [ ] **Step 1: Fetch KYC status**

Add imports and state:

```tsx
import { Link } from 'react-router-dom';
import { getKycStatus } from '../services/api';
```

```tsx
// null = still loading. Cleared when the gate is globally disabled (enforced: false).
const [kycCleared, setKycCleared] = useState<boolean | null>(null);

useEffect(() => {
  if (!publicKey || !fiatLive) return;
  let cancelled = false;
  (async () => {
    try {
      const view = await getKycStatus(publicKey);
      if (!cancelled) setKycCleared(view.status === 'VERIFIED' || !view.enforced);
    } catch {
      if (!cancelled) setKycCleared(true); // fail-open, consistent with the profile gate
    }
  })();
  return () => { cancelled = true; };
}, [publicKey, fiatLive]);
```

- [ ] **Step 2: Render the locked state**

Inside the fiat card, the current structure is `{!fiatLive ? <ComingSoonWall .../> : (<>…alias/QR content…</>)}`. Change it so an unverified merchant sees a lock instead of the llave/QR setup:

```tsx
{!fiatLive ? (
  <ComingSoonWall rail={fiatRail} wallet={publicKey} />
) : kycCleared === false ? (
  <div className="rounded-xl border border-surface-3 bg-muted p-4 text-center">
    <p className="text-sm font-semibold text-ink-1">{copy.fiatKycTitle}</p>
    <p className="mt-1 text-xs text-ink-3">{copy.fiatKycDesc}</p>
    <Link to="/dashboard/profile-options#kyc-section" className="btn-primary mt-3 inline-flex text-sm">
      {copy.fiatKycCta}
    </Link>
  </div>
) : (
  <>
    {/* existing alias/QR content, unchanged */}
  </>
)}
```

While `kycCleared === null` (loading) the existing content renders — acceptable flash-free default since the fetch is fast; do NOT add a spinner here.

Add to the page `COPY` (en/es/pt):

- `fiatKycTitle`: en `'Identity verification required'` / es `'Se requiere verificación de identidad'` / pt `'Verificação de identidade necessária'`
- `fiatKycDesc`: en `'Verify your identity to receive pesos with Bre-B and set up your QR.'` / es `'Verifica tu identidad para recibir pesos con Bre-B y configurar tu QR.'` / pt `'Verifique sua identidade para receber com Bre-B e configurar seu QR.'`
- `fiatKycCta`: en `'Verify identity'` / es `'Verificar identidad'` / pt `'Verificar identidade'`

- [ ] **Step 3: Typecheck + manual verification**

`cd frontend && npx tsc --noEmit` → exit 0. Local env has fiat rails visible? If `config.fiatRailsEnabled` is false locally, temporarily run the frontend with the fiat flag on (check `frontend/src/config/index.ts` for the env var it reads, e.g. `VITE_FIAT_RAILS=true`) to see the card. Unverified → locked card with CTA; after mock KYC approval → alias/QR setup renders.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/GetPaid.tsx
git commit -m "feat(kyc): wall the fiat receive setup behind verification"
```

---

## Part B — Merchant invoice copy by email

### Task 7: Email config

**Files:**
- Modify: `backend/src/config/index.ts`

**Interfaces:**
- Produces: `config.email = { provider: 'mock' | 'resend', resendApiKey: string | null, from: string }` — consumed by Task 8.

- [ ] **Step 1: Extend the env schema**

In the Zod env schema (where `KYC_PROVIDER` etc. are defined), add:

```ts
EMAIL_PROVIDER: z.enum(['mock', 'resend']).default('mock'),
RESEND_API_KEY: z.string().optional(),
EMAIL_FROM: z.string().default('Link2Pay <invoices@link2pay.xyz>'),
```

After the schema parse (follow the file's existing pattern for cross-field validation; if none exists, add this right after `const env = ...parse(...)`):

```ts
if (env.EMAIL_PROVIDER === 'resend' && !env.RESEND_API_KEY) {
  throw new Error('EMAIL_PROVIDER=resend requires RESEND_API_KEY');
}
```

In the exported `config` object, next to the `kyc` block, add:

```ts
email: {
  provider: env.EMAIL_PROVIDER,
  resendApiKey: env.RESEND_API_KEY ?? null,
  from: env.EMAIL_FROM,
},
```

- [ ] **Step 2: Build + commit**

`cd backend && npm run build` → exit 0.

```bash
git add backend/src/config/index.ts
git commit -m "feat(email): add email provider configuration"
```

### Task 8: Email providers (mock + Resend) with tests

**Files:**
- Create: `backend/src/email/types.ts`
- Create: `backend/src/email/providers/MockEmailProvider.ts`
- Create: `backend/src/email/providers/ResendEmailProvider.ts`
- Test: `backend/src/email/providers/ResendEmailProvider.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface SendEmailInput { to: string; subject: string; html: string; attachments?: { filename: string; content: Buffer }[] }
  interface EmailProvider { readonly id: string; send(input: SendEmailInput): Promise<void> }
  class ResendEmailProvider implements EmailProvider { constructor(apiKey: string, from: string) }
  class MockEmailProvider implements EmailProvider {}
  ```
  Consumed by Task 11.

- [ ] **Step 1: Write the failing test**

`backend/src/email/providers/ResendEmailProvider.test.ts` — vitest is already a dependency (`npm test` runs it); these are the repo's first tests, no config file needed (vitest defaults pick up `*.test.ts`):

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResendEmailProvider } from './ResendEmailProvider';

describe('ResendEmailProvider', () => {
  const realFetch = global.fetch;
  afterEach(() => { global.fetch = realFetch; });

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'email_123' }), { status: 200 })
    ) as unknown as typeof fetch;
  });

  it('POSTs the Resend payload with base64 attachments', async () => {
    const provider = new ResendEmailProvider('re_test_key', 'Link2Pay <invoices@link2pay.xyz>');
    await provider.send({
      to: 'merchant@example.com',
      subject: 'Invoice paid',
      html: '<p>hi</p>',
      attachments: [{ filename: 'invoice.pdf', content: Buffer.from('PDFDATA') }],
    });

    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test_key');
    const body = JSON.parse(init.body);
    expect(body.from).toBe('Link2Pay <invoices@link2pay.xyz>');
    expect(body.to).toEqual(['merchant@example.com']);
    expect(body.attachments[0]).toEqual({
      filename: 'invoice.pdf',
      content: Buffer.from('PDFDATA').toString('base64'),
    });
  });

  it('throws on non-2xx with the response body in the message', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('{"message":"invalid from"}', { status: 422 })
    ) as unknown as typeof fetch;
    const provider = new ResendEmailProvider('re_test_key', 'bad');
    await expect(
      provider.send({ to: 'a@b.c', subject: 's', html: '<p/>' })
    ).rejects.toThrow(/422/);
  });
});
```

- [ ] **Step 2: Run it — must fail**

Run: `cd backend && npx vitest run src/email` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`backend/src/email/types.ts`:

```ts
export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export interface EmailProvider {
  readonly id: string;
  send(input: SendEmailInput): Promise<void>;
}
```

`backend/src/email/providers/MockEmailProvider.ts`:

```ts
import { EmailProvider, SendEmailInput } from '../types';
import { log } from '../../utils/logger';

// Default provider: logs instead of sending. Keeps dev/testnet working with
// zero email configuration.
export class MockEmailProvider implements EmailProvider {
  readonly id = 'mock';

  async send(input: SendEmailInput): Promise<void> {
    log.info('[email:mock] send', {
      to: input.to,
      subject: input.subject,
      attachments: input.attachments?.map((a) => `${a.filename} (${a.content.length}b)`) ?? [],
    });
  }
}
```

`backend/src/email/providers/ResendEmailProvider.ts` (plain fetch, no SDK — same style as `AbroadAdapter`):

```ts
import { EmailProvider, SendEmailInput } from '../types';

export class ResendEmailProvider implements EmailProvider {
  readonly id = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string
  ) {}

  async send(input: SendEmailInput): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.attachments?.length && {
          attachments: input.attachments.map((a) => ({
            filename: a.filename,
            content: a.content.toString('base64'),
          })),
        }),
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Resend send failed: ${res.status} ${body.slice(0, 300)}`);
    }
  }
}
```

- [ ] **Step 4: Run tests — must pass**

Run: `cd backend && npx vitest run src/email` — Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/src/email
git commit -m "feat(email): add mock and Resend email providers"
```

### Task 9: Server-side invoice PDF

**Files:**
- Modify: `backend/package.json` (deps), `backend/tsconfig.json` (jsx)
- Create: `backend/src/email/invoicePdf.tsx`

**Interfaces:**
- Consumes: Prisma `Invoice` with `lineItems` included (`Prisma.InvoiceGetPayload<{ include: { lineItems: true } }>`).
- Produces: `renderInvoicePdf(invoice): Promise<Buffer>` — consumed by Task 11.

- [ ] **Step 1: Install deps + enable JSX**

```bash
cd backend && npm install react @react-pdf/renderer && npm install -D @types/react
```

In `backend/tsconfig.json` `compilerOptions`, add: `"jsx": "react-jsx"`.

- [ ] **Step 2: Create the template**

Copy `frontend/src/components/Invoice/InvoicePDF.tsx` to `backend/src/email/invoicePdf.tsx`, then apply exactly these changes:

1. Replace the import of `pdf` with `renderToBuffer`:
   ```tsx
   import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
   ```
2. Delete the frontend-only imports (`import type { Invoice } from '../../types';` and `import { CURRENCY_SYMBOLS } from '../../config';`) and replace with:
   ```tsx
   import { Prisma } from '@prisma/client';

   type InvoiceWithLineItems = Prisma.InvoiceGetPayload<{ include: { lineItems: true } }>;

   const CURRENCY_SYMBOLS: Record<string, string> = { XLM: 'XLM', USDC: '$', EURC: '€' };
   ```
   (Confirm the symbol map against `frontend/src/config/index.ts` `CURRENCY_SYMBOLS` and copy its exact values.)
3. The frontend `Invoice` type uses string amounts; Prisma uses `Decimal`. Where the template renders amounts (`subtotal`, `taxAmount`, `discount`, `total`, line item `quantity`/`rate`/`amount`), wrap with a small helper added near the top:
   ```tsx
   const dec = (v: unknown): string => (v == null ? '0' : String(v));
   ```
   and render `dec(invoice.total)` etc. Keep the template's existing number formatting if it has one.
4. Delete any browser-side export helpers at the bottom of the copied file (functions using `pdf(...).toBlob()` / download links). Replace with:
   ```tsx
   export async function renderInvoicePdf(invoice: InvoiceWithLineItems): Promise<Buffer> {
     return renderToBuffer(<InvoicePdfDocument invoice={invoice} />);
   }
   ```
   where `InvoicePdfDocument` is the copied `<Document>` component (rename if the frontend used a different name; the component takes `{ invoice }` as prop — adapt its prop type to `InvoiceWithLineItems`).
5. Field-name mapping is mostly 1:1 (the frontend type mirrors the DB: `invoiceNumber`, `clientName`, `freelancerName`, `lineItems[].description/quantity/rate/amount`, `paidAt`, `transactionHash`). Fix any TS errors the build surfaces rather than changing the schema.
6. Keep all hex literals — this file is the sanctioned exception (brand `#4F51B8`). Fonts are built-in Helvetica variants; nothing to register server-side.

- [ ] **Step 3: Smoke-test the render**

Create a throwaway script `backend/src/email/__pdfsmoke.ts`:

```ts
import { renderInvoicePdf } from './invoicePdf';
import prisma from '../db';

(async () => {
  const invoice = await prisma.invoice.findFirst({ include: { lineItems: true } });
  if (!invoice) { console.log('no invoice in local DB — create one in the app first'); process.exit(1); }
  const buf = await renderInvoicePdf(invoice);
  require('fs').writeFileSync('/tmp/invoice-smoke.pdf', buf);
  console.log('wrote /tmp/invoice-smoke.pdf', buf.length, 'bytes');
  process.exit(0);
})();
```

Run: `cd backend && npx tsx src/email/__pdfsmoke.ts` (or `ts-node` — whichever the repo's dev script uses; check `package.json` `dev`). Open `/tmp/invoice-smoke.pdf` and confirm it renders like the frontend's downloaded PDF. **Delete `__pdfsmoke.ts` before committing.**

- [ ] **Step 4: Build + commit**

`cd backend && npm run build` → exit 0.

```bash
git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/src/email/invoicePdf.tsx
git commit -m "feat(email): render the invoice PDF server-side"
```

### Task 10: HTML email template

**Files:**
- Create: `backend/src/email/templates.ts`
- Test: `backend/src/email/templates.test.ts`

**Interfaces:**
- Consumes: `InvoiceWithLineItems` (same Prisma payload type as Task 9).
- Produces: `invoicePaidHtml(invoice: InvoiceWithLineItems, dashboardUrl: string): string` and `invoicePaidSubject(invoice: InvoiceWithLineItems): string` — consumed by Task 11.

- [ ] **Step 1: Write the failing test**

`backend/src/email/templates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { invoicePaidHtml, invoicePaidSubject } from './templates';

const invoice = {
  id: 'inv_1',
  invoiceNumber: 'INV-0001',
  clientName: 'ACME Corp',
  title: 'Website redesign',
  total: '150.50',
  currency: 'USDC',
  transactionHash: 'abc123def456',
  paidAt: new Date('2026-07-05T12:00:00Z'),
  lineItems: [
    { description: 'Design', quantity: '1', rate: '150.50', amount: '150.50' },
  ],
} as never; // structural subset of the Prisma payload — enough for the template

describe('invoice paid email', () => {
  it('subject names the invoice and amount', () => {
    expect(invoicePaidSubject(invoice)).toBe('Invoice INV-0001 paid — 150.50 USDC');
  });

  it('html includes client, line items, tx hash and dashboard link', () => {
    const html = invoicePaidHtml(invoice, 'https://www.link2pay.xyz/dashboard/links/inv_1');
    expect(html).toContain('ACME Corp');
    expect(html).toContain('Design');
    expect(html).toContain('abc123def456');
    expect(html).toContain('https://www.link2pay.xyz/dashboard/links/inv_1');
    expect(html).not.toContain('undefined');
  });
});
```

- [ ] **Step 2: Run — must fail**

Run: `cd backend && npx vitest run src/email/templates.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`backend/src/email/templates.ts` (inline styles only — email clients strip stylesheets; table layout for compatibility; brand hex `#4F51B8` is fine here, this is an email body, not app UI):

```ts
import { Prisma } from '@prisma/client';

type InvoiceWithLineItems = Prisma.InvoiceGetPayload<{ include: { lineItems: true } }>;

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const amount = (v: unknown): string => String(v ?? '0');

export function invoicePaidSubject(invoice: InvoiceWithLineItems): string {
  return `Invoice ${invoice.invoiceNumber} paid — ${amount(invoice.total)} ${invoice.currency}`;
}

export function invoicePaidHtml(invoice: InvoiceWithLineItems, dashboardUrl: string): string {
  const rows = invoice.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(item.description)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${esc(amount(item.quantity))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${esc(amount(item.amount))} ${esc(invoice.currency)}</td>
        </tr>`
    )
    .join('');

  const paidAt = invoice.paidAt ? new Date(invoice.paidAt).toUTCString() : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a2e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#4F51B8;padding:20px 24px;">
          <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:1px;">LINK2PAY</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <h1 style="margin:0 0 4px;font-size:18px;">Invoice ${esc(invoice.invoiceNumber)} was paid</h1>
          <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">
            ${esc(invoice.clientName)} paid <strong>${esc(amount(invoice.total))} ${esc(invoice.currency)}</strong>${paidAt ? ` on ${esc(paidAt)}` : ''}.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
            <tr>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #4F51B8;">Item</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #4F51B8;">Qty</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #4F51B8;">Amount</th>
            </tr>
            ${rows}
            <tr>
              <td></td>
              <td style="padding:10px 12px;text-align:right;font-weight:bold;">Total</td>
              <td style="padding:10px 12px;text-align:right;font-weight:bold;">${esc(amount(invoice.total))} ${esc(invoice.currency)}</td>
            </tr>
          </table>

          ${invoice.transactionHash ? `
          <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">
            Transaction: <span style="font-family:monospace;">${esc(invoice.transactionHash)}</span>
          </p>` : ''}

          <p style="margin:20px 0 0;">
            <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#4F51B8;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:bold;">
              View in dashboard
            </a>
          </p>

          <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;">
            The invoice PDF is attached. You are receiving this because a payment link you created on Link2Pay was paid.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
```

- [ ] **Step 4: Run — must pass**

Run: `cd backend && npx vitest run src/email/templates.test.ts` — Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add backend/src/email/templates.ts backend/src/email/templates.test.ts
git commit -m "feat(email): invoice-paid HTML template"
```

### Task 11: emailService + PAID-transition hook

**Files:**
- Create: `backend/src/email/emailService.ts`
- Modify: `backend/src/services/invoiceService.ts` (the `markAsPaid` method)

**Interfaces:**
- Consumes: providers (Task 8), `renderInvoicePdf` (Task 9), templates (Task 10), `config.email` (Task 7).
- Produces: `emailService.sendInvoicePaidCopy(invoice, merchantEmail): Promise<void>`.

- [ ] **Step 1: emailService**

`backend/src/email/emailService.ts`:

```ts
import { Prisma } from '@prisma/client';
import { config } from '../config';
import { EmailProvider } from './types';
import { MockEmailProvider } from './providers/MockEmailProvider';
import { ResendEmailProvider } from './providers/ResendEmailProvider';
import { renderInvoicePdf } from './invoicePdf';
import { invoicePaidHtml, invoicePaidSubject } from './templates';

type InvoiceWithLineItems = Prisma.InvoiceGetPayload<{ include: { lineItems: true } }>;

function resolveProvider(): EmailProvider {
  if (config.email.provider === 'resend') {
    // Boot-time config validation guarantees the key exists here.
    return new ResendEmailProvider(config.email.resendApiKey as string, config.email.from);
  }
  return new MockEmailProvider();
}

class EmailService {
  private readonly provider = resolveProvider();

  /** Merchant copy of a just-paid invoice: branded HTML + attached PDF. */
  async sendInvoicePaidCopy(invoice: InvoiceWithLineItems, merchantEmail: string): Promise<void> {
    const pdf = await renderInvoicePdf(invoice);
    // frontendUrl may be a comma-separated origin list (CORS) — first entry is canonical.
    const origin = config.frontendUrl.split(',')[0].trim().replace(/\/$/, '');
    await this.provider.send({
      to: merchantEmail,
      subject: invoicePaidSubject(invoice),
      html: invoicePaidHtml(invoice, `${origin}/dashboard/links/${invoice.id}`),
      attachments: [{ filename: `invoice-${invoice.invoiceNumber}.pdf`, content: pdf }],
    });
  }
}

export const emailService = new EmailService();
```

(Check the exact name of the frontend URL in `backend/src/config/index.ts` — it is `config.frontendUrl`, already normalized to a comma-separated origins string.)

- [ ] **Step 2: Hook the PAID transition**

In `backend/src/services/invoiceService.ts`, `markAsPaid` currently `return prisma.$transaction(...)`. Change it to capture the result, fire the email after commit, and return:

```ts
import { emailService } from '../email/emailService';

// inside markAsPaid — replace `return prisma.$transaction(` with:
const invoice = await prisma.$transaction(
  async (tx) => {
    // ... existing transaction body, unchanged ...
  },
  { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
);

// Merchant email copy — attached to the PAID *transition* (this method runs
// exactly once per invoice thanks to the serializable already-paid check),
// fire-and-forget: an email failure must never fail payment processing.
void (async () => {
  try {
    const profile = await prisma.businessProfile.findUnique({
      where: { walletAddress: invoice.freelancerWallet },
      select: { email: true },
    });
    if (!profile?.email) {
      log.info('Invoice paid: merchant has no profile email, skipping copy', { invoiceId: invoice.id });
      return;
    }
    await emailService.sendInvoicePaidCopy(invoice, profile.email);
    log.info('Merchant invoice copy sent', { invoiceId: invoice.id });
  } catch (error) {
    log.error('Merchant invoice copy failed', {
      invoiceId: invoice.id,
      error: (error as Error)?.message,
    });
  }
})();

return invoice;
```

(`log` is already imported in the file; if not, import from `../utils/logger` matching siblings.)

- [ ] **Step 3: Build + tests**

`cd backend && npm run build` → exit 0. `npx vitest run` → all pass.

- [ ] **Step 4: Manual verification (mock provider)**

Local backend runs with `EMAIL_PROVIDER` unset (mock). Create a small testnet invoice in the local app and pay it with a testnet wallet (Freighter on testnet). Watch the backend logs for `[email:mock] send` with the right `to` (your profile email) and a non-zero PDF attachment size — and confirm the invoice still flips to PAID normally.

- [ ] **Step 5: Commit**

```bash
git add backend/src/email/emailService.ts backend/src/services/invoiceService.ts
git commit -m "feat(email): send the merchant an invoice copy when paid"
```

### Task 12: Final verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Full builds**

`cd frontend && npx tsc --noEmit && npm run build` → exit 0. `cd backend && npm run build && npx vitest run` → exit 0, all tests pass.

- [ ] **Step 2: End-to-end walkthrough (local)**

1. Fresh wallet (or blank the essentials in DB) → `/dashboard` bounces to `/register` → complete → in.
2. Unverified: llave input locked in ProfileOptions; fiat card locked in GetPaid; direct-payment invoice creation still works.
3. Mock-KYC approve → llave saves; API-level bypass returns 403 when unverified (Task 4 verification).
4. Pay a testnet invoice → `[email:mock] send` log; invoice PAID; dashboard "Top payer" updates.
5. Light and dark theme pass on `/register` and the two locked states.

- [ ] **Step 3: Report**

Summarize what was built, list every commit, and flag anything that deviated from this plan (and why) for the reviewer.

---

## Out of scope (do NOT do)

- No Resend account, DNS records, or Railway env changes — ops happens after review.
- No emailing the payer; no emails at creation/expiry/settlement.
- No Prisma schema changes or migrations. No `prisma db push`, ever.
- No changes to the existing invoice-creation KYC walls (`requireKycForFiat`, `requireKycForInvoiceType`, `requireBreBKeyForFiat`).
- No pushing to any remote.
