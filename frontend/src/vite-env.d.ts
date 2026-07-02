/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_API_URL: string;
  readonly VITE_STELLAR_NETWORK: string;
  readonly VITE_NETWORK_PASSPHRASE: string;
  readonly VITE_PRIVY_APP_ID: string;
  readonly VITE_ENABLE_PATH_PAYMENTS: string;
  readonly VITE_ENABLE_WALLETS_KIT: string;
  readonly VITE_ENABLE_FX_PREVIEW: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
