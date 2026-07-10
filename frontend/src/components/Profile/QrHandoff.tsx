// Desktop side of the "continue on phone" handoff: mints a scan session,
// shows its URL as a QR for the phone, and polls until the llave arrives.
// Loaded lazily from ProfileOptions alongside QrScanner.
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Camera, RefreshCw } from 'lucide-react';
import { createScanSession, getScanSession } from '../../services/api';
import { useWalletStore } from '../../store/walletStore';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

interface Props {
  onResult: (llave: string) => void;
  onUseCamera: () => void;
  onClose: () => void;
}

const COPY: Record<Language, {
  title: string;
  hint: string;
  expired: string;
  retry: string;
  useCamera: string;
  close: string;
  error: string;
}> = {
  en: {
    title: 'Continue on your phone',
    hint: "Scan this code with your phone, then point its camera at your bank's Bre-B QR.",
    expired: 'The code expired.',
    retry: 'Generate a new code',
    useCamera: "Use this device's camera instead",
    close: 'Close',
    error: 'Could not start the handoff. Try again.',
  },
  es: {
    title: 'Continúa en tu teléfono',
    hint: 'Escanea este código con tu teléfono y luego apunta su cámara al QR de Bre-B de tu banco.',
    expired: 'El código expiró.',
    retry: 'Generar un código nuevo',
    useCamera: 'Usar la cámara de este dispositivo',
    close: 'Cerrar',
    error: 'No se pudo iniciar el proceso. Inténtalo de nuevo.',
  },
  pt: {
    title: 'Continue no seu telefone',
    hint: 'Escaneie este código com seu telefone e aponte a câmera para o QR do Bre-B do seu banco.',
    expired: 'O código expirou.',
    retry: 'Gerar um novo código',
    useCamera: 'Usar a câmera deste dispositivo',
    close: 'Fechar',
    error: 'Não foi possível iniciar o processo. Tente novamente.',
  },
};

const POLL_MS = 2000;

export default function QrHandoff({ onResult, onUseCamera, onClose }: Props) {
  const { language } = useI18n();
  const copy = COPY[language];
  const { publicKey } = useWalletStore();
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'waiting' | 'expired' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (!publicKey) return;
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      setState('loading');
      let created: { token: string; expiresAt: number };
      try {
        created = await createScanSession(publicKey);
      } catch {
        if (!cancelled) setState('error');
        return;
      }
      if (cancelled) return;
      setToken(created.token);
      setState('waiting');

      const poll = async () => {
        if (cancelled) return;
        if (Date.now() >= created.expiresAt) {
          setState('expired');
          return;
        }
        try {
          const result = await getScanSession(created.token, publicKey);
          if (cancelled) return;
          if (result.status === 'ready') {
            onResultRef.current(result.llave);
            return;
          }
        } catch {
          if (!cancelled) setState('expired');
          return;
        }
        pollTimer = setTimeout(poll, POLL_MS);
      };
      pollTimer = setTimeout(poll, POLL_MS);
    })();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [publicKey, attempt]);

  const scanUrl = token ? `${window.location.origin}/scan/${token}` : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-popover p-4 shadow-overlay"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-0">{copy.title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="rounded-lg p-1.5 text-ink-3 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {state === 'waiting' && scanUrl ? (
          <>
            <div className="flex justify-center rounded-xl bg-white p-4">
              <QRCodeSVG value={scanUrl} size={192} level="M" />
            </div>
            <p className="mt-3 text-center text-xs text-ink-3">{copy.hint}</p>
          </>
        ) : state === 'expired' ? (
          <div className="py-6 text-center">
            <p className="text-sm text-ink-3">{copy.expired}</p>
            <button type="button" className="btn-primary mt-3 text-sm" onClick={() => setAttempt((a) => a + 1)}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              {copy.retry}
            </button>
          </div>
        ) : state === 'error' ? (
          <p className="py-6 text-center text-sm text-danger">{copy.error}</p>
        ) : (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        )}

        <button type="button" className="btn-ghost mt-4 w-full text-sm" onClick={onUseCamera}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          {copy.useCamera}
        </button>
      </div>
    </div>
  );
}
