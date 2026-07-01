import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  NETWORK_CONFIGS,
  RESOLVED_NETWORK,
  type StellarNetwork,
} from '../config/network';

export type { StellarNetwork };

interface NetworkConfig {
  network: StellarNetwork;
  horizonUrl: string;
  networkPassphrase: string;
}

interface NetworkState extends NetworkConfig {
  setNetwork: (network: StellarNetwork) => void;
}

const resolved: NetworkConfig = {
  network: RESOLVED_NETWORK,
  horizonUrl: NETWORK_CONFIGS[RESOLVED_NETWORK].horizonUrl,
  networkPassphrase: NETWORK_CONFIGS[RESOLVED_NETWORK].networkPassphrase,
};

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set) => ({
      ...resolved,
      setNetwork: (network: StellarNetwork) => {
        const endpoints = NETWORK_CONFIGS[network];
        set({
          network,
          horizonUrl: endpoints.horizonUrl,
          networkPassphrase: endpoints.networkPassphrase,
        });
      },
    }),
    {
      name: 'link2pay-network-storage',
      version: 2,
      // The network is deployment-fixed (mainnet here, testnet on its own
      // subdomain) — there is no in-app toggle. Always heal any persisted
      // value back to the origin's resolved network so a stale session can
      // never pin the dashboard to the wrong network.
      //
      // This must be `merge`, not `migrate`: migrate fires only on a version
      // bump, so a same-version session persisted on a different network (e.g.
      // an earlier testnet run) would otherwise survive unhealed. `merge` runs
      // on every hydration, and spreading `resolved` last makes the resolved
      // network win over whatever was stored.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<NetworkState>),
        ...resolved,
      }),
    }
  )
);
