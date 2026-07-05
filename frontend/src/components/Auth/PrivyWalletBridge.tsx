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

/**
 * Keeps the wallet store in sync with Privy's auth state for the lifetime of
 * the app — not just while a login button happens to be mounted. Without
 * this living somewhere route-independent, logging out from a dashboard page
 * (where PrivyLogin isn't rendered) flips Privy's `authenticated` to false
 * but never reaches the wallet store, so `connected` stays true and the UI
 * never reflects the sign-out.
 */
export default function PrivyWalletBridge() {
  const { authenticated, user, getAccessToken } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();

  const { setExternalWallet, clearExternalWallet, setPrivyLoading, connected, setPrivyGetToken } = useWalletStore();

  const signRef = useRef(signRawHash);
  useEffect(() => { signRef.current = signRawHash; }, [signRawHash]);

  const getAccessTokenRef = useRef(getAccessToken);
  useEffect(() => { getAccessTokenRef.current = getAccessToken; }, [getAccessToken]);

  const stellarAddress = getStellarAddress(user);

  // Signal to Layout that Privy is authenticated but wallet isn't bridged yet
  useEffect(() => {
    if (authenticated && !stellarAddress) {
      setPrivyLoading(true);
      createWallet({ chainType: 'stellar' } as any).catch(() => setPrivyLoading(false));
    }
  }, [authenticated, stellarAddress, createWallet, setPrivyLoading]);

  // Register/unregister the Privy token getter (used by auth.ts instead of nonce signing)
  useEffect(() => {
    if (authenticated) {
      const getter = () => getAccessTokenRef.current();
      setPrivyGetToken(getter);
    } else {
      setPrivyGetToken(null);
    }
  }, [authenticated, setPrivyGetToken]);

  // Bridge Stellar wallet <-> walletStore, both ways: connect once the
  // address is available, and clear it the moment Privy signs out.
  useEffect(() => {
    if (authenticated && stellarAddress) {
      const signer = buildPrivySigner(stellarAddress, (input) => signRef.current(input));
      setExternalWallet(stellarAddress, signer);
    } else if (!authenticated && connected) {
      clearExternalWallet();
    }
  }, [authenticated, stellarAddress, setExternalWallet, clearExternalWallet, connected]);

  return null;
}
