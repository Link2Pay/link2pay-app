// Network is fixed per deployment — there is no in-app switcher.
//
// The production domain runs Mainnet; Testnet lives on its own subdomain
// (test.link2pay.xyz — the `develop` branch deploy; see ENVIRONMENTS.md).
// Resolution order:
//   1. VITE_STELLAR_NETWORK env       — explicit per-deploy override
//   2. a `test.`/`testnet.` hostname  — the testnet subdomain
//   3. default                        — mainnet
//
// Because each subdomain is a distinct origin, its localStorage / wallet
// session is naturally isolated from the mainnet domain.

export type StellarNetwork = 'testnet' | 'mainnet';

export interface NetworkEndpoints {
  horizonUrl: string;
  networkPassphrase: string;
  usdcIssuer: string;
  eurcIssuer: string;
}

// Issuers mirror the backend's NETWORK_CONFIG (backend/src/config/index.ts).
// Keep them in sync — they identify the canonical Circle USDC/EURC assets.
export const NETWORK_CONFIGS: Record<StellarNetwork, NetworkEndpoints> = {
  testnet: {
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    usdcIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    eurcIssuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  },
  mainnet: {
    horizonUrl: 'https://horizon.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    usdcIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    eurcIssuer: 'GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
  },
};

export function resolveNetwork(): StellarNetwork {
  const env = (import.meta.env.VITE_STELLAR_NETWORK || '').toLowerCase();
  if (env === 'testnet' || env === 'mainnet') return env;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (
      host === 'testnet' ||
      host.startsWith('testnet.') ||
      host === 'test' ||
      host.startsWith('test.')
    ) {
      return 'testnet';
    }
  }

  return 'mainnet';
}

export const RESOLVED_NETWORK: StellarNetwork = resolveNetwork();
export const RESOLVED_NETWORK_CONFIG: NetworkEndpoints = NETWORK_CONFIGS[RESOLVED_NETWORK];

/** Canonical issuer for a known asset code on the given network, or null. */
export function getKnownAssetIssuer(
  code: string,
  network: StellarNetwork = RESOLVED_NETWORK
): string | null {
  const cfg = NETWORK_CONFIGS[network];
  if (code === 'USDC') return cfg.usdcIssuer;
  if (code === 'EURC') return cfg.eurcIssuer;
  return null;
}
