# Environments

Same code everywhere — **the environment decides the network**, never the branch.
Testnet vs mainnet is configuration (env vars + hostname), so code promoted from
`develop` to `main` runs identically; only its config changes.

| Environment | Branch | Frontend domain | Backend service | Stellar network | Database |
|---|---|---|---|---|---|
| **Production** | `main` | `link2pay.xyz` | `link2pay-app.onrender.com` | **Mainnet** | `link2pay-db` |
| **Test** | `develop` | `test.link2pay.xyz` | `link2pay-app-test.onrender.com` | **Testnet** | `link2pay-db-test` |
| **Local** | feature branches | `localhost:5173` | `localhost:3007` | Testnet | local Postgres |

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
- [ ] (`m` → reserved for the future mobile app's deep-link domain)

### Vercel (one project)
- [ ] Settings → Git: Production Branch = `main`.
- [ ] Settings → Domains: add `test.link2pay.xyz` and assign it to branch
      `develop` (Preview deployments of `develop` then serve that domain).
- [ ] Env vars, scoped **Production** (main → link2pay.xyz):
      `VITE_API_URL=https://link2pay-app.onrender.com`,
      `VITE_STELLAR_NETWORK=mainnet`, `VITE_PRIVY_APP_ID=…`
- [ ] Env vars, scoped **Preview → branch `develop`**:
      `VITE_API_URL=https://link2pay-app-test.onrender.com`,
      `VITE_STELLAR_NETWORK=testnet`, `VITE_PRIVY_APP_ID=…`

### Render
- [ ] Apply `render.yaml` as a Blueprint (New → Blueprint → this repo). It
      defines both services and both databases. If the existing manually
      created service/db should become the prod pair, keep their names in sync
      with the blueprint (`link2pay-app`, `link2pay-db`) or adopt them into it.
- [ ] Set dashboard secrets on both services: `PRIVY_APP_ID`, and on prod
      `ABROAD_API_BASE`/`ABROAD_API_KEY` when the key arrives.
- [ ] If a database predates the migration baseline:
      `npx prisma migrate resolve --applied 0_init` once against it.

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
