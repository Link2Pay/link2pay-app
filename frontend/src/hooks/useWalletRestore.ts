import { useEffect, useRef } from 'react';
import { useWalletStore } from '../store/walletStore';

/**
 * Hook to restore wallet connection on app initialization
 * Only runs once when the app first loads
 */
export function useWalletRestore() {
  const restoreConnection = useWalletStore((state) => state.restoreConnection);
  const hasRestoredRef = useRef(false);

  useEffect(() => {
    if (!hasRestoredRef.current) {
      hasRestoredRef.current = true;
      restoreConnection();
    }
  }, [restoreConnection]);
}
