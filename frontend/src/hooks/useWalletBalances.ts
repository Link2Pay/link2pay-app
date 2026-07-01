import { useCallback, useEffect, useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import { getWalletBalances, type WalletBalance } from '../services/api';

interface UseWalletBalancesResult {
  balances: WalletBalance[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches on-chain balances for the currently connected wallet (Freighter or
 * Privy embedded). Public ledger data — safe any time a wallet is connected.
 * Refetches when the address or active network changes.
 */
export function useWalletBalances(): UseWalletBalancesResult {
  const publicKey = useWalletStore((state) => state.publicKey);
  const connected = useWalletStore((state) => state.connected);
  const networkPassphrase = useNetworkStore((state) => state.networkPassphrase);

  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalances([]);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getWalletBalances(publicKey, networkPassphrase)
      .then((result) => {
        if (cancelled) return;
        setBalances(result.balances);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load balances');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connected, publicKey, networkPassphrase, refreshNonce]);

  const refresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

  return { balances, loading, error, refresh };
}
