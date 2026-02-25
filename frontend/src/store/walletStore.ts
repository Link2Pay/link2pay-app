import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useNetworkStore } from './networkStore';
import { clearAuthToken } from '../services/auth';

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
  /** Get the current network from Freighter wallet */
  getFreighterNetwork: () => Promise<string | null>;
}

const LANGUAGE_STORAGE_KEY = 'link2pay-language';
const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

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
    siteNotConnected: string;
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
    siteNotConnected: 'This site is not connected to Freighter. Open Freighter and allow access, then try again.',
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
    siteNotConnected: 'Este sitio no esta conectado a Freighter. Abre Freighter y permite el acceso, luego intenta de nuevo.',
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
    siteNotConnected: 'Este site nao esta conectado ao Freighter. Abra o Freighter e permita o acesso, depois tente novamente.',
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

function normalizeFreighterNetwork(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === 'object' && value !== null && 'networkPassphrase' in value) {
    return normalizeFreighterNetwork((value as { networkPassphrase?: unknown }).networkPassphrase);
  }

  if (typeof value !== 'string') return null;

  const raw = value.trim();
  if (!raw) return null;

  if (raw === TESTNET_PASSPHRASE || raw.toUpperCase() === 'TESTNET') {
    return TESTNET_PASSPHRASE;
  }

  if (
    raw === MAINNET_PASSPHRASE ||
    raw.toUpperCase() === 'PUBLIC' ||
    raw.toUpperCase() === 'MAINNET'
  ) {
    return MAINNET_PASSPHRASE;
  }

  return null;
}

function extractFreighterAddress(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return /^G[A-Z2-7]{55}$/.test(trimmed) ? trimmed : null;
  }

  if (typeof value === 'object' && value !== null && 'address' in value) {
    const address = (value as { address?: unknown }).address;
    return typeof address === 'string' && /^G[A-Z2-7]{55}$/.test(address)
      ? address
      : null;
  }

  return null;
}

async function isFreighterInstalled(f: any): Promise<boolean> {
  if (typeof f.isConnected !== 'function') return true;
  try {
    return Boolean(await f.isConnected());
  } catch {
    return false;
  }
}

async function hasFreighterSiteAccess(f: any): Promise<boolean> {
  const installed = await isFreighterInstalled(f);
  if (!installed) return false;

  if (typeof f.isAllowed !== 'function') {
    return true;
  }

  try {
    return Boolean(await f.isAllowed());
  } catch {
    return false;
  }
}

async function ensureFreighterSiteAccess(f: any): Promise<void> {
  const installed = await isFreighterInstalled(f);
  if (!installed) {
    throw new Error(getMessage('freighterNotDetected'));
  }

  if (typeof f.isAllowed === 'function') {
    const alreadyAllowed = await hasFreighterSiteAccess(f);
    if (alreadyAllowed) return;

    if (typeof f.setAllowed === 'function') {
      try {
        const granted = await f.setAllowed();
        if (granted) return;
      } catch {
        // Fall through to requestAccess
      }
    }

    if (typeof f.requestAccess === 'function') {
      await f.requestAccess();
    }

    const allowedAfterPrompt = await hasFreighterSiteAccess(f);
    if (!allowedAfterPrompt) {
      throw new Error(getMessage('siteNotConnected'));
    }
    return;
  }

  if (typeof f.requestAccess === 'function') {
    await f.requestAccess();
  }
}

async function getFreighterPublicKey(f: any): Promise<string | null> {
  if (typeof f.getAddress === 'function') {
    const addressResult = await f.getAddress();
    const parsed = extractFreighterAddress(addressResult);
    if (parsed) return parsed;
  }

  if (typeof f.getPublicKey === 'function') {
    const publicKeyResult = await f.getPublicKey();
    const parsed = extractFreighterAddress(publicKeyResult);
    if (parsed) return parsed;
    if (typeof publicKeyResult === 'string' && /^G[A-Z2-7]{55}$/.test(publicKeyResult)) {
      return publicKeyResult;
    }
  }

  return null;
}

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

          // Restore only when this site still has access in Freighter.
          const hasAccess = await hasFreighterSiteAccess(f);
          if (!hasAccess) {
            // Freighter not available, clear stored state
            set({ publicKey: null, connected: false });
            return;
          }

          const currentPublicKey = await getFreighterPublicKey(f);

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
      const f = freighter as any;

      await ensureFreighterSiteAccess(f);
      const publicKey = await getFreighterPublicKey(f);

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
    clearAuthToken();
    set({
      connected: false,
      publicKey: null,
      isConnecting: false,
      error: null,
    });
  },

  signMessage: async (message: string) => {
    if (!get().connected || !get().publicKey) {
      await get().connect();
    }

    if (!get().connected || !get().publicKey) {
      throw new Error(getMessage('walletNotConnected'));
    }

    try {
      const freighter = await import('@stellar/freighter-api');
      const f = freighter as any;
      await ensureFreighterSiteAccess(f);

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
    if (!get().connected || !get().publicKey) {
      await get().connect();
    }

    if (!get().connected || !get().publicKey) {
      throw new Error(getMessage('walletNotConnected'));
    }

    try {
      const freighter = await import('@stellar/freighter-api');
      await ensureFreighterSiteAccess(freighter as any);

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

  getFreighterNetwork: async () => {
    try {
      const freighter = await import('@stellar/freighter-api');
      const f = freighter as any;

      if (f.getNetworkDetails) {
        const networkDetails = await f.getNetworkDetails();
        const normalized = normalizeFreighterNetwork(networkDetails);
        if (normalized) {
          return normalized;
        }
      }

      if (f.getNetwork) {
        const network = await f.getNetwork();
        const normalized = normalizeFreighterNetwork(network);
        if (normalized) {
          return normalized;
        }
      }

      return null;
    } catch (error: any) {
      console.error('[WalletStore] Failed to get Freighter network:', error);
      return null;
    }
  },
}),
    {
      name: 'link2pay-wallet-storage',
      partialize: (state) => ({
        publicKey: state.publicKey,
      }),
    }
  )
);


