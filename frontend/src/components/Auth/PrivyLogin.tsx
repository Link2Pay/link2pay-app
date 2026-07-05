import { usePrivy } from '@privy-io/react-auth';

/**
 * Sign in / sign out button. The actual wallet-store sync lives in
 * PrivyWalletBridge (mounted once, globally) so it keeps working regardless
 * of which page is rendered — see that file for why.
 */
export default function PrivyLogin({ variant = 'compact' }: { variant?: 'compact' | 'large' }) {
  const { authenticated, login, logout, ready } = usePrivy();

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
