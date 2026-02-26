import { useAccesly } from 'accesly';
import { useWalletStore } from '../store/walletStore';

/**
 * Returns the active wallet address for the currently authenticated session.
 *
 * Freighter address is returned only when Freighter is actively connected
 * (connected = true). walletStore persists publicKey to localStorage but NOT
 * connected, so after a page reload the publicKey may be non-null while
 * connected is false. Using a stale publicKey as the wallet address while
 * Accesly handles auth would send the wrong source account to sign, causing
 * the backend signature verification to fail with 401.
 */
export function useActiveAddress(): string | null {
  const { connected, publicKey } = useWalletStore();
  const { wallet: acceslyWallet } = useAccesly();
  if (connected && publicKey) return publicKey;
  return acceslyWallet?.stellarAddress ?? null;
}
