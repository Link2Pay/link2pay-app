import { type ComponentType, type ReactNode, useEffect, useMemo, useState } from 'react';
import { config } from '../config';

type WalletLike = {
  stellarAddress?: string;
  email?: string;
  [key: string]: unknown;
};

type AcceslyProviderProps = {
  appId: string;
  network?: 'testnet' | 'mainnet';
  theme?: 'dark' | 'light';
  onConnect?: (wallet: WalletLike) => void;
  onDisconnect?: () => void;
  children: ReactNode;
};

type AcceslyProviderComponent = ComponentType<AcceslyProviderProps>;

const ACCESLY_CONNECT_EVENT = 'link2pay:accesly-connect';
const ACCESLY_DISCONNECT_EVENT = 'link2pay:accesly-disconnect';

export function AcceslyBridgeProvider({ children }: { children: ReactNode }) {
  const [ProviderComponent, setProviderComponent] = useState<AcceslyProviderComponent | null>(
    null
  );

  const network = useMemo<'testnet' | 'mainnet'>(() => {
    const raw = config.stellarNetwork.toLowerCase();
    return raw === 'public' || raw === 'mainnet' ? 'mainnet' : 'testnet';
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!config.acceslyAppId) {
      setProviderComponent(null);
      return () => {
        cancelled = true;
      };
    }

    const loadProvider = async () => {
      try {
        const mod = (await import('accesly')) as {
          AcceslyProvider?: AcceslyProviderComponent;
        };
        if (cancelled) return;
        if (mod?.AcceslyProvider) {
          setProviderComponent(() => mod.AcceslyProvider!);
        }
      } catch {
        if (!cancelled) {
          setProviderComponent(null);
        }
      }
    };

    loadProvider();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ProviderComponent || !config.acceslyAppId) {
    return <>{children}</>;
  }

  return (
    <ProviderComponent
      appId={config.acceslyAppId}
      network={network}
      theme="dark"
      onConnect={(wallet) => {
        window.dispatchEvent(
          new CustomEvent(ACCESLY_CONNECT_EVENT, {
            detail: wallet,
          })
        );
      }}
      onDisconnect={() => {
        window.dispatchEvent(new CustomEvent(ACCESLY_DISCONNECT_EVENT));
      }}
    >
      {children}
    </ProviderComponent>
  );
}

export const acceslyEvents = {
  connect: ACCESLY_CONNECT_EVENT,
  disconnect: ACCESLY_DISCONNECT_EVENT,
} as const;
