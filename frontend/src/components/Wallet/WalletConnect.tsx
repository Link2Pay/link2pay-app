import { useAccesly } from 'accesly';
import { useWalletStore } from '../../store/walletStore';
import { useI18n } from '../../i18n/I18nProvider';
import { useNavigate } from 'react-router-dom';
import { unregisterAcceslySigner } from '../../services/acceslyAuth';
import { clearAcceslyAuthToken } from '../../services/auth';

interface WalletConnectProps {
  variant?: 'compact' | 'large';
}

export default function WalletConnect({ variant = 'compact' }: WalletConnectProps) {
  const { connected, publicKey, isConnecting, error, connect, disconnect } =
    useWalletStore();
  const accesly = useAccesly();
  const acceslyWallet = accesly.wallet;
  const { t } = useI18n();
  const navigate = useNavigate();

  // Handle Accesly disconnect
  const handleAcceslyDisconnect = async () => {
    try {
      // Clear auth state
      unregisterAcceslySigner();
      clearAcceslyAuthToken();

      // Call Accesly logout if the method is available
      if ('logout' in accesly && typeof accesly.logout === 'function') {
        await accesly.logout();
      }

      // Navigate to login page after logout
      navigate('/app');
    } catch (error) {
      console.error('Failed to disconnect Accesly:', error);
      // Even if logout fails, navigate to login
      navigate('/app');
    }
  };

  // Show disconnect button for Accesly users
  if (acceslyWallet) {
    if (variant === 'large') return null;

    return (
      <button onClick={handleAcceslyDisconnect} className="btn-ghost px-2 py-1 text-xs">
        {t('wallet.disconnect')}
      </button>
    );
  }

  if (connected && publicKey) {
    if (variant === 'large') return null;

    return (
      <button onClick={disconnect} className="btn-ghost px-2 py-1 text-xs">
        {t('wallet.disconnect')}
      </button>
    );
  }

  if (variant === 'large') {
    return (
      <div className="space-y-3">
        <button
          onClick={connect}
          disabled={isConnecting}
          className="btn-primary px-6 py-3 text-base"
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('wallet.connecting')}
            </span>
          ) : (
            t('wallet.connectFreighter')
          )}
        </button>
        {error && (
          <p className="text-xs text-danger text-center">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="btn-primary text-xs sm:text-sm"
    >
      {isConnecting ? t('wallet.connecting') : t('wallet.connectWallet')}
    </button>
  );
}
