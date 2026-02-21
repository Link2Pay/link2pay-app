import { useState, useEffect, useRef } from 'react';
import { Radio } from 'lucide-react';

type Network = 'testnet' | 'mainnet';

const STORAGE_KEY = 'link2pay-network';

function getStoredNetwork(): Network {
  if (typeof window === 'undefined') return 'testnet';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'mainnet' ? 'mainnet' : 'testnet';
}

export function useNetwork() {
  const [network, setNetworkState] = useState<Network>(getStoredNetwork);

  const setNetwork = (n: Network) => {
    window.localStorage.setItem(STORAGE_KEY, n);
    setNetworkState(n);
  };

  return { network, setNetwork };
}

export default function NetworkToggle({ compact }: { compact?: boolean }) {
  const { network, setNetwork } = useNetwork();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isTestnet = network === 'testnet';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
          isTestnet
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
        }`}
        aria-label="Select network"
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isTestnet ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
        {!compact && <Radio className="h-3 w-3" />}
        {isTestnet ? 'Testnet' : 'Mainnet'}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
          <button
            onClick={() => { setNetwork('testnet'); setOpen(false); }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
              isTestnet ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Stellar Testnet
            {isTestnet && <span className="ml-auto text-primary">&#10003;</span>}
          </button>
          <button
            onClick={() => { setNetwork('mainnet'); setOpen(false); }}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors ${
              !isTestnet ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Stellar Mainnet
            {!isTestnet && <span className="ml-auto text-primary">&#10003;</span>}
          </button>
        </div>
      )}
    </div>
  );
}
