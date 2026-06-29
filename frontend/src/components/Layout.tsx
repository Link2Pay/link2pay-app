import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  FilePlus2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Receipt,
  UserCircle2,
} from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import WalletConnect from './Wallet/WalletConnect';
import PrivyLogin from './Auth/PrivyLogin';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import NetworkToggle from './NetworkToggle';
import BrandMark from './BrandMark';
import BrandWordmark from './BrandWordmark';
import { useI18n } from '../i18n/I18nProvider';
import { config } from '../config';

export default function Layout() {
  const location = useLocation();
  const { connected, publicKey, privyLoading, disconnect } = useWalletStore();
  const { network } = useNetworkStore();
  const { t } = useI18n();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setAccountMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (!accountMenuRef.current?.contains(e.target as Node)) setAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [accountMenuOpen]);

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

        <nav aria-label="Main navigation" className="flex-1 px-3 py-4">
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
                  <Icon aria-hidden="true" className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div ref={accountMenuRef} className="relative border-t border-sidebar-border px-4 py-4">
          {accountMenuOpen && (
            <div className="absolute bottom-full left-4 right-4 z-40 mb-2 overflow-hidden rounded-2xl border border-surface-3 bg-surface-1 shadow-[0_18px_40px_hsl(var(--background)_/_0.55)]">
              <div className="flex items-center gap-2.5 px-3 pt-3 pb-3 border-b border-surface-3">
                <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {profileInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {publicKey ? shortenAddress(publicKey) : 'Link2Pay User'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${network === 'testnet' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {network === 'testnet' ? 'Testnet' : 'Mainnet'}
                  </p>
                </div>
              </div>

              <div className="space-y-0.5 px-1.5 py-2">
                <Link
                  to="/dashboard/profile-options"
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                >
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  Profile
                </Link>
              </div>

              <div className="border-t border-surface-3 px-1.5 py-2">
                <button
                  onClick={() => { setAccountMenuOpen(false); disconnect(); }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Disconnect
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAccountMenuOpen((o) => !o)}
            className="w-full rounded-xl border border-surface-3 bg-surface-1 p-2.5 text-left transition-colors hover:bg-sidebar-accent"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {profileInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {publicKey ? shortenAddress(publicKey) : 'Link2Pay User'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {connected ? 'Connected' : 'Not connected'}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>
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
              {config.privyAppId ? <PrivyLogin /> : <WalletConnect />}
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-background/70 px-3 py-2 backdrop-blur md:hidden">
          <nav aria-label="Mobile navigation" className="flex items-center gap-1 overflow-x-auto">
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
                    <Icon aria-hidden="true" className="h-3.5 w-3.5" />
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
          ) : privyLoading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          ) : (
            <Navigate to="/login" replace />
          )}
        </div>
      </main>
    </div>
  );
}
