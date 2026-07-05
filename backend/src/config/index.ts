import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// ─── Environment Schema ───────────────────────────────────────────────────────
// Validate all required env vars at startup. If any are missing or malformed,
// the server will exit immediately with a clear error message instead of
// crashing later with a cryptic error.

const stellarAddressRegex = /^G[A-Z2-7]{55}$/;

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  // One origin or a comma-separated list (apex + www are distinct origins).
  FRONTEND_URL: z
    .string()
    .refine(
      (v) => v.split(',').every((o) => /^https?:\/\/[^\s,]+$/.test(o.trim())),
      'FRONTEND_URL must be one or more comma-separated http(s) origins'
    )
    .default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  STELLAR_NETWORK: z.enum(['testnet', 'public']).default('testnet'),
  HORIZON_URL: z
    .string()
    .url()
    .default('https://horizon-testnet.stellar.org'),
  SOROBAN_RPC_URL: z
    .string()
    .url()
    .default('https://soroban-testnet.stellar.org'),
  NETWORK_PASSPHRASE: z
    .string()
    .default('Test SDF Network ; September 2015'),

  USDC_ISSUER: z
    .string()
    .regex(stellarAddressRegex, 'USDC_ISSUER must be a valid Stellar address')
    .default('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
  EURC_ISSUER: z
    .string()
    .regex(stellarAddressRegex, 'EURC_ISSUER must be a valid Stellar address')
    .default('GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2'),

  WATCHER_POLL_INTERVAL_MS: z.coerce.number().default(5000),

  // Phase 5: allow payers to pay a non-USDC asset (routed to USDC via the DEX).
  PATH_PAYMENTS_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Slippage guard for path payments, in basis points (100 = 1%).
  PATH_PAYMENT_SLIPPAGE_BPS: z.coerce.number().min(0).max(5000).default(100),

  // Fiat (Bre-B) payout availability. Unset → decided by the network:
  // enabled on mainnet, walled on testnet (the anchor there is simulated,
  // so fiat would only pretend to settle). Set explicitly to override —
  // e.g. FIAT_ENABLED=true for local off-ramp development.
  FIAT_ENABLED: z.enum(['true', 'false']).optional(),

  ANCHOR_PROVIDER: z
    .enum(['testnet', 'mock-breb', 'abroad'])
    .default('testnet'),
  ANCHOR_HOME_DOMAIN: z
    .string()
    .min(1)
    .default('testanchor.stellar.org'),
  // mock-breb only: the testnet account the payer sends USDC to (must hold a
  // USDC trustline). Defaults to a built-in placeholder when unset.
  MOCK_DEPOSIT_ADDRESS: z
    .string()
    .regex(stellarAddressRegex, 'MOCK_DEPOSIT_ADDRESS must be a valid Stellar address')
    .optional(),
  // Phase 7: Reflector FX oracle (SEP-40) for a live "receiver gets ≈ COP X"
  // estimate, shown alongside (never replacing) the firm SEP-38/adapter quote.
  // Defaults to the public testnet FX oracle. Empty disables the preview.
  REFLECTOR_FX_CONTRACT: z
    .string()
    .default('CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63'),
  REFLECTOR_DECIMALS: z.coerce.number().default(14),

  RECEIPT_CONTRACT_ID: z.string().optional(),
  // Admin signer for the receipt contract (attestation only — NOT a funds key).
  // When unset, receipt writing is skipped (the off-ramp still settles).
  RECEIPT_SIGNER_SECRET: z
    .string()
    .regex(/^S[A-Z2-7]{55}$/, 'RECEIPT_SIGNER_SECRET must be a valid Stellar secret seed')
    .optional(),
  ABROAD_API_BASE: z.string().url().optional(),
  ABROAD_API_KEY: z.string().optional(),

  // Privy social login — required to accept POST /api/auth/privy-session
  PRIVY_APP_ID: z.string().optional(),

  // ─── Merchant KYC (seller onboarding gate) ──────────────────────────────
  // Verifies the seller before a wallet may create invoices. 'mock' (default)
  // simulates verification with no external dependency; 'didit' uses the real
  // Didit hosted flow (set DIDIT_API_KEY to activate).
  KYC_PROVIDER: z.enum(['mock', 'didit']).default('mock'),
  // When false, requireKyc becomes a passthrough (gate disabled). Default on.
  KYC_ENFORCED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  DIDIT_API_BASE: z.string().url().default('https://verification.didit.me'),
  DIDIT_API_KEY: z.string().optional(),
  DIDIT_WEBHOOK_SECRET: z.string().optional(),

  // ─── Email (merchant invoice copies) ──────────────────────────────────
  EMAIL_PROVIDER: z.enum(['mock', 'resend']).default('mock'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Link2Pay <invoices@link2pay.xyz>'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('\n❌ Invalid environment configuration:\n');
  parseResult.error.issues.forEach((issue) => {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nFix the above issues in your .env file and restart.\n');
  process.exit(1);
}

const env = parseResult.data;

if (env.EMAIL_PROVIDER === 'resend' && !env.RESEND_API_KEY) {
  console.error('\n❌ EMAIL_PROVIDER=resend requires RESEND_API_KEY\n');
  process.exit(1);
}

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  frontendUrl: env.FRONTEND_URL,
  databaseUrl: env.DATABASE_URL,

  stellar: {
    network: env.STELLAR_NETWORK,
    horizonUrl: env.HORIZON_URL,
    sorobanRpcUrl: env.SOROBAN_RPC_URL,
    networkPassphrase: env.NETWORK_PASSPHRASE,
    usdcIssuer: env.USDC_ISSUER,
    eurcIssuer: env.EURC_ISSUER,
  },

  watcherPollInterval: env.WATCHER_POLL_INTERVAL_MS,

  pathPayments: {
    enabled: env.PATH_PAYMENTS_ENABLED,
    slippageBps: env.PATH_PAYMENT_SLIPPAGE_BPS,
  },

  fiat: {
    // Explicit env wins; otherwise fiat is a mainnet-only capability.
    enabled: env.FIAT_ENABLED
      ? env.FIAT_ENABLED === 'true'
      : env.STELLAR_NETWORK === 'public',
  },

  anchor: {
    provider: env.ANCHOR_PROVIDER,
    homeDomain: env.ANCHOR_HOME_DOMAIN,
    mockDepositAddress: env.MOCK_DEPOSIT_ADDRESS,
  },

  reflector: {
    fxContract: env.REFLECTOR_FX_CONTRACT,
    decimals: env.REFLECTOR_DECIMALS,
  },

  receiptContractId: env.RECEIPT_CONTRACT_ID,
  receiptSignerSecret: env.RECEIPT_SIGNER_SECRET,
  abroad: {
    apiBase: env.ABROAD_API_BASE,
    apiKey: env.ABROAD_API_KEY,
  },

  privyAppId: env.PRIVY_APP_ID ?? null,

  kyc: {
    provider: env.KYC_PROVIDER,
    enforced: env.KYC_ENFORCED,
    didit: {
      apiBase: env.DIDIT_API_BASE,
      apiKey: env.DIDIT_API_KEY,
      webhookSecret: env.DIDIT_WEBHOOK_SECRET,
    },
  },

  email: {
    provider: env.EMAIL_PROVIDER,
    resendApiKey: env.RESEND_API_KEY ?? null,
    from: env.EMAIL_FROM,
  },
} as const;

// Network configurations for both testnet and mainnet
export const NETWORK_CONFIG = {
  testnet: {
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    usdcIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    eurcIssuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  },
  mainnet: {
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    usdcIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    eurcIssuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  },
} as const;

export function getAssetIssuer(code: string, networkPassphrase?: string): string | undefined {
  // Determine which network based on network passphrase
  const isTestnet = networkPassphrase === NETWORK_CONFIG.testnet.networkPassphrase;
  const network = isTestnet ? NETWORK_CONFIG.testnet : NETWORK_CONFIG.mainnet;

  switch (code) {
    case 'USDC':
      return network.usdcIssuer;
    case 'EURC':
      return network.eurcIssuer;
    default:
      return undefined;
  }
}

/**
 * True only when an on-chain payment is the invoice's asset from the CANONICAL
 * issuer. Anyone can issue a Stellar asset coded 'USDC'/'EURC', so matching on
 * the asset code alone would let a worthless same-code token mark an invoice
 * paid. XLM is native (no issuer) — require the payment be native too.
 */
export function assetMatches(
  payment: { assetCode?: string | null; assetIssuer?: string | null },
  currency: string,
  networkPassphrase?: string
): boolean {
  if (payment.assetCode !== currency) return false;
  const expectedIssuer = getAssetIssuer(currency, networkPassphrase);
  return expectedIssuer ? payment.assetIssuer === expectedIssuer : !payment.assetIssuer;
}

export function getHorizonUrl(networkPassphrase?: string): string {
  if (!networkPassphrase) {
    return config.stellar.horizonUrl;
  }
  const isTestnet = networkPassphrase === NETWORK_CONFIG.testnet.networkPassphrase;
  return isTestnet ? NETWORK_CONFIG.testnet.horizonUrl : NETWORK_CONFIG.mainnet.horizonUrl;
}
