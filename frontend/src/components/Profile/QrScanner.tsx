// Camera QR scanner modal. Loaded lazily (React.lazy in ProfileOptions) so
// jsQR and this component stay out of the main bundle. Decodes ~10 frames/s
// from getUserMedia; first hit wins. Never auto-saves — the caller decides
// what to do with the decoded text.
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

interface Props {
  onResult: (text: string) => void;
  onClose: () => void;
}

const COPY: Record<Language, {
  title: string;
  hint: string;
  denied: string;
  close: string;
}> = {
  en: {
    title: 'Scan your Bre-B QR',
    hint: "Point the camera at your bank's Bre-B QR.",
    denied: 'Camera unavailable — type the llave instead.',
    close: 'Close',
  },
  es: {
    title: 'Escanea tu QR de Bre-B',
    hint: 'Apunta la cámara al QR de Bre-B de tu banco.',
    denied: 'Cámara no disponible — escribe la llave manualmente.',
    close: 'Cerrar',
  },
  pt: {
    title: 'Escaneie seu QR do Bre-B',
    hint: 'Aponte a câmera para o QR do Bre-B do seu banco.',
    denied: 'Câmera indisponível — digite a chave manualmente.',
    close: 'Fechar',
  },
};

const SCAN_INTERVAL_MS = 100;

export default function QrScanner({ onResult, onClose }: Props) {
  const { language } = useI18n();
  const copy = COPY[language];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId = 0;
    let lastScan = 0;
    let done = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
      } catch {
        setDenied(true);
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => setDenied(true));

      const tick = (now: number) => {
        if (done) return;
        if (now - lastScan >= SCAN_INTERVAL_MS && video.readyState >= 2) {
          lastScan = now;
          const canvas = canvasRef.current;
          if (canvas && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(image.data, image.width, image.height);
              if (code?.data) {
                done = true;
                onResult(code.data);
                return;
              }
            }
          }
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    })();

    return () => {
      done = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

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

        {denied ? (
          <p className="py-8 text-center text-sm text-ink-3">{copy.denied}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              className="aspect-square w-full rounded-xl bg-muted object-cover"
              muted
              playsInline
            />
            <p className="mt-3 text-center text-xs text-ink-3">{copy.hint}</p>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
