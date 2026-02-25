import { Network, TestTube2 } from 'lucide-react';
import { useNetworkStore, StellarNetwork } from '../store/networkStore';
import { useI18n } from '../i18n/I18nProvider';
import { useWalletStore } from '../store/walletStore';
import toast from 'react-hot-toast';

export default function NetworkToggle() {
  const { network, setNetwork } = useNetworkStore();
  const { connected, disconnect } = useWalletStore();
  const { t } = useI18n();

  const toggleNetwork = () => {
    const next: StellarNetwork = network === 'testnet' ? 'mainnet' : 'testnet';

    // If wallet is connected, disconnect and warn user
    if (connected) {
      disconnect();
      const message = next === 'mainnet'
        ? 'Switched to Mainnet. Please reconnect your wallet.'
        : 'Switched to Testnet. Please reconnect your wallet.';
      toast.success(message);
    }

    setNetwork(next);
  };

  return (
    <button
      type="button"
      onClick={toggleNetwork}
      className="btn-ghost rounded-lg border border-border bg-card px-2.5 py-2 text-xs sm:px-3 sm:text-sm"
      aria-label={network === 'testnet' ? 'Switch to Mainnet' : 'Switch to Testnet'}
      title={network === 'testnet' ? 'Switch to Mainnet' : 'Switch to Testnet'}
    >
      {network === 'testnet' ? <TestTube2 className="h-4 w-4" /> : <Network className="h-4 w-4" />}
      <span className="hidden min-[420px]:inline">
        {network === 'testnet' ? 'Testnet' : 'Mainnet'}
      </span>
    </button>
  );
}
