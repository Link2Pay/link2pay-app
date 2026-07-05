import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  Menu,
  QrCode,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import BrandMark from './BrandMark';
import BrandWordmark from './BrandWordmark';
import MobileNavDrawer from './MobileNavDrawer';
import AccountPanel from './AccountPanel';
import { useI18n } from '../i18n/I18nProvider';
import { shortenAddress } from '../lib/format';
import { useWalletBalances } from '../hooks/useWalletBalances';
import { getBusinessProfile } from '../services/api';
import { isProfileComplete } from '../lib/profileCompleteness';

export default function Layout() {
  const location = useLocation();
  const { connected, publicKey, privyLoading, disconnect } = useWalletStore();
  const { network } = useNetworkStore();
  const { t } = useI18n();
  const { balances, loading: balancesLoading, error: balancesError, refresh: refreshBalances } = useWalletBalances();

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const [profileGate, setProfileGate] = useState<'checking' | 'complete' | 'incomplete'>('checking');

  useEffect(() => {
    if (!connected || !publicKey) return;
    let cancelled = false;
    setProfileGate('checking');
    (async () => {
      try {
        const profile = await getBusinessProfile(publicKey);
        if (!cancelled) setProfileGate(isProfileComplete(profile) ? 'complete' : 'incomplete');
      } catch {
        if (!cancelled) setProfileGate('complete');
      }
    })();
    return () => { cancelled = true; };
  }, [connected, publicKey]);

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

  // Preview solo-dev (`/dev/*`): renderiza el contenido con el chrome real del
  // dashboard sin exigir wallet conectada. Rama muerta en producción.
  const isDevPreview = import.meta.env.DEV && location.pathname.startsWith('/dev/');

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:fixed md:z-10 md:flex md:h-full md:w-64 md:flex-col">
        <div className="border-b border-sidebar-border px-6 py-5">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2">
              <BrandMark className="h-7 w-7" />
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
                      ? 'bg-sidebar-primary text-white font-bold'
                      : 'text-sidebar-foreground font-medium hover:bg-sidebar-accent'
                  }`}
                >
                  {/* Icono/letra activos en blanco (ambos temas); en dark se
                      oscurece el círculo del icono para que el blanco resalte. */}
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      isActive ? 'bg-white/15 dark:bg-black/25' : 'bg-muted'
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
              className="absolute bottom-full left-4 right-4 z-40 mb-2"
            >
              <AccountPanel
                variant="desktopMenu"
                profileInitial={profileInitial}
                publicKey={publicKey}
                connected={connected}
                network={network}
                balances={balances}
                balancesLoading={balancesLoading}
                balancesError={Boolean(balancesError)}
                onNavigate={() => setAccountMenuOpen(false)}
                onDismiss={() => setAccountMenuOpen(false)}
                onDisconnect={() => {
                  setAccountMenuOpen(false);
                  if (!connected) return;
                  disconnect();
                }}
              />
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
              <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
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
              <BrandMark className="h-6 w-6" />
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
            <AccountPanel
              variant="mobileCard"
              profileInitial={profileInitial}
              publicKey={publicKey}
              connected={connected}
              network={network}
              onNavigate={() => setMobileNavOpen(false)}
              onDismiss={() => setMobileNavOpen(false)}
              onDisconnect={() => {
                setMobileNavOpen(false);
                if (!connected) return;
                disconnect();
              }}
            />
          }
        />

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-8">
          {isDevPreview ? (
            <Outlet />
          ) : connected ? (
            profileGate === 'incomplete' ? (
              <Navigate to="/register" replace />
            ) : profileGate === 'checking' ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              </div>
            ) : (
              <Outlet />
            )
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
