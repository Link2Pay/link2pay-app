import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNetworkStore } from './networkStore';

type AppLanguage = 'en' | 'es' | 'pt';

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, networkPassphrase?: string) => Promise<string>;
  /** Sign an arbitrary UTF-8 message (used for auth nonce). Returns hex signature. */
  signMessage: (message: string) => Promise<string>;
  /** Restore connection from persisted state */
  restoreConnection: () => Promise<void>;
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
    signMessageUnavailable: string;
    signMessageFailed: string;
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
    signMessageUnavailable: 'Freighter signMessage not available',
    signMessageFailed: 'Message signing failed',
  },
  es: {
    freighterNotDetected: 'No se detecto Freighter. Instala la extension de Freighter en tu navegador.',
    publicKeyMissing: 'No se pudo obtener la clave publica. Desbloquea Freighter e intenta de nuevo.',
    failedConnectWallet: 'No se pudo conectar la wallet',
    walletNotConnected: 'Wallet no conectada',
    unexpectedFreighterResponse: 'Respuesta inesperada de Freighter',
    signTransactionUnavailable: 'Freighter signTransaction no esta disponible',
    signTransactionFailed: 'Fallo al firmar la transaccion',
    signMessageUnavailable: 'Freighter signMessage no esta disponible',
    signMessageFailed: 'Fallo al firmar el mensaje',
  },
  pt: {
    freighterNotDetected: 'Freighter nao foi detectado. Instale a extensao Freighter no navegador.',
    publicKeyMissing: 'Nao foi possivel obter a chave publica. Desbloqueie o Freighter e tente novamente.',
    failedConnectWallet: 'Falha ao conectar a wallet',
    walletNotConnected: 'Wallet nao conectada',
    unexpectedFreighterResponse: 'Resposta inesperada do Freighter',
    signTransactionUnavailable: 'Freighter signTransaction nao esta disponivel',
    signTransactionFailed: 'Falha ao assinar a transacao',
    signMessageUnavailable: 'Freighter signMessage nao esta disponivel',
    signMessageFailed: 'Falha ao assinar a mensagem',
  },
};

const getMessage = (key: keyof (typeof MESSAGES)['en']) => {
  const language = getActiveLanguage();
  return MESSAGES[language][key];
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      connected: false,
      publicKey: null,
      isConnecting: false,
      error: null,

      restoreConnection: async () => {
        const state = get();
        // Only try to restore if we have a stored publicKey but are not currently connected
        if (!state.publicKey || state.connected) return;

        try {
          const freighter = await import('@stellar/freighter-api');
          const f = freighter as any;

          // Check if Freighter is still accessible
          const isConnected = await freighter.isConnected();
          if (!isConnected) {
            // Freighter not available, clear stored state
            set({ publicKey: null, connected: false });
            return;
          }

          // Try to get the current address from Freighter
          let currentPublicKey: string | null = null;

          if (f.getAddress) {
            const addressResult = await f.getAddress();
            if (addressResult && typeof addressResult === 'object' && 'address' in addressResult) {
              currentPublicKey = addressResult.address;
            } else if (typeof addressResult === 'string') {
              currentPublicKey = addressResult;
            }
          }

          if (!currentPublicKey && f.getPublicKey) {
            currentPublicKey = await f.getPublicKey();
          }

          // If the current Freighter account matches our stored one, restore the connection
          if (currentPublicKey === state.publicKey) {
            set({ connected: true, error: null });
          } else {
            // Account changed or not available, clear stored state
            set({ publicKey: null, connected: false });
          }
        } catch (error) {
          // Silent fail - user can reconnect manually
          set({ publicKey: null, connected: false });
        }
      },

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
    } finally {
      // Ensure isConnecting is always reset, even if state wasn't updated in catch
      // This handles edge cases where the promise rejects in unexpected ways
      const state = get();
      if (state.isConnecting && !state.connected) {
        set({ isConnecting: false });
      }
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

  signMessage: async (message: string) => {
    const state = get();
    if (!state.connected) {
      throw new Error(getMessage('walletNotConnected'));
    }

    try {
      const freighter = await import('@stellar/freighter-api');
      const f = freighter as any;

      // Freighter v5+ signMessage — signs arbitrary bytes, returns Uint8Array
      if (f.signMessage) {
        const messageBytes = new TextEncoder().encode(message);
        const result = await f.signMessage(messageBytes);

        let sigBytes: Uint8Array;
        if (result instanceof Uint8Array) {
          sigBytes = result;
        } else if (result && 'signature' in result) {
          sigBytes = result.signature as Uint8Array;
        } else {
          throw new Error(getMessage('unexpectedFreighterResponse'));
        }

        return Array.from(sigBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      }

      // Freighter v2 signBlob — takes a base64 string, returns the signature.
      // The return type varies by Freighter extension version:
      //   - Some versions return a binary string (each char = one signature byte)
      //   - Some versions return a serialized Node Buffer: {type:'Buffer', data: number[]}
      //   - Some versions return a Uint8Array
      if (freighter.signBlob) {
        const messageBase64 = btoa(
          String.fromCharCode(...new TextEncoder().encode(message))
        );
        const rawResult = await freighter.signBlob(messageBase64);
        const r = rawResult as any;

        let sigBytes: number[];

        if (r && r.type === 'Buffer' && Array.isArray(r.data)) {
          // Serialized Node.js Buffer object: {type: 'Buffer', data: [...]}
          sigBytes = r.data;
        } else if (r instanceof Uint8Array) {
          sigBytes = Array.from(r);
        } else if (typeof r === 'string') {
          // Binary string — each char code is one byte
          sigBytes = Array.from(r as string).map((c) => c.charCodeAt(0));
        } else {
          throw new Error(getMessage('unexpectedFreighterResponse'));
        }

        return sigBytes.map((b) => b.toString(16).padStart(2, '0')).join('');
      }

      throw new Error(getMessage('signMessageUnavailable'));
    } catch (error: any) {
      throw new Error(error.message || getMessage('signMessageFailed'));
    }
  },

  signTransaction: async (xdr: string, networkPassphraseOverride?: string) => {
    const state = get();
    if (!state.connected) {
      throw new Error(getMessage('walletNotConnected'));
    }

    try {
      const freighter = await import('@stellar/freighter-api');

      let signedXdr: string;

      if (freighter.signTransaction) {
        // Use provided networkPassphrase or fall back to the store value
        const networkPassphrase = networkPassphraseOverride || useNetworkStore.getState().networkPassphrase;
        console.log('[WalletStore] Signing transaction with networkPassphrase:', networkPassphrase);
        const result = await freighter.signTransaction(xdr, {
          networkPassphrase,
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
      console.error('[WalletStore] Transaction signing error:', error);
      throw new Error(error.message || getMessage('signTransactionFailed'));
    }
  },
}),
    {
      name: 'link2pay-wallet-storage',
      partialize: (state) => ({
        publicKey: state.publicKey,
        connected: state.connected,
      }),
    }
  )
);


