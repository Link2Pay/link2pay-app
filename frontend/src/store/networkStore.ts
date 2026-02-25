import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StellarNetwork = 'testnet' | 'mainnet';

interface NetworkConfig {
  network: StellarNetwork;
  horizonUrl: string;
  networkPassphrase: string;
}

interface NetworkState extends NetworkConfig {
  setNetwork: (network: StellarNetwork) => void;
}

const NETWORK_CONFIGS: Record<StellarNetwork, Omit<NetworkConfig, 'network'>> = {
  testnet: {
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
  mainnet: {
    horizonUrl: 'https://horizon.stellar.org',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
  },
};

export const useNetworkStore = create<NetworkState>()(
  persist(
    (set) => ({
      network: 'testnet',
      horizonUrl: NETWORK_CONFIGS.testnet.horizonUrl,
      networkPassphrase: NETWORK_CONFIGS.testnet.networkPassphrase,
      setNetwork: (network: StellarNetwork) => {
        const config = NETWORK_CONFIGS[network];
        set({
          network,
          horizonUrl: config.horizonUrl,
          networkPassphrase: config.networkPassphrase,
        });
      },
    }),
    {
      name: 'link2pay-network-storage',
    }
  )
);
