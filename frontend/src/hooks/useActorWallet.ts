import { useWalletStore } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';

export function useActorWallet(): string | null {
  const publicKey = useWalletStore((state) => state.publicKey);
  const activeWallet = useAuthStore((state) => state.activeWallet);
  return publicKey || activeWallet;
}
