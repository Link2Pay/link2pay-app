import { Network, TestTube2 } from 'lucide-react';
import { StellarNetwork, useNetworkStore } from '../store/networkStore';
import { useWalletStore } from '../store/walletStore';
import toast from 'react-hot-toast';

interface NetworkToggleProps {
  compact?: boolean;
}

export default function NetworkToggle({ compact = false }: NetworkToggleProps) {
  const { network, setNetwork } = useNetworkStore();
  const { connected, disconnect, getFreighterNetwork } = useWalletStore();
  const isTestnet = network === 'testnet';
  const currentLabel = isTestnet ? 'Testnet' : 'Mainnet';
  const nextLabel = isTestnet ? 'Mainnet' : 'Testnet';

  const toggleNetwork = async () => {
    const next: StellarNetwork = network === 'testnet' ? 'mainnet' : 'testnet';
    const nextPassphrase =
      next === 'testnet'
        ? 'Test SDF Network ; September 2015'
        : 'Public Global Stellar Network ; September 2015';
    const nextName = next === 'testnet' ? 'TESTNET' : 'MAINNET';

    let freighterNetwork: string | null = null;
    try {
      freighterNetwork = await getFreighterNetwork();
    } catch {
      freighterNetwork = null;
    }

    if (connected) {
      disconnect();
      const message =
        next === 'mainnet'
          ? 'Switched to Mainnet. Please reconnect your wallet.'
          : 'Switched to Testnet. Please reconnect your wallet.';
      toast.success(message);
    } else {
      const message =
        next === 'mainnet'
          ? 'Switched to Mainnet.'
          : 'Switched to Testnet.';
      toast.success(message);
    }

    setNetwork(next);

    if (freighterNetwork && freighterNetwork !== nextPassphrase) {
      const freighterName = freighterNetwork.includes('Test') ? 'TESTNET' : 'MAINNET';
      toast.error(
        `Network mismatch: Dashboard is on ${nextName}, but Freighter is on ${freighterName}. Switch Freighter to ${nextName}.`
      );
    }
  };

  return (
    <button
      type="button"
      onClick={toggleNetwork}
      className={`btn rounded-lg border shadow-sm ${
        isTestnet
          ? 'border-info/40 bg-info/10 text-info hover:bg-info/20'
          : 'border-warning/40 bg-warning/10 text-warning hover:bg-warning/20'
      } ${compact ? 'min-w-[88px] px-2.5 py-1.5 text-2xs' : 'min-w-[116px] px-3 py-2 text-xs sm:text-sm'}`}
      aria-label={`Current network: ${currentLabel}. Switch to ${nextLabel}.`}
      title={`Current network: ${currentLabel}. Switch to ${nextLabel}.`}
    >
      <span
        className={`h-2 w-2 rounded-full animate-pulse-slow ${isTestnet ? 'bg-info' : 'bg-warning'}`}
        aria-hidden="true"
      />
      {isTestnet ? <TestTube2 className="h-4 w-4" /> : <Network className="h-4 w-4" />}
      <span className="font-semibold uppercase tracking-[0.12em]">{compact ? currentLabel : `Stellar ${currentLabel}`}</span>
    </button>
  );
}
