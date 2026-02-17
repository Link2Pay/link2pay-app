import { create } from 'zustand';
import { config } from '../config';

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string) => Promise<string>;
}

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
        throw new Error(
          'Freighter wallet not detected. Please install the Freighter browser extension.'
        );
      }

      // Request access first (this triggers the Freighter popup)
      const f = freighter as any;

      if (f.requestAccess) {
        await f.requestAccess();
      }

      // Get the public key — try the new API first, fall back to legacy
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
        throw new Error(
          'Could not get public key. Please unlock Freighter and try again.'
        );
      }

      set({
        connected: true,
        publicKey,
        isConnecting: false,
        error: null,
      });
    } catch (error: any) {
      const message = error?.message || 'Failed to connect wallet';
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
      throw new Error('Wallet not connected');
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
          throw new Error('Unexpected response from Freighter');
        }
      } else {
        throw new Error('Freighter signTransaction not available');
      }

      return signedXdr;
    } catch (error: any) {
      throw new Error(error.message || 'Transaction signing failed');
    }
  },
}));
