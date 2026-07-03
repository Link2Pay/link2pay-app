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
import WalletConnect from './Wallet/WalletConnect';
import PrivyLogin from './Auth/PrivyLogin';
import PrivyDisconnectButton from './Auth/PrivyDisconnectButton';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
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

  // Desktop nav reads as a chart of accounts: pages grouped by what they do
  // for the business, laid out as stations on the settlement rail.
  const navGroups: { label: string | null; items: typeof navItems }[] = [
    { label: null, items: [navItems[0]] },
    { label: t('layout.group.collect'), items: [navItems[1], navItems[2]] },
    { label: t('layout.group.money'), items: [navItems[3], navItems[5]] },
    { label: t('layout.group.business'), items: [navItems[4], navItems[6]] },
  ];

  const isActivePath = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const profileInitial = (publicKey?.[0] || 'L').toUpperCase();

  return (
    <div className="min-h-screen md:flex">
      <aside className="relative hidden overflow-hidden border-r border-sidebar-border bg-sidebar md:fixed md:z-10 md:flex md:h-full md:w-64 md:flex-col">
        {/* The same atmosphere the marketing card wears: indigo breath where
            crypto enters (top), money-green where it lands (bottom, at the
            terminus), over a faint ledger grid. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-52 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--accent)_/_0.22),transparent_65%)]" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(var(--success)_/_0.14),transparent_68%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,_hsl(0_0%_100%_/_0.025)_1px,transparent_1px),linear-gradient(180deg,_hsl(0_0%_100%_/_0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
        </div>

        <div className="relative border-b border-sidebar-border px-6 py-5">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2">
              <BrandMark className="h-9 w-9 rounded-lg" />
              <BrandWordmark
                className="text-lg font-semibold leading-snug"
                leftClassName="!text-sidebar-foreground"
                rightClassName="!text-success"
              />
            </Link>
            <span className="mt-1 block text-3xs uppercase tracking-wider text-sidebar-muted">
              {t('layout.invoicePlatform')}
            </span>
          </div>
        </div>

        {/* The settlement rail: one line runs from the brand to your account.
            Every page is a station on it; the active page is the lit stop.
            No icons, no pills — the rail and the type carry the whole nav. */}
        <nav aria-label="Main navigation" className="relative flex-1 overflow-hidden py-5">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-8 top-0 w-px bg-gradient-to-b from-transparent via-white/15 to-white/15"
          />
          {/* A charge runs the rail toward your account every few seconds. */}
          <span aria-hidden="true" className="rail-pulse pointer-events-none" />
          {navGroups.map((group, groupIndex) => (
            <div key={group.label ?? 'top'} className={groupIndex > 0 ? 'mt-6' : ''}>
              {group.label && (
                <p className="mb-1.5 pl-12 pr-3 font-mono text-3xs font-medium uppercase tracking-[0.22em] text-sidebar-muted/70">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const isActive = isActivePath(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative flex items-center rounded-md py-2 pl-12 pr-3 font-display text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
                      isActive
                        ? 'font-medium text-sidebar-foreground'
                        : 'text-sidebar-muted hover:text-sidebar-foreground'
                    }`}
                  >
                    {/* Station node on the rail; the active stop is lit green. */}
                    <span
                      aria-hidden="true"
                      className={`absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${
                        isActive
                          ? 'h-[7px] w-[7px] bg-success shadow-[0_0_0_3px_hsl(var(--success)/0.2)]'
                          : 'h-[5px] w-[5px] bg-sidebar-muted/50 group-hover:bg-sidebar-muted'
                      }`}
                    />
                    <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div ref={accountMenuRef} className="relative pb-4 pt-1">
          {/* The rail's last segment: it ends at your account — that's the product. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-8 top-0 h-[30px] w-px bg-white/15"
          />
          {accountMenuOpen && (
            <div
              id="account-menu"
              role="menu"
              className="absolute bottom-full left-3 right-3 z-40 mb-2 overflow-hidden rounded-2xl border border-surface-3 bg-surface-1 shadow-[0_18px_40px_hsl(var(--background)_/_0.55)]"
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
            className="group relative flex w-full items-center py-2.5 pl-12 pr-4 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring"
          >
            {/* Terminus ring: filled while connected, hollow while not. */}
            <span
              aria-hidden="true"
              className={`absolute left-8 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-success ${
                connected ? 'bg-success/40' : 'bg-sidebar'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-xs font-semibold tracking-tight text-sidebar-foreground">
                {publicKey ? shortenAddress(publicKey) : t('layout.defaultUser')}
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                {connected ? t('layout.connected') : t('layout.notConnected')}
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 flex-shrink-0 text-sidebar-muted transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          {/* Mobile: brand + hamburger */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 md:hidden">
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

          {/* Desktop: language / theme / wallet controls */}
          <div className="hidden flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6 md:flex md:px-8">
            <LanguageToggle />
            <ThemeToggle />
            {config.privyAppId ? <PrivyLogin /> : <WalletConnect />}
          </div>
        </header>

        <MobileNavDrawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          items={navItems.map((item) => ({ ...item, end: item.path === '/dashboard' }))}
          triggerRef={mobileNavTriggerRef}
          footer={
            <>
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              {config.privyAppId ? <PrivyLogin /> : <WalletConnect />}
            </>
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
