import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  FilePlus2,
  KeyRound,
  LayoutDashboard,
  Receipt,
} from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import WalletConnect from './Wallet/WalletConnect';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import NetworkToggle from './NetworkToggle';
import BrandMark from './BrandMark';
import BrandWordmark from './BrandWordmark';
import { useI18n } from '../i18n/I18nProvider';

export default function Layout() {
  const location = useLocation();
  const { connected, publicKey } = useWalletStore();
  const { t } = useI18n();

  const navItems = [
    { path: '/dashboard', label: t('layout.nav.dashboard'), icon: LayoutDashboard },
    { path: '/dashboard/transactions', label: t('layout.nav.transactions'), icon: ArrowLeftRight },
    { path: '/dashboard/links', label: t('layout.nav.invoices'), icon: Receipt },
    { path: '/dashboard/api-keys', label: t('layout.nav.apiKeys'), icon: KeyRound },
    { path: '/dashboard/analytics', label: t('layout.nav.analytics'), icon: BarChart3 },
    { path: '/dashboard/create-link', label: t('layout.nav.createInvoice'), icon: FilePlus2 },
  ];

  const isActivePath = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const profileInitial = (publicKey?.[0] || 'L').toUpperCase();

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:fixed md:z-10 md:flex md:h-full md:w-64 md:flex-col">
        <div className="border-b border-sidebar-border px-6 py-5">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2">
              <BrandMark className="h-9 w-9 rounded-lg" />
              <BrandWordmark className="text-lg font-semibold leading-snug" />
            </Link>
            <span className="mt-1 block text-[10px] uppercase tracking-wider text-muted-foreground">
              {t('layout.invoicePlatform')}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);
              const Icon = item.icon;

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
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

      </aside>

      <main className="flex-1 md:ml-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6 md:px-8">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {connected && publicKey && (
                <div className="flex items-center gap-2 rounded-full border border-surface-3 bg-surface-1 px-2 py-1">
                  <span className="hidden font-mono text-xs text-ink-2 min-[420px]:inline">
                    {shortenAddress(publicKey)}
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {profileInitial}
                  </span>
                </div>
              )}
              <NetworkToggle compact />
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
              const Icon = item.icon;

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
                  <span className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
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
