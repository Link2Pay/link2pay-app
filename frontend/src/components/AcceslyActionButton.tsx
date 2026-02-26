import { useEffect, useState } from 'react';

type UseAcceslyHook = () => {
  connect: () => Promise<void>;
  loading: boolean;
  creating: boolean;
};

type AcceslyActionButtonProps = {
  label: string;
  className?: string;
  disabled?: boolean;
  loadingLabel?: string;
  fallbackLabel?: string;
  onBeforeConnect?: () => Promise<void> | void;
  onError?: (message: string) => void;
};

type ReadyButtonProps = {
  useAccesly: UseAcceslyHook;
} & AcceslyActionButtonProps;

function ReadyAcceslyActionButton({
  useAccesly,
  label,
  className,
  disabled,
  loadingLabel = 'Loading Google Wallet...',
  onBeforeConnect,
  onError,
}: ReadyButtonProps) {
  const { connect, loading, creating } = useAccesly();
  const [running, setRunning] = useState(false);

  const handleClick = async () => {
    if (running) return;
    setRunning(true);
    try {
      await onBeforeConnect?.();
      await connect();
    } catch (error: any) {
      const message = error?.message || 'Google wallet flow failed';
      if (message !== 'Authentication cancelled') {
        onError?.(message);
      }
    } finally {
      setRunning(false);
    }
  };

  const isDisabled = Boolean(disabled || running || loading || creating);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={className || 'btn-secondary w-full py-3 text-sm'}
    >
      {running || loading || creating ? loadingLabel : label}
    </button>
  );
}

export default function AcceslyActionButton({
  label,
  className,
  disabled,
  loadingLabel = 'Loading Google Wallet...',
  fallbackLabel = 'Google / Accesly Unavailable',
  onBeforeConnect,
  onError,
}: AcceslyActionButtonProps) {
  const [useAcceslyHook, setUseAcceslyHook] = useState<UseAcceslyHook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const mod = (await import('accesly')) as {
          useAccesly?: UseAcceslyHook;
        };
        if (!cancelled && mod?.useAccesly) {
          setUseAcceslyHook(() => mod.useAccesly!);
        }
      } catch {
        if (!cancelled) {
          setUseAcceslyHook(null);
        }
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
      <button
        type="button"
        disabled
        className={className || 'btn-secondary w-full py-3 text-sm opacity-70'}
      >
        {loadingLabel}
      </button>
    );
  }

  if (!useAcceslyHook) {
    return (
      <button
        type="button"
        disabled
        className={className || 'btn-secondary w-full py-3 text-sm opacity-70'}
      >
        {fallbackLabel}
      </button>
    );
  }

  return (
    <ReadyAcceslyActionButton
      useAccesly={useAcceslyHook}
      label={label}
      className={className}
      disabled={disabled}
      loadingLabel={loadingLabel}
      onBeforeConnect={onBeforeConnect}
      onError={onError}
    />
  );
}
