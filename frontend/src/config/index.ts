export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'Link2Pay',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  stellarNetwork: import.meta.env.VITE_STELLAR_NETWORK || 'testnet',
  horizonUrl:
    import.meta.env.VITE_HORIZON_URL ||
    'https://horizon-testnet.stellar.org',
  networkPassphrase:
    import.meta.env.VITE_NETWORK_PASSPHRASE ||
    'Test SDF Network ; September 2015',
  // Phase 5: let payers pay a non-USDC asset (routed to USDC via the DEX).
  enablePathPayments: import.meta.env.VITE_ENABLE_PATH_PAYMENTS === 'true',
  // Phase 6: offer multi-wallet connect (Stellar Wallets Kit) on the payer flow.
  enableWalletsKit: import.meta.env.VITE_ENABLE_WALLETS_KIT !== 'false',
  // Phase 7: live Reflector oracle FX estimate. Off by default — no public
  // testnet oracle carries COP, so it only shows when a feed actually has it.
  enableFxPreview: import.meta.env.VITE_ENABLE_FX_PREVIEW === 'true',
  // Privy social login (Google/email → Stellar embedded wallet).
  // When set, replaces the Freighter connect button in the dashboard header.
  privyAppId: import.meta.env.VITE_PRIVY_APP_ID || '',
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
