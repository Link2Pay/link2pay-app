import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FilePlus2,
  FolderKanban,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Palette,
  ScrollText,
  Settings2,
  UserCircle2,
  Users,
  Receipt,
  Webhook,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';
import { usePlanStore } from '../store/planStore';
import WalletConnect from './Wallet/WalletConnect';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import NetworkToggle from './NetworkToggle';
import BrandMark from './BrandMark';
import BrandWordmark from './BrandWordmark';
import { useI18n } from '../i18n/I18nProvider';
import type { Language } from '../i18n/translations';
import { useActorWallet } from '../hooks/useActorWallet';
import { getPlanLabel, tierAtLeast, type PlanTier } from '../lib/plans';
import PlanLockModal from './PlanLockModal';

type NavCopy = {
  overview: string;
  links: string;
  projects: string;
  apiKeys: string;
  webhooks: string;
  analytics: string;
  exportsLogs: string;
  team: string;
  branding: string;
  billing: string;
  createLink: string;
};

const NAV_COPY: Record<Language, NavCopy> = {
  en: {
    overview: 'Overview',
    links: 'Links',
    projects: 'Projects',
    apiKeys: 'API Keys',
    webhooks: 'Webhooks',
    analytics: 'Analytics',
    exportsLogs: 'Exports / Logs',
    team: 'Team',
    branding: 'Branding',
    billing: 'Billing',
    createLink: 'Create Link',
  },
  es: {
    overview: 'Resumen',
    links: 'Links',
    projects: 'Proyectos',
    apiKeys: 'API Keys',
    webhooks: 'Webhooks',
    analytics: 'Analitica',
    exportsLogs: 'Exportaciones / Logs',
    team: 'Equipo',
    branding: 'Branding',
    billing: 'Facturacion',
    createLink: 'Crear Link',
  },
  pt: {
    overview: 'Visao geral',
    links: 'Links',
    projects: 'Projetos',
    apiKeys: 'API Keys',
    webhooks: 'Webhooks',
    analytics: 'Analitica',
    exportsLogs: 'Exportacoes / Logs',
    team: 'Equipe',
    branding: 'Branding',
    billing: 'Faturamento',
    createLink: 'Criar Link',
  },
};

const LOCK_REASONS: Record<Language, Record<PlanTier, string>> = {
  en: {
    free: 'Upgrade required for this section.',
    pro: 'This section is available on Pro or higher.',
    business: 'This section is available on Business.',
  },
  es: {
    free: 'Necesitas upgrade para esta seccion.',
    pro: 'Esta seccion esta disponible en Pro o superior.',
    business: 'Esta seccion esta disponible en Business.',
  },
  pt: {
    free: 'E necessario upgrade para esta secao.',
    pro: 'Esta secao esta disponivel no Pro ou superior.',
    business: 'Esta secao esta disponivel no Business.',
  },
};

const LOCK_TITLE_SUFFIX: Record<Language, string> = {
  en: 'is locked',
  es: 'esta bloqueado',
  pt: 'esta bloqueado',
};

