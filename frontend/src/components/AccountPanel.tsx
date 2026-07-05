import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, UserCircle2 } from 'lucide-react';
import { config, CURRENCY_SYMBOLS } from '../config';
import { shortenAddress } from '../lib/format';
import ThemeToggle from './ThemeToggle';
import PrivyDisconnectButton from './Auth/PrivyDisconnectButton';
import { useI18n } from '../i18n/I18nProvider';

type BalanceItem = {
  asset: string;
  code: string;
  balance: string;
};

type AccountPanelVariant = 'desktopMenu' | 'mobileCard';

interface AccountPanelProps {
  variant: AccountPanelVariant;
  profileInitial: string;
  publicKey?: string | null;
  connected: boolean;
  network: string;
  onNavigate?: () => void;
  onDismiss?: () => void;
  onDisconnect: () => void;
  balances?: BalanceItem[];
  balancesLoading?: boolean;
  balancesError?: boolean;
}

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
  const formatted = value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  const symbol = CURRENCY_SYMBOLS[code] || code;
  return code === 'XLM' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

function AccountActionLink({
  to,
  onNavigate,
  variant,
  children,
}: {
  to: string;
  onNavigate?: () => void;
  variant: AccountPanelVariant;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      role={variant === 'desktopMenu' ? 'menuitem' : undefined}
      onClick={onNavigate}
      className="flex min-h-11 items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
    >
      {children}
    </Link>
  );
}

export default function AccountPanel({
  variant,
  profileInitial,
  publicKey,
  connected,
  network,
  onNavigate,
  onDismiss,
  onDisconnect,
  balances = [],
  balancesLoading = false,
  balancesError = false,
}: AccountPanelProps) {
  const { t } = useI18n();
  const userLabel = publicKey ? shortenAddress(publicKey) : t('layout.defaultUser');
  const isDesktop = variant === 'desktopMenu';
  const networkLabel = network === 'testnet' ? 'Testnet' : 'Mainnet';
  const networkTone = network === 'testnet' ? 'text-warning' : 'text-success';
  const statusTone = connected ? 'text-success' : 'text-muted-foreground';
  const dotTone = connected ? 'bg-success' : 'bg-muted-foreground';

  return (
    <div
      className={
        isDesktop
          ? 'overflow-hidden rounded-2xl border border-border bg-popover shadow-overlay'
          : 'rounded-2xl border border-border bg-card'
      }
    >
      <div className={`flex items-center gap-2.5 ${isDesktop ? 'border-b border-surface-3 px-3 pb-3 pt-3' : 'border-b border-border px-3 py-3.5'}`}>
        <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
          {profileInitial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{userLabel}</p>
          {isDesktop ? (
            <p className={`flex items-center gap-1 text-xs ${networkTone}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${network === 'testnet' ? 'bg-warning' : 'bg-success'}`} />
              {networkLabel}
            </p>
          ) : (
            <p className={`flex items-center gap-1.5 text-xs ${statusTone}`}>
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotTone}`} />
              {connected ? t('layout.connected') : t('layout.notConnected')}
            </p>
          )}
        </div>
      </div>

      {isDesktop && (
        <div className="border-b border-surface-3 px-3 py-3">
          <p className="mb-1.5 text-3xs uppercase tracking-wider text-muted-foreground">
            {t('layout.balance')}
          </p>
          {balancesLoading ? (
            <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
          ) : balancesError ? (
            <p className="text-xs text-muted-foreground">{t('layout.balanceUnavailable')}</p>
          ) : balances.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('layout.noBalance')}</p>
          ) : (
            <div className="space-y-1">
              {sortBalances(balances).map((balance) => (
                <div key={balance.asset} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-foreground">
                    {formatBalance(balance.balance, balance.code)}
                  </span>
                  <span className="text-3xs text-muted-foreground">{balance.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-0.5 px-1.5 py-2">
        <AccountActionLink
          to="/dashboard/profile-options"
          onNavigate={onNavigate}
          variant={variant}
        >
          <UserCircle2 className="h-4 w-4 text-muted-foreground" />
          {t('layout.profile')}
        </AccountActionLink>
        <ThemeToggle variant={isDesktop ? 'menuItem' : 'actionRow'} />
      </div>

      <div className={`${isDesktop ? 'border-t border-surface-3' : 'border-t border-border'} px-1.5 py-2`}>
        {config.privyAppId ? (
          <PrivyDisconnectButton
            onBefore={onDismiss}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            {t('layout.disconnect')}
          </PrivyDisconnectButton>
        ) : (
          <button
            type="button"
            role={isDesktop ? 'menuitem' : undefined}
            onClick={onDisconnect}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            {t('layout.disconnect')}
          </button>
        )}
      </div>
    </div>
  );
}
