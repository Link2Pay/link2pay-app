/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_API_URL: string;
  readonly VITE_STELLAR_NETWORK: string;
  readonly VITE_HORIZON_URL: string;
  readonly VITE_NETWORK_PASSPHRASE: string;
  readonly VITE_ACCESLY_APP_ID: string;
  readonly VITE_PLAN_TIER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
