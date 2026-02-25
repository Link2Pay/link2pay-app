import { useMemo } from 'react';
import { config as staticConfig } from '../config';
import { useNetworkStore } from '../store/networkStore';

export function useConfig() {
  const { horizonUrl, networkPassphrase, network } = useNetworkStore();

  return useMemo(
    () => ({
      ...staticConfig,
      stellarNetwork: network,
      horizonUrl,
      networkPassphrase,
    }),
    [network, horizonUrl, networkPassphrase]
  );
}
