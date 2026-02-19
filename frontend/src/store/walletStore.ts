import { create } from 'zustand';
import { config } from '../config';

type AppLanguage = 'en' | 'es' | 'pt';

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

const LANGUAGE_STORAGE_KEY = 'link2pay-language';

const isAppLanguage = (value: string | null): value is AppLanguage =>
  value === 'en' || value === 'es' || value === 'pt';

const getActiveLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isAppLanguage(stored) ? stored : 'en';
};

const MESSAGES: Record<
  AppLanguage,
  {
    freighterNotDetected: string;
    publicKeyMissing: string;
    failedConnectWallet: string;
    walletNotConnected: string;
    unexpectedFreighterResponse: string;
    signTransactionUnavailable: string;
    signTransactionFailed: string;
  }
> = {
  en: {
    freighterNotDetected: 'Freighter wallet not detected. Please install the Freighter browser extension.',
    publicKeyMissing: 'Could not get public key. Please unlock Freighter and try again.',
    failedConnectWallet: 'Failed to connect wallet',
    walletNotConnected: 'Wallet not connected',
    unexpectedFreighterResponse: 'Unexpected response from Freighter',
    signTransactionUnavailable: 'Freighter signTransaction not available',
    signTransactionFailed: 'Transaction signing failed',
  },
  es: {
    freighterNotDetected: 'No se detecto Freighter. Instala la extension de Freighter en tu navegador.',
    publicKeyMissing: 'No se pudo obtener la clave publica. Desbloquea Freighter e intenta de nuevo.',
    failedConnectWallet: 'No se pudo conectar la wallet',
    walletNotConnected: 'Wallet no conectada',
    unexpectedFreighterResponse: 'Respuesta inesperada de Freighter',
    signTransactionUnavailable: 'Freighter signTransaction no esta disponible',
    signTransactionFailed: 'Fallo al firmar la transaccion',
  },
  pt: {
    freighterNotDetected: 'Freighter nao foi detectado. Instale a extensao Freighter no navegador.',
    publicKeyMissing: 'Nao foi possivel obter a chave publica. Desbloqueie o Freighter e tente novamente.',
    failedConnectWallet: 'Falha ao conectar a wallet',
    walletNotConnected: 'Wallet nao conectada',
    unexpectedFreighterResponse: 'Resposta inesperada do Freighter',
    signTransactionUnavailable: 'Freighter signTransaction nao esta disponivel',
    signTransactionFailed: 'Falha ao assinar a transacao',
  },
};

const getMessage = (key: keyof (typeof MESSAGES)['en']) => {
  const language = getActiveLanguage();
  return MESSAGES[language][key];
};

export const useWalletStore = create<WalletState>((set, get) => ({
  connected: false,
  publicKey: null,
  isConnecting: false,
  error: null,

  connect: async () => {
    set({ isConnecting: true, error: null });
    try {
      const freighter = await import('@stellar/freighter-api');

      // Check if Freighter is installed
      const isConnected = await freighter.isConnected();
      if (!isConnected) {
        throw new Error(getMessage('freighterNotDetected'));
      }

      // Request access first (this triggers the Freighter popup)
      const f = freighter as any;

      if (f.requestAccess) {
        await f.requestAccess();
      }

      // Get the public key - try the new API first, fall back to legacy
      let publicKey: string | null = null;

      if (f.getAddress) {
        // New API (Freighter v5+)
        const addressResult = await f.getAddress();
        if (addressResult && typeof addressResult === 'object' && 'address' in addressResult) {
          publicKey = addressResult.address;
        } else if (typeof addressResult === 'string') {
          publicKey = addressResult;
        }
      }

      if (!publicKey && f.getPublicKey) {
        // Legacy API (Freighter v2)
        publicKey = await f.getPublicKey();
      }

      if (!publicKey) {
        throw new Error(getMessage('publicKeyMissing'));
      }

      set({
        connected: true,
        publicKey,
        isConnecting: false,
        error: null,
      });
    } catch (error: any) {
      const message = error?.message || getMessage('failedConnectWallet');
      set({
        connected: false,
        publicKey: null,
        isConnecting: false,
        error: message,
      });
      throw error;
    }
  },

  disconnect: () => {
    set({
      connected: false,
      publicKey: null,
      isConnecting: false,
      error: null,
    });
  },

  signTransaction: async (xdr: string) => {
    const state = get();
    if (!state.connected) {
      throw new Error(getMessage('walletNotConnected'));
    }

    try {
      const freighter = await import('@stellar/freighter-api');

      let signedXdr: string;

      if (freighter.signTransaction) {
        const result = await freighter.signTransaction(xdr, {
          networkPassphrase: config.networkPassphrase,
        });
        // New API returns an object, legacy returns a string
        if (typeof result === 'string') {
          signedXdr = result;
        } else if (result && typeof result === 'object' && 'signedTxXdr' in result) {
          signedXdr = (result as any).signedTxXdr;
        } else {
          throw new Error(getMessage('unexpectedFreighterResponse'));
        }
      } else {
        throw new Error(getMessage('signTransactionUnavailable'));
      }

      return signedXdr;
    } catch (error: any) {
      throw new Error(error.message || getMessage('signTransactionFailed'));
    }
  },
}));


