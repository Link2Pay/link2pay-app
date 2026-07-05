import { useEffect, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { getKitModules, kitSetWallet, kitGetAddress } from '../../services/walletsKit';
import { useI18n } from '../../i18n/I18nProvider';
import { shortenAddress } from '../../lib/format';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { ModuleInterface } from '@creit.tech/stellar-wallets-kit/types';

interface WalletRollerProps {
  networkPassphrase: string;
  onConnect: (address: string) => void;
  connectedAddress: string | null;
}

interface WalletEntry {
  module: ModuleInterface;
  available: boolean;
  checking: boolean;
}

export default function WalletRoller({ networkPassphrase, onConnect, connectedAddress }: WalletRollerProps) {
  const { t } = useI18n();
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // "Ver más" progresivo. El nº de columnas del grid es 2 en <640px y 3 en
  // ≥640px (alineado con `sm:grid-cols-3`): se muestran 3/2 al inicio y cada
  // clic revela el doble (6 en desktop, 4 en mobile).
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const perRow = isDesktop ? 3 : 2;
  const [moreClicks, setMoreClicks] = useState(0);
  const visibleCount = perRow + moreClicks * perRow * 2;

  useEffect(() => {
    let cancelled = false;
    const modules = getKitModules();
    const initial: WalletEntry[] = modules.map((m) => ({ module: m, available: false, checking: true }));
    setEntries(initial);

    Promise.all(
      modules.map(async (mod, index) => {
        let available = false;
        try {
          available = await Promise.race([
            mod.isAvailable(),
            new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200)),
          ]);
        } catch {
          available = false;
        }
        if (!cancelled) {
          setEntries((prev) => {
            const next = [...prev];
            next[index] = { module: mod, available, checking: false };
            return next;
          });
        }
      })
    ).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const sorted = [...entries].sort((a, b) => {
    const aWC = a.module.moduleType === 'BRIDGE_WALLET';
    const bWC = b.module.moduleType === 'BRIDGE_WALLET';
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    if (aWC && !bWC) return -1;
    if (!aWC && bWC) return 1;
    return 0;
  });

  const handleSelect = useCallback(async (entry: WalletEntry) => {
    setError(null);
    setConnecting(entry.module.productId);
    try {
      kitSetWallet(entry.module.productId, networkPassphrase);
      const address = await kitGetAddress(networkPassphrase);
      if (address) {
        setSelectedId(entry.module.productId);
        onConnect(address);
      } else {
        setError(t('wallet.addressError'));
      }
    } catch {
      setError(t('wallet.connectError'));
    } finally {
      setConnecting(null);
    }
  }, [onConnect, networkPassphrase, t]);

  if (!entries.length && !loading) return null;

  // Una vez conectada una wallet no tiene sentido paginar (el flujo avanza y la
  // elegida siempre estuvo en el lote visible). Si no, mostramos por lotes.
  const visible = connectedAddress ? sorted : sorted.slice(0, visibleCount);
  const hiddenCount = sorted.length - visible.length;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ink-0">{t('wallet.selectWallet')}</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {loading && !entries.length ? (
          <div className="col-span-full py-4 text-center text-xs text-ink-3">{t('wallet.loading')}</div>
        ) : (
          visible.map((entry) => {
            const { module, available, checking } = entry;
            const isSelected = Boolean(connectedAddress) && selectedId === module.productId;
            const isConnecting = connecting === module.productId;
            const icon = module.productIcon;

            let stateDot: string;
            let stateLabel: string;
            if (isConnecting) {
              stateDot = 'bg-accent-ink animate-pulse';
              stateLabel = '';
            } else if (checking) {
              stateDot = 'bg-ink-3 animate-pulse';
              stateLabel = '';
            } else if (available) {
              stateDot = 'bg-success';
              stateLabel = t('wallet.detected');
            } else if (module.moduleType === 'BRIDGE_WALLET') {
              stateDot = 'bg-ink-3';
              stateLabel = t('wallet.tapToConnect');
            } else {
              stateDot = 'bg-ink-4';
              stateLabel = '';
            }

            return (
              <button
                key={module.productId}
                onClick={() => handleSelect(entry)}
                disabled={isConnecting || !!connectedAddress}
                className={`flex flex-col items-center gap-1.5
                  rounded-xl p-3 transition-colors duration-150 text-center
                  ${isSelected ? 'ring-2 ring-accent-ink bg-card border-l-2 border-success' : 'bg-card hover:bg-muted border border-surface-3'}
                  ${connectedAddress && !isSelected ? 'opacity-60' : ''}
                  disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink`}
              >
                {icon ? (
                  <img src={icon} alt={module.productName} className="h-8 w-8 rounded-lg object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-surface-2 flex items-center justify-center text-xs font-bold text-ink-3">
                    {module.productName.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-semibold text-ink-1 leading-tight">{module.productName}</span>
                <span className="flex items-center gap-1.5">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full flex-shrink-0 ${stateDot}`} />
                  {stateLabel && <span className="text-2xs text-ink-3">{stateLabel}</span>}
                </span>
                {!available && !checking && module.moduleType !== 'BRIDGE_WALLET' && (
                  <a
                    href={module.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xs font-medium text-accent-ink hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('wallet.install')}
                  </a>
                )}
              </button>
            );
          })
        )}
      </div>

      {!connectedAddress && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setMoreClicks((c) => c + 1)}
          className="btn-ghost w-full text-sm"
        >
          {t('wallet.showMore')} ({hiddenCount})
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {connectedAddress && (
        <div className="mt-2 text-center text-xs text-ink-3">
          {t('wallet.payingFrom')}{' '}
          <span className="font-mono tabular-nums">{shortenAddress(connectedAddress, 8, 4)}</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-danger text-center">{error}</p>
      )}
    </div>
  );
}
