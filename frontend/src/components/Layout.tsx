import { Link, Outlet, useLocation } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import WalletConnect from './Wallet/WalletConnect';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useI18n } from '../i18n/I18nProvider';

export default function Layout() {
  const location = useLocation();
  const { connected } = useWalletStore();
  const { t } = useI18n();

  const navItems = [
    { path: '/dashboard', label: t('layout.nav.dashboard'), icon: 'D' },
    { path: '/dashboard/clients', label: t('layout.nav.clients'), icon: 'C' },
    { path: '/dashboard/invoices', label: t('layout.nav.invoices'), icon: 'I' },
    { path: '/dashboard/create', label: t('layout.nav.createInvoice'), icon: '+' },
  ];

  const isActivePath = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:fixed md:z-10 md:flex md:h-full md:w-64 md:flex-col">
        <div className="border-b border-sidebar-border px-6 py-5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">S</span>
            </div>
            <div>
              <h1 className="leading-none text-base font-semibold text-foreground">Link2Pay</h1>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('layout.invoicePlatform')}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sidebar-accent text-primary'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  }`}
                >
                  <span className={`text-base ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            {t('layout.stellarTestnet')}
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 md:px-8">
            <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {t('layout.backToSite')}
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <LanguageToggle />
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-background/70 px-3 py-2 backdrop-blur md:hidden">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-8">
          {connected ? (
            <Outlet />
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="max-w-md text-center animate-in">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="text-3xl text-primary">S</span>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  {t('layout.connectWalletTitle')}
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  {t('layout.connectWalletDescription')}
                </p>
                <WalletConnect variant="large" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
