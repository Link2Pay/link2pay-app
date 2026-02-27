import { Network, TestTube2 } from 'lucide-react';
import { StellarNetwork, useNetworkStore } from '../store/networkStore';
import { useWalletStore } from '../store/walletStore';
import toast from 'react-hot-toast';

interface NetworkToggleProps {
  compact?: boolean;
  integrated?: boolean;
}

export default function NetworkToggle({ compact = false, integrated = false }: NetworkToggleProps) {
  const { network, setNetwork } = useNetworkStore();
  const { connected, disconnect } = useWalletStore();

  const applyNetwork = (next: StellarNetwork) => {
    if (next === network) return;

    if (connected) {
      disconnect();
      const message =
        next === 'mainnet'
          ? 'Switched to Mainnet. Please reconnect your wallet.'
          : 'Switched to Testnet. Please reconnect your wallet.';
      toast.success(message);
    }

    setNetwork(next);
  };

  if (integrated) {
    const isTestnet = network === 'testnet';

    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/80 px-2 py-1">
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/80 min-[640px]:inline">
          Network
        </span>
        <div className="inline-flex items-center rounded-lg border border-border/70 bg-background/50 p-1">
          <button
            type="button"
            onClick={() => applyNetwork('testnet')}
            aria-pressed={isTestnet}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              isTestnet
                ? 'border border-primary/35 bg-primary/12 text-primary'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            {isTestnet ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
            Testnet
          </button>
          <button
            type="button"
            onClick={() => applyNetwork('mainnet')}
            aria-pressed={!isTestnet}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              !isTestnet
                ? 'border border-primary/35 bg-primary/12 text-primary'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            {!isTestnet ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
            Mainnet
          </button>
        </div>
      </div>
    );
  }

  const nextNetworkLabel = network === 'testnet' ? 'Mainnet' : 'Testnet';
  const nextNetwork: StellarNetwork = network === 'testnet' ? 'mainnet' : 'testnet';

  return (
    <button
      type="button"
      onClick={() => applyNetwork(nextNetwork)}
      className={`btn-ghost rounded-lg border border-border bg-card ${
        compact ? 'px-2.5 py-1.5 text-xs' : 'px-2.5 py-2 text-xs sm:px-3 sm:text-sm'
      }`}
      aria-label={`Switch to ${nextNetworkLabel}`}
      title={`Switch to ${nextNetworkLabel}`}
    >
      {network === 'testnet' ? <TestTube2 className="h-4 w-4" /> : <Network className="h-4 w-4" />}
      <span className={compact ? 'hidden min-[460px]:inline' : ''}>Switch</span>
      <span className={compact ? 'hidden min-[560px]:inline text-muted-foreground' : 'text-muted-foreground'}>
        {nextNetworkLabel}
      </span>
    </button>
  );
}
