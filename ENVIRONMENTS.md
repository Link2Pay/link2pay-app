# Environments

Same code everywhere — **the environment decides the network**, never the branch.
Testnet vs mainnet is configuration (env vars + hostname), so code promoted from
`develop` to `main` runs identically; only its config changes.

| Environment | Branch | Frontend domain | Backend API | Stellar network | Database |
|---|---|---|---|---|---|
| **Production** | `main` | `link2pay.xyz` | `api.link2pay.xyz` | **Mainnet** | Railway Postgres (production env) |
| **Test** | `develop` | `test.link2pay.xyz` | `api-test.link2pay.xyz` | **Testnet** | Railway Postgres (test env) |
| **Local** | feature branches | `localhost:5173` | `localhost:3007` | Testnet | local Postgres |

The backend API lives behind **custom domains** (`api.link2pay.xyz`,
`api-test.link2pay.xyz`) so the hosting platform can change without touching
frontend config or CSP. Current host: **Railway** — service settings (root
directory, build/start commands, healthcheck) live in the Railway dashboard,
deliberately NOT in a `railway.toml` (config-as-code silently overrides
dashboard edits, which caused deploy confusion). `render.yaml` remains as a
working fallback blueprint for Render.

## Promotion flow

```
feature/my-change ──PR──▶ develop ──auto-deploy──▶ test.link2pay.xyz   (validate on testnet)
                              │
                              └────PR when validated────▶ main ──auto-deploy──▶ link2pay.xyz
```

- Day-to-day work happens on **feature branches** off `develop`; local testing
  needs no dedicated branch.
- Merging to `develop` auto-deploys the test environment. Validate there with
  testnet funds (Friendbot).
- Promote with a `develop → main` PR. Nothing is committed directly to `main`.
- **DB migrations promote themselves**: each service runs
  `prisma migrate deploy` on startup against its own database, so a schema
  change always lands on the test DB before prod.
- Hotfixes: branch off `main`, fix, PR to `main`, then merge `main` back into
  `develop` so the branches never diverge.

## Rules

1. **Never write testnet-only or mainnet-only code paths tied to a branch.**
   Network differences live in `frontend/src/config/network.ts` (resolved by
   hostname/`VITE_STELLAR_NETWORK`) and backend env vars — nothing else.
2. `develop` must always be deployable — it is a live environment, not a dump.
3. Secrets never enter the repo: Render dashboard / Vercel env vars only.

## Fiat wall on testnet

Fiat (Bre-B) payouts are a **mainnet capability**: on testnet the anchor only
simulates settlement, so the test environment walls fiat off entirely.

- Backend: `FIAT_ENABLED` (defaults to on for `STELLAR_NETWORK=public`, walled
  for testnet). Creating a `BRE_B` invoice on a walled environment returns
  `403 FIAT_DISABLED`.
- Frontend: `VITE_ENABLE_FIAT` (same default by network). Walled environments
  show a "fiat lives on link2pay.xyz" panel instead of the Bre-B flow; the
  Pix / Transferência 3.0 coming-soon waitlist walls are unchanged.
- Local off-ramp development needs the flags on (`FIAT_ENABLED=true`,
  `VITE_ENABLE_FIAT=true`) because local runs on testnet — see the
  `.env.example` files. This is also the answer to "how do we test fiat
  changes before prod": locally with the flag, and on mainnet the anchor
  stays `mock-breb` until the real Abroad credentials are set.

## One-time setup checklist

### GitHub
- [ ] `git push origin develop` (the stale February `develop` was deleted
      during branch cleanup; this publishes the real one).
- [ ] Branch protection on `main`: require a PR, no direct pushes.

### DNS (registrar for link2pay.xyz)
- [ ] `test` → CNAME → `cname.vercel-dns.com`
- [ ] `api` → CNAME → Railway domain target (shown when adding the custom
      domain to the backend service, production environment)
