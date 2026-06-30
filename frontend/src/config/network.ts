// Network is fixed per deployment — there is no in-app switcher.
//
// The production domain runs Mainnet; Testnet lives on its own `testnet.*`
// subdomain (a separate deploy / origin). Resolution order:
//   1. VITE_STELLAR_NETWORK env  — explicit per-deploy override
//   2. a `testnet.` hostname     — the testnet subdomain
//   3. default                   — mainnet
//
// Because each subdomain is a distinct origin, its localStorage / wallet
// session is naturally isolated from the mainnet domain.

export type StellarNetwork = 'testnet' | 'mainnet';

export interface NetworkEndpoints {
  horizonUrl: string;
  networkPassphrase: string;
}

export const NETWORK_CONFIGS: Record<StellarNetwork, NetworkEndpoints> = {
  testnet: {
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
  mainnet: {
    horizonUrl: 'https://horizon.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
  },
};

export function resolveNetwork(): StellarNetwork {
  const env = (import.meta.env.VITE_STELLAR_NETWORK || '').toLowerCase();
  if (env === 'testnet' || env === 'mainnet') return env;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'testnet' || host.startsWith('testnet.')) return 'testnet';
  }

  return 'mainnet';
}

export const RESOLVED_NETWORK: StellarNetwork = resolveNetwork();
export const RESOLVED_NETWORK_CONFIG: NetworkEndpoints = NETWORK_CONFIGS[RESOLVED_NETWORK];
