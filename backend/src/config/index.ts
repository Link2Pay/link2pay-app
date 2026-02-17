import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Stellar
  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
    sorobanRpcUrl: process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org',
    networkPassphrase: process.env.NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
    usdcIssuer: process.env.USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    eurcIssuer: process.env.EURC_ISSUER || 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  },

  // Watcher
  watcherPollInterval: parseInt(process.env.WATCHER_POLL_INTERVAL_MS || '5000', 10),
} as const;

export function getAssetIssuer(code: string): string | undefined {
  switch (code) {
    case 'USDC': return config.stellar.usdcIssuer;
    case 'EURC': return config.stellar.eurcIssuer;
    default: return undefined;
  }
}
