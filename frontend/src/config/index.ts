import { RESOLVED_NETWORK, RESOLVED_NETWORK_CONFIG } from './network';

export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'Link2Pay',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  // Network is deployment-fixed (mainnet on the primary domain, testnet on the
  // `testnet.*` subdomain). See src/config/network.ts for resolution.
  stellarNetwork: RESOLVED_NETWORK,
  networkPassphrase:
    import.meta.env.VITE_NETWORK_PASSPHRASE ||
    RESOLVED_NETWORK_CONFIG.networkPassphrase,
  // Phase 5: let payers pay a non-USDC asset (routed to USDC via the DEX).
  enablePathPayments: import.meta.env.VITE_ENABLE_PATH_PAYMENTS === 'true',
  // Phase 6: offer multi-wallet connect (Stellar Wallets Kit) on the payer flow.
  enableWalletsKit: import.meta.env.VITE_ENABLE_WALLETS_KIT !== 'false',
  // Phase 7: live Reflector oracle FX estimate. Off by default — no public
  // testnet oracle carries COP, so it only shows when a feed actually has it.
  enableFxPreview: import.meta.env.VITE_ENABLE_FX_PREVIEW === 'true',
  // Fiat (Bre-B) payouts are a mainnet capability: on testnet the anchor is
  // simulated, so the test environment walls fiat off (backend enforces the
  // same via FIAT_ENABLED). Override with VITE_ENABLE_FIAT=true for local
  // off-ramp development.
  fiatRailsEnabled:
    import.meta.env.VITE_ENABLE_FIAT === 'true'
      ? true
      : import.meta.env.VITE_ENABLE_FIAT === 'false'
        ? false
        : RESOLVED_NETWORK === 'mainnet',
  // Mandatory profile completion after signup is a mainnet (real merchant)
  // requirement — testnet stays frictionless for testing. Override with
  // VITE_REQUIRE_PROFILE=true for local gate development.
  requireProfileCompletion:
    import.meta.env.VITE_REQUIRE_PROFILE === 'true'
      ? true
      : import.meta.env.VITE_REQUIRE_PROFILE === 'false'
        ? false
        : RESOLVED_NETWORK === 'mainnet',
  // WalletConnect (Reown) project ID — enables the WalletConnect option in
  // the payer wallet roller on MOBILE browsers only (desktop already has the
  // extensions). Unset → the WalletConnect card simply doesn't appear.
  // Get one at https://dashboard.reown.com
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  // Privy social login (Google/email → Stellar embedded wallet).
  // When set, replaces the Freighter connect button in the dashboard header.
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID || '',
  // Client ID of the Privy "app client" whose allowed origins include this
  // deployment's domain (e.g. localhost for dev). Required alongside appId
  // once the app has more than one app client configured in the dashboard.
  privyClientId: import.meta.env.VITE_PRIVY_CLIENT_ID || '',
} as const;

export const CURRENCY_LABELS: Record<string, string> = {
  XLM: 'Stellar Lumens (XLM)',
  USDC: 'USD Coin (USDC)',
  EURC: 'Euro Coin (EURC)',
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  XLM: 'XLM',
  USDC: '$',
  EURC: '€',
};
