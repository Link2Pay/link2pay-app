import { useWalletStore } from '../../store/walletStore';

interface WalletConnectProps {
  variant?: 'compact' | 'large';
}

export default function WalletConnect({ variant = 'compact' }: WalletConnectProps) {
  const { connected, publicKey, isConnecting, error, connect, disconnect } =
    useWalletStore();

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (connected && publicKey) {
    if (variant === 'large') return null;

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-1 border border-surface-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-mono text-ink-1">
            {truncateAddress(publicKey)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="btn-ghost text-xs px-2 py-1"
        >
          Disconnect
        </button>
      </div>
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
              Connecting...
            </span>
          ) : (
            'Connect Freighter Wallet'
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
      className="btn-primary text-sm"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
