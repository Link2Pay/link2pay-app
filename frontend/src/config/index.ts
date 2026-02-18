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
