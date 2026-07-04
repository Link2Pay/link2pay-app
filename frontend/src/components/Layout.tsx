import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Receipt,
  UserCircle2,
  Users,
  Wallet,
} from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import PrivyDisconnectButton from './Auth/PrivyDisconnectButton';
import ThemeToggle from './ThemeToggle';
import BrandMark from './BrandMark';
import BrandWordmark from './BrandWordmark';
import MobileNavDrawer from './MobileNavDrawer';
import { useI18n } from '../i18n/I18nProvider';
import { config, CURRENCY_SYMBOLS } from '../config';
import { shortenAddress } from '../lib/format';
import { useWalletBalances } from '../hooks/useWalletBalances';

const KNOWN_ASSET_ORDER = ['XLM', 'USDC', 'EURC'];

function sortBalances<T extends { code: string }>(balances: T[]): T[] {
  return [...balances].sort((a, b) => {
    const aIndex = KNOWN_ASSET_ORDER.indexOf(a.code);
    const bIndex = KNOWN_ASSET_ORDER.indexOf(b.code);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? KNOWN_ASSET_ORDER.length : aIndex) -
        (bIndex === -1 ? KNOWN_ASSET_ORDER.length : bIndex);
    }
    return a.code.localeCompare(b.code);
  });
}

function formatBalance(raw: string, code: string): string {
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return raw;
  const formatted = value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  const symbol = CURRENCY_SYMBOLS[code] || code;
  return code === 'XLM' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

export default function Layout() {
  const location = useLocation();
  const { connected, publicKey, privyLoading, disconnect } = useWalletStore();
  const { network } = useNetworkStore();
  const { t } = useI18n();
  const { balances, loading: balancesLoading, error: balancesError, refresh: refreshBalances } = useWalletBalances();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setAccountMenuOpen(false);
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Refresh the balance each time the account panel opens rather than
  // relying on the fetch from page load, which can go stale.
  useEffect(() => {
    if (accountMenuOpen) refreshBalances();
  }, [accountMenuOpen, refreshBalances]);

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
    { path: '/dashboard/links', label: t('layout.nav.invoices'), icon: Receipt },
    { path: '/dashboard/get-paid', label: t('layout.nav.getPaid'), icon: QrCode },
    { path: '/dashboard/wallet', label: t('layout.nav.wallet'), icon: Wallet },
    { path: '/dashboard/clients', label: t('layout.nav.contacts'), icon: Users },
    { path: '/dashboard/transactions', label: t('layout.nav.transactions'), icon: ArrowLeftRight },
    { path: '/dashboard/analytics', label: t('layout.nav.analytics'), icon: BarChart3 },
  ];

  const isActivePath = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

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
            <span className="mt-1 block text-3xs uppercase tracking-wider text-sidebar-muted">
              {t('layout.invoicePlatform')}
            </span>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex-1 py-4">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-3 rounded-r-xl py-2 pl-6 pr-3 mr-3 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-bold'
                      : 'text-sidebar-foreground font-medium hover:bg-sidebar-accent'
                  }`}
                >
                  {/* Icono en círculo: invertido (bg-white/15) cuando activo, neutro si no. */}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isActive ? 'bg-white/15' : 'bg-muted'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div ref={accountMenuRef} className="relative border-t border-sidebar-border px-4 py-4">
          {accountMenuOpen && (
            <div
              id="account-menu"
              role="menu"
              className="absolute bottom-full left-4 right-4 z-40 mb-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-overlay"
            >
              <div className="flex items-center gap-2.5 px-3 pt-3 pb-3 border-b border-surface-3">
                <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {profileInitial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {publicKey ? shortenAddress(publicKey) : t('layout.defaultUser')}
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${network === 'testnet' ? 'text-warning' : 'text-success'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${network === 'testnet' ? 'bg-warning' : 'bg-success'}`} />
                    {network === 'testnet' ? 'Testnet' : 'Mainnet'}
                  </p>
                </div>
              </div>

              <div className="px-3 py-3 border-b border-surface-3">
                <p className="mb-1.5 text-3xs uppercase tracking-wider text-muted-foreground">{t('layout.balance')}</p>
                {balancesLoading ? (
                  <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
                ) : balancesError ? (
                  <p className="text-xs text-muted-foreground">{t('layout.balanceUnavailable')}</p>
                ) : balances.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('layout.noBalance')}</p>
                ) : (
                  <div className="space-y-1">
                    {sortBalances(balances).map((b) => (
                      <div key={b.asset} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-foreground">{formatBalance(b.balance, b.code)}</span>
                        <span className="text-3xs text-muted-foreground">{b.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-0.5 px-1.5 py-2">
                <Link
                  to="/dashboard/profile-options"
                  role="menuitem"
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                >
                  <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                  {t('layout.profile')}
                </Link>
                <ThemeToggle variant="menuItem" />
              </div>

              <div className="border-t border-surface-3 px-1.5 py-2">
                {config.privyAppId ? (
                  <PrivyDisconnectButton
                    onBefore={() => setAccountMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    {t('layout.disconnect')}
                  </PrivyDisconnectButton>
                ) : (
                  <button
                    role="menuitem"
                    onClick={() => { setAccountMenuOpen(false); disconnect(); }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    {t('layout.disconnect')}
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAccountMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            aria-controls="account-menu"
            aria-label={t('layout.accountMenu')}
            className="w-full rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-2.5 text-left transition-colors hover:bg-sidebar-accent"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-success/15 font-mono text-xs font-semibold text-success">
                {profileInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-semibold tracking-tight text-sidebar-foreground">
                  {publicKey ? shortenAddress(publicKey) : t('layout.defaultUser')}
                </p>
                <p className="flex items-center gap-1.5 truncate text-xs text-sidebar-muted">
                  {connected && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />}
                  {connected ? t('layout.connected') : t('layout.notConnected')}
                </p>
              </div>
              <ChevronDown className={`h-4 w-4 flex-shrink-0 text-sidebar-muted transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">
        {/* Header solo en móvil: marca + hamburguesa. En desktop no hay navbar —
            tema, idioma y Desconectar viven en el desplegable de cuenta del sidebar. */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
            <Link to="/dashboard" className="inline-flex items-center gap-2">
              <BrandMark className="h-8 w-8 rounded-lg" />
              <BrandWordmark className="text-base font-semibold leading-snug" />
            </Link>
            <button
              ref={mobileNavTriggerRef}
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label={t('layout.menu.open')}
              aria-haspopup="dialog"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav-drawer"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <MobileNavDrawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          items={navItems.map((item) => ({ ...item, end: item.path === '/dashboard' }))}
          triggerRef={mobileNavTriggerRef}
          footer={
            <div className="space-y-3">
              {/* Móvil no tiene el desplegable de cuenta del sidebar: el enlace a
                  Perfil da acceso a idioma y Desconectar. */}
              <Link
                to="/dashboard/profile-options"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <UserCircle2 aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                {t('layout.profile')}
              </Link>
              <ThemeToggle />
            </div>
          }
        />

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
