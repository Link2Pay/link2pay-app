import type { ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

/**
 * Disconnect action for Privy-authenticated sessions.
 *
 * A plain wallet-store `disconnect()` doesn't stick for Privy users: Privy stays
 * authenticated, so PrivyWalletBridge's bridge effect immediately re-connects the
 * embedded wallet. Logging out of Privy is the real teardown — its
 * `authenticated → false` transition is what clears the wallet store.
 *
 * Rendered only when Privy is configured, so `usePrivy()` is always inside the
 * provider.
 */
export default function PrivyDisconnectButton({
  onBefore,
  className,
  children,
}: {
  onBefore?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const { logout } = usePrivy();
  return (
    <button
      type="button"
      onClick={() => {
        onBefore?.();
        logout();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
