import { useEffect, useRef } from 'react';
import { useWalletStore } from '../store/walletStore';

function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;

  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (typeof nav.userAgentData?.mobile === 'boolean') {
    return nav.userAgentData.mobile;
  }

  const userAgent = navigator.userAgent || '';
  const coarsePointer = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent) || Boolean(coarsePointer);
}

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
      // Mobile checkout should rely on SEP-7 app handoff, not extension restore.
      if (isLikelyMobileDevice()) return;
      restoreConnection();
    }
  }, [restoreConnection]);
}
