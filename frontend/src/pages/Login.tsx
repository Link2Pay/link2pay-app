import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { ShieldCheck, Zap, CircleDollarSign } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import PrivyLogin from '../components/Auth/PrivyLogin';
import BrandMark from '../components/BrandMark';
import BrandWordmark from '../components/BrandWordmark';
import LanguageToggle from '../components/LanguageToggle';
import ThemeToggle from '../components/ThemeToggle';
import { config } from '../config';
import { useI18n } from '../i18n/I18nProvider';
import WalletConnect from '../components/Wallet/WalletConnect';

export default function Login() {
  const navigate = useNavigate();
  const { connected } = useWalletStore();
  const { t } = useI18n();

  // If Privy is configured, also watch Privy auth state
  const privyEnabled = Boolean(config.privyAppId);

  // For non-Privy fallback
  useEffect(() => {
    if (connected) navigate('/dashboard', { replace: true });
  }, [connected, navigate]);

  const trust = [
    { icon: ShieldCheck, label: t('login.trustNonCustodial') },
    { icon: Zap, label: t('login.trustFast') },
    { icon: CircleDollarSign, label: t('login.trustFees') },
  ];

  return (
    <div className="gradient-bg relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="h-14 w-14 rounded-2xl" />
          <BrandWordmark className="text-2xl font-semibold" />
          <p className="text-sm text-muted-foreground">{t('login.tagline')}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <h1 className="mb-1 text-center text-lg font-semibold text-foreground">
            {t('login.title')}
          </h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {t('login.subtitle')}
          </p>

          <div className="flex flex-col items-center gap-3">
            {privyEnabled ? (
              <PrivyLoginRedirect />
            ) : (
              <WalletConnect variant="large" />
            )}
          </div>

          {/* Trust signals */}
          <div className="mt-6 flex items-center justify-center gap-4 border-t border-border pt-5">
            {trust.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon aria-hidden="true" className="h-3.5 w-3.5 text-success" />
                {label}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">{t('login.footer')}</p>
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
