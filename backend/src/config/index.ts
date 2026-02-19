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
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
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
} as const;

export function getAssetIssuer(code: string): string | undefined {
  switch (code) {
    case 'USDC':
      return config.stellar.usdcIssuer;
    case 'EURC':
      return config.stellar.eurcIssuer;
    default:
      return undefined;
  }
}
