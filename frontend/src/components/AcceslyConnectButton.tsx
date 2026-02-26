import { type ComponentType, useEffect, useState } from 'react';

type ConnectButtonComponent = ComponentType<Record<string, unknown>>;

type AcceslyConnectButtonProps = {
  className?: string;
  fallbackLabel?: string;
};

export default function AcceslyConnectButton({
  className,
  fallbackLabel = 'Google / Accesly Unavailable',
}: AcceslyConnectButtonProps) {
  const [ConnectButton, setConnectButton] = useState<ConnectButtonComponent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const mod = (await import('accesly')) as {
          ConnectButton?: ConnectButtonComponent;
        };
        if (!cancelled && mod?.ConnectButton) {
          setConnectButton(() => mod.ConnectButton!);
        }
      } catch {
        // Intentionally silent: button falls back to disabled state.
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <button type="button" disabled className={className || 'btn-secondary w-full opacity-70'}>
        Loading Google Wallet...
      </button>
    );
  }

  if (!ConnectButton) {
    return (
      <button type="button" disabled className={className || 'btn-secondary w-full opacity-70'}>
        {fallbackLabel}
      </button>
    );
  }

  return <ConnectButton />;
}
