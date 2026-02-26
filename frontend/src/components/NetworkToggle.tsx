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
  const nextNetworkLabel = network === 'testnet' ? 'Mainnet' : 'Testnet';
  const currentNetworkLabel = network === 'testnet' ? 'Testnet' : 'Mainnet';
  const currentNetworkHint = network === 'testnet' ? 'Sandbox' : 'Live';

  const toggleNetwork = () => {
    const next: StellarNetwork = network === 'testnet' ? 'mainnet' : 'testnet';

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
    return (
      <div className="flex items-center rounded-xl border border-surface-3 bg-surface-1/95 p-1 shadow-sm">
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              network === 'testnet' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span className="hidden text-[10px] uppercase tracking-wide text-muted-foreground min-[640px]:inline">
            Network
          </span>
          <span className="text-xs font-semibold text-foreground">{currentNetworkLabel}</span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
              network === 'testnet'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-amber-500/10 text-amber-500'
            }`}
          >
            {currentNetworkHint}
          </span>
        </div>

        <span className="mx-1 h-5 w-px bg-surface-3" />

        <button
          type="button"
          onClick={toggleNetwork}
          className="btn-ghost rounded-lg border border-border/80 bg-card/90 px-3 py-1.5 text-xs font-medium"
          aria-label={`Switch to ${nextNetworkLabel}`}
          title={`Switch to ${nextNetworkLabel}`}
        >
          {network === 'testnet' ? <TestTube2 className="h-4 w-4" /> : <Network className="h-4 w-4" />}
          <span className={compact ? 'hidden min-[560px]:inline text-muted-foreground' : 'text-muted-foreground'}>
            Switch
          </span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleNetwork}
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