- [ ] `api-test` → CNAME → Railway domain target (test environment)
- [ ] (`m` → reserved for the future mobile app's deep-link domain)

### Vercel (one project)
- [ ] Settings → Git: Production Branch = `main`.
- [ ] Settings → Domains: add `test.link2pay.xyz` and assign it to branch
      `develop` (Preview deployments of `develop` then serve that domain).
- [ ] Env vars, scoped **Production** (main → link2pay.xyz):
      `VITE_API_URL=https://api.link2pay.xyz`,
      `VITE_STELLAR_NETWORK=mainnet`, `VITE_PRIVY_APP_ID=…`
- [ ] Env vars, scoped **Preview → branch `develop`**:
      `VITE_API_URL=https://api-test.link2pay.xyz`,
      `VITE_STELLAR_NETWORK=testnet`, `VITE_PRIVY_APP_ID=…`

### Railway (backend + databases)
- [ ] New project → Deploy from GitHub repo → pick this repo. On the service,
      set: root directory `backend`, build command
      `npm ci --include=dev && npm run build` (dev deps hold tsc/prisma and
      `NODE_ENV=production` would skip them), start command
      `npm run start:prod`, healthcheck path `/api/health`, watch paths
      `backend/**`. Also set build-time vars `NIXPACKS_NODE_VERSION=22`
      (Stellar SDK needs ≥20) and `NIXPACKS_NO_CACHE=1` (cache mount breaks
      `npm ci`).
- [ ] The default environment is `production` — make it track branch `main`.
      Add a Postgres database to it.
- [ ] Create a second environment `test` tracking branch `develop`, with its
      own Postgres.
- [ ] Variables per environment (Railway → service → Variables). In both:
      `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `NODE_ENV=production`,
      `PRIVY_APP_ID`, `RECEIPT_CONTRACT_ID`, `ANCHOR_PROVIDER=mock-breb`,
      `ANCHOR_HOME_DOMAIN=testanchor.stellar.org`.
      - **production**: `STELLAR_NETWORK=public`,
        `HORIZON_URL=https://horizon.stellar.org`,
        `SOROBAN_RPC_URL=https://mainnet.sorobanrpc.com`,
        `NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"`,
        `USDC_ISSUER=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`,
        `EURC_ISSUER=GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2`,
        `FIAT_ENABLED=true`, `FRONTEND_URL=https://link2pay.xyz`, and
        `ABROAD_API_BASE`/`ABROAD_API_KEY` when the key arrives.
      - **test**: `STELLAR_NETWORK=testnet`,
        `HORIZON_URL=https://horizon-testnet.stellar.org`,
        `SOROBAN_RPC_URL=https://soroban-testnet.stellar.org`,
        `NETWORK_PASSPHRASE="Test SDF Network ; September 2015"`,
        `USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`,
        `EURC_ISSUER=GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2`,
        `FIAT_ENABLED=false`, `FRONTEND_URL=https://test.link2pay.xyz`.
- [x] Custom domains: `api.link2pay.xyz` on the production service,
      `api-test.link2pay.xyz` on the development service (Settings →
      Networking, target port 8080 — Railway injects `PORT=8080`).
      **Railway requires TWO DNS records per domain**: the CNAME *and* a
      `_railway-verify.<label>` TXT record. The TXT is shown only in the
      dashboard's "Configure DNS Records" modal (the API omits it) — without
      it the domain sticks in `VALIDATING_OWNERSHIP` and the edge returns
      404 "Application not found" forever. Each registration also mints a
      fresh CNAME target, so re-adding a domain means updating DNS.
- [ ] If a database predates the migration baseline:
      `npx prisma migrate resolve --applied 0_init` once against it.

### Render (fallback)
`render.yaml` still defines the equivalent two services + two databases as a
Blueprint if Railway is ever abandoned. Same env vars, same start command.

### Vercel DNS
The whole `link2pay.xyz` zone is served by Vercel nameservers (set at
Namecheap) — DNS records live in Vercel → Domains → link2pay.xyz, never in
Namecheap's Advanced DNS. Current records: `api` / `api-test` CNAMEs to the
Railway targets plus their `_railway-verify.*` TXT records.

Deployment Protection (`ssoProtection`) is **disabled** on the project:
Hobby-plan protection walls preview deployments even on their custom domain,
which would put test.link2pay.xyz behind a Vercel login (bypass tokens and
password protection are paid features). Re-enable it if the test env ever
needs to be private again — production is unaffected either way.

### Privy
- [ ] Add `https://test.link2pay.xyz` to the app's allowed origins/domains
      (same app id works for both environments, or create a separate test app
      for cleaner user separation).

## Local development

```bash
# backend (port 3007 — 3001 is taken by another project on this machine)
cd backend && PORT=3007 npm run dev

# frontend
cd frontend && VITE_API_URL=http://localhost:3007 npm run dev
```

Local `.env` files point at a local Postgres and Stellar testnet. See
`backend/.env.example` and `frontend/.env.example`.

## Mobile (future)

The plan reserves `m.link2pay.xyz` for mobile. Guidance:
- The web app is already responsive — **do not** build a separate mobile-web
  clone repo; it would fork every fix (tokens, i18n, rails).
- When mobile happens as a **native app** (Expo/React Native), that lives in
  its own repo and `m.link2pay.xyz` becomes its universal-links / deep-link
  domain. It talks to the same two backends above (test builds → the test
  API, store builds → prod).
