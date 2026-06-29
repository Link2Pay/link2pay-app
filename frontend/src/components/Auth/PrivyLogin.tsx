import { useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useCreateWallet, useSignRawHash } from '@privy-io/react-auth/extended-chains';
import { useWalletStore } from '../../store/walletStore';
import { buildPrivySigner } from '../../services/privy';

function getStellarAddress(user: any): string | null {
  const account = user?.linkedAccounts?.find(
    (a: any) => a.type === 'wallet' && a.chainType === 'stellar'
  );
  return account?.address ?? null;
}

export default function PrivyLogin({ variant = 'compact' }: { variant?: 'compact' | 'large' }) {
  const { authenticated, login, logout, ready, user } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();

  const { setExternalWallet, clearExternalWallet, setPrivyLoading, connected } = useWalletStore();

  const signRef = useRef(signRawHash);
  useEffect(() => { signRef.current = signRawHash; }, [signRawHash]);

  const stellarAddress = getStellarAddress(user);

  // Signal to Layout that Privy is authenticated but wallet isn't bridged yet
  useEffect(() => {
    if (authenticated && !stellarAddress) {
      setPrivyLoading(true);
      createWallet({ chainType: 'stellar' } as any).catch(() => setPrivyLoading(false));
    }
  }, [authenticated, stellarAddress, createWallet, setPrivyLoading]);

  // Bridge Stellar wallet → walletStore once address is available
  useEffect(() => {
    if (authenticated && stellarAddress) {
      const signer = buildPrivySigner(stellarAddress, (input) => signRef.current(input));
      setExternalWallet(stellarAddress, signer);
    } else if (!authenticated && connected) {
      clearExternalWallet();
    }
  }, [authenticated, stellarAddress, setExternalWallet, clearExternalWallet, connected]);

  if (!ready) return null;

  if (authenticated) {
    return (
      <button onClick={logout} className="btn-ghost px-2 py-1 text-xs">
        Sign out
      </button>
    );
  }

  if (variant === 'large') {
    return (
      <button onClick={() => login()} className="btn-primary px-6 py-3 text-base">
        Sign in / Register
      </button>
    );
  }

  return (
    <button onClick={() => login()} className="btn-primary text-xs sm:text-sm">
      Sign in / Register
    </button>
  );
}
