import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowRight, Globe2, Heart, Wallet, Zap } from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';
import ThemeToggle from '../ThemeToggle';
import LanguageToggle from '../LanguageToggle';
import { useI18n } from '../../i18n/I18nProvider';

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-3)}`;

export default function MarketingLayout() {
  const { connected, publicKey, isConnecting, connect, disconnect } = useWalletStore();
  const { t } = useI18n();

  const navItems = [
    { path: '/', label: t('marketing.nav.home'), end: true },
    { path: '/features', label: t('marketing.nav.features') },
    { path: '/pricing', label: t('marketing.nav.pricing') },
    { path: '/about', label: t('marketing.nav.about') },
  ];

  const footerProduct = [
    { label: t('marketing.nav.features'), to: '/features' },
    { label: t('marketing.nav.pricing'), to: '/pricing' },
    { label: t('marketing.dashboard'), to: '/get-started' },
  ];

  const footerCompany = [
    { label: t('marketing.nav.about'), to: '/about' },
    { label: t('marketing.terms'), to: '#' },
    { label: t('marketing.privacy'), to: '#' },
  ];

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      // Connection errors are already stored by walletStore.
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex min-h-16 items-center justify-between gap-3 py-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </span>
              <span className="text-base font-semibold text-foreground">Link2Pay</span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />

              <div className="hidden items-center gap-2 md:flex">
                {connected && publicKey && (
                  <span className="hidden items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-[11px] font-mono text-foreground sm:flex sm:text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {truncateAddress(publicKey)}
                  </span>
                )}

                {!connected ? (
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="btn-primary px-3 py-2 text-sm"
                  >
                    <Wallet className="h-4 w-4" />
                    {isConnecting ? t('marketing.connecting') : t('marketing.connectWallet')}
                  </button>
                ) : (
                  <button
                    onClick={disconnect}
                    className="btn-ghost px-3 py-2 text-sm"
                  >
                    {t('marketing.disconnect')}
                  </button>
                )}

                <Link to="/get-started" className="btn-secondary px-3 py-2 text-sm">
                  {t('marketing.dashboard')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-3 md:hidden">
            {!connected ? (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="btn-primary flex-1 px-3 py-2 text-xs"
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? t('marketing.connecting') : t('marketing.connectWallet')}
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="btn-ghost flex-1 px-3 py-2 text-xs"
              >
                {t('marketing.disconnect')}
              </button>
            )}

            <Link to="/get-started" className="btn-secondary px-3 py-2 text-xs">
              {t('marketing.dashboard')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto pb-3 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Zap className="h-4 w-4" />
                </span>
                <span className="font-semibold text-foreground">Link2Pay</span>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t('marketing.footerDescription')}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5" />
                <span>{t('marketing.availableWorldwide')}</span>
              </div>
            </div>

            {/* Product links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{t('marketing.product')}</h4>
              <ul className="space-y-2">
                {footerProduct.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{t('marketing.company')}</h4>
              <ul className="space-y-2">
                {footerCompany.map((item) =>
                  item.to.startsWith('/') ? (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <a
                        href={item.to}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {item.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {t('marketing.madeWith')} <Heart className="h-3 w-3 text-destructive" /> {t('marketing.forFreelancers')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('marketing.stellarTestnet')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