type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  requiredTier?: PlanTier;
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected, publicKey, disconnect } = useWalletStore();
  const { token, user, clearSession } = useAuthStore();
  const tier = usePlanStore((state) => state.tier);
  const { t, language } = useI18n();
  const navCopy = NAV_COPY[language];
  const actorWallet = useActorWallet();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [lockedNavItem, setLockedNavItem] = useState<{
    label: string;
    requiredTier: PlanTier;
  } | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const navItems: NavItem[] = [
    { path: '/app', label: navCopy.overview, icon: LayoutDashboard },
    { path: '/app/transactions', label: t('layout.nav.transactions'), icon: ArrowLeftRight },
    { path: '/app/links', label: navCopy.links, icon: Receipt },
    { path: '/app/projects', label: navCopy.projects, icon: FolderKanban, requiredTier: 'pro' },
    { path: '/app/api-keys', label: navCopy.apiKeys, icon: KeyRound, requiredTier: 'pro' },
    { path: '/app/webhooks', label: navCopy.webhooks, icon: Webhook, requiredTier: 'pro' },
    { path: '/app/analytics', label: navCopy.analytics, icon: BarChart3, requiredTier: 'pro' },
    { path: '/app/exports-logs', label: navCopy.exportsLogs, icon: ScrollText, requiredTier: 'business' },
    { path: '/app/team', label: navCopy.team, icon: Users, requiredTier: 'business' },
    { path: '/app/branding', label: navCopy.branding, icon: Palette, requiredTier: 'pro' },
    { path: '/app/billing', label: navCopy.billing, icon: CreditCard },
    { path: '/app/create-link', label: navCopy.createLink, icon: FilePlus2 },
  ];

  const isActivePath = (path: string) =>
    path === '/app'
      ? location.pathname === '/app'
      : location.pathname.startsWith(path);

  const displayWallet = publicKey || actorWallet;
  const hasAccess = Boolean(displayWallet);
  const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const profileInitial = (displayWallet?.[0] || 'L').toUpperCase();
  const accountName =
    user?.displayName?.trim() ||
    (user?.email ? user.email.split('@')[0] : null) ||
    (displayWallet ? shortenAddress(displayWallet) : 'Link2Pay User');
  const accountMeta = user?.email || (displayWallet ? shortenAddress(displayWallet) : 'No wallet linked');
  const accountPlan = getPlanLabel(tier);

  const handleLogout = () => {
    setAccountMenuOpen(false);
    clearSession();
    if (connected) {
      disconnect();
    }
    navigate('/app/login');
  };

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current) return;
      if (!accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [accountMenuOpen]);

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:fixed md:z-10 md:flex md:h-full md:w-64 md:flex-col">
        <div className="border-b border-sidebar-border px-6 py-5">
          <div>
            <Link to="/app" className="inline-flex items-center gap-2">
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
              const isLocked = item.requiredTier ? !tierAtLeast(tier, item.requiredTier) : false;
              const lockText = item.requiredTier ? getPlanLabel(item.requiredTier) : '';

              if (isLocked && item.requiredTier) {
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() =>
                      setLockedNavItem({
                        label: item.label,
                        requiredTier: item.requiredTier!,
                      })
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-sidebar-accent hover:text-foreground"
                  >
                    <span className="flex items-center gap-3">
                      <Icon aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      <Lock className="h-3 w-3" />
                      {lockText}
                    </span>
                  </button>
                );
              }

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
            <div className="mb-2 rounded-2xl border border-surface-3 bg-surface-1 p-3 shadow-2xl">
              <div className="pb-3">
                <p className="truncate text-sm font-semibold text-foreground">{accountName}</p>
                <p className="truncate text-xs text-muted-foreground">{accountMeta}</p>
              </div>

              <div className="mt-1 space-y-1 border-t border-surface-3 pt-3">
                <Link
                  to="/app/profile-options"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                >
                  <span className="flex items-center gap-2">
                    <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                    Profile
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  to="/plans"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                >
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    Plans
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  to="/sdk"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    Documentation
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  to="/why-link2pay"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    Help
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>

              <div className="mt-3 border-t border-surface-3 pt-3">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
                >
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  Log out
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            className="w-full rounded-xl border border-surface-3 bg-surface-1 p-2.5 text-left transition-colors hover:bg-sidebar-accent"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {accountName[0]?.toUpperCase() || 'L'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{accountName}</p>
                <p className="truncate text-xs text-primary">{accountPlan}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  accountMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 sm:px-6 md:px-8">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {displayWallet && (
                <div className="flex items-center gap-2 rounded-full border border-surface-3 bg-surface-1 px-2 py-1">
                  <span className="hidden font-mono text-xs text-ink-2 min-[420px]:inline">
                    {shortenAddress(displayWallet)}
                  </span>
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {profileInitial}
                  </span>
                </div>
              )}
              <NetworkToggle compact integrated />
              <LanguageToggle />
              <ThemeToggle />
              {!token && (
                <WalletConnect />
              )}
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-background/70 px-3 py-2 backdrop-blur md:hidden">
          <nav aria-label="Mobile navigation" className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = isActivePath(item.path);
              const Icon = item.icon;
              const isLocked = item.requiredTier ? !tierAtLeast(tier, item.requiredTier) : false;

              if (isLocked && item.requiredTier) {
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() =>
                      setLockedNavItem({
                        label: item.label,
                        requiredTier: item.requiredTier!,
                      })
                    }
                    className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Lock aria-hidden="true" className="h-3.5 w-3.5" />
                      {item.label}
                    </span>
                  </button>
                );
              }

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
          {hasAccess ? (
            <Outlet />
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="max-w-md text-center animate-in">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <span className="text-3xl text-primary">S</span>
                </div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  Login Required
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  Sign in and link a wallet before accessing the dashboard.
                </p>
                <Link to="/app/login" className="btn-primary text-sm">
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <PlanLockModal
        open={Boolean(lockedNavItem)}
        requiredTier={lockedNavItem?.requiredTier || 'pro'}
        title={lockedNavItem ? `${lockedNavItem.label} ${LOCK_TITLE_SUFFIX[language]}` : ''}
        description={
          lockedNavItem
            ? LOCK_REASONS[language][lockedNavItem.requiredTier]
            : ''
        }
        onClose={() => setLockedNavItem(null)}
      />
    </div>
  );
}

