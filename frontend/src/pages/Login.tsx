import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useWalletStore } from '../store/walletStore';
import PrivyLogin from '../components/Auth/PrivyLogin';
import BrandMark from '../components/BrandMark';
import BrandWordmark from '../components/BrandWordmark';
import { config } from '../config';
import WalletConnect from '../components/Wallet/WalletConnect';

export default function Login() {
  const navigate = useNavigate();
  const { connected } = useWalletStore();

  // If Privy is configured, also watch Privy auth state
  const privyEnabled = Boolean(config.privyAppId);

  // For non-Privy fallback
  useEffect(() => {
    if (connected) navigate('/dashboard', { replace: true });
  }, [connected, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandMark className="h-14 w-14 rounded-2xl" />
          <BrandWordmark className="text-2xl font-semibold" />
          <p className="text-sm text-muted-foreground">Invoicing on Stellar</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-center text-lg font-semibold text-foreground">
            Sign in or create account
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            New users are registered automatically
          </p>

          <div className="flex flex-col items-center gap-3">
            {privyEnabled ? (
              <PrivyLoginRedirect />
            ) : (
              <WalletConnect variant="large" />
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Non-custodial · Powered by Stellar
        </p>
      </div>
    </div>
  );
}

/** Redirects to /dashboard once Privy is authenticated and the wallet bridge is ready. */
function PrivyLoginRedirect() {
  const { authenticated } = usePrivy();
  const { connected } = useWalletStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated && connected) {
      navigate('/dashboard', { replace: true });
    }
  }, [authenticated, connected, navigate]);

  return <PrivyLogin variant="large" />;
}
