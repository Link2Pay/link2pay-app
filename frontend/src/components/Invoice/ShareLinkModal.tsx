// Share a payment link as a branded QR card: previews the PNG and offers
// WhatsApp / X (link with message), the native share sheet (image + link,
// where supported) and a download. Web intents can't carry an image —
// that's a platform limit, so those two share the link text only.
import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';
import { X, Share2, Download, Copy } from 'lucide-react';
import { buildShareCardPng, sharePng, downloadPng, canShareFiles } from '../../lib/shareCard';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

interface Props {
  paymentLink: string;
  amountLabel: string;
  name?: string | null;
  invoiceNumber: string;
  onClose: () => void;
}

const COPY: Record<Language, {
  title: string;
  hint: string;
  shareText: string;
  whatsapp: string;
  x: string;
  nativeShare: string;
  copyImage: string;
  copiedImage: string;
  download: string;
  downloaded: string;
  close: string;
  error: string;
}> = {
  en: {
    title: 'Share payment link',
    hint: 'WhatsApp and X share the link. To send the image itself, use Share or download it.',
    shareText: 'Pay me with Link2Pay:',
    whatsapp: 'WhatsApp',
    x: 'X',
    nativeShare: 'Share…',
    copyImage: 'Copy image',
    copiedImage: 'Image copied — paste it anywhere',
    download: 'Download image',
    downloaded: 'Image downloaded — the QR opens this link',
    close: 'Close',
    error: 'Could not create the image. Try again.',
  },
  es: {
    title: 'Compartir link de pago',
    hint: 'WhatsApp y X comparten el link. Para enviar la imagen, usa Compartir o descárgala.',
    shareText: 'Págame con Link2Pay:',
    whatsapp: 'WhatsApp',
    x: 'X',
    nativeShare: 'Compartir…',
    copyImage: 'Copiar imagen',
    copiedImage: 'Imagen copiada — pégala donde quieras',
    download: 'Descargar imagen',
    downloaded: 'Imagen descargada — el QR abre este link',
    close: 'Cerrar',
    error: 'No se pudo crear la imagen. Inténtalo de nuevo.',
  },
  pt: {
    title: 'Compartilhar link de pagamento',
    hint: 'WhatsApp e X compartilham o link. Para enviar a imagem, use Compartilhar ou baixe-a.',
    shareText: 'Me pague com Link2Pay:',
    whatsapp: 'WhatsApp',
    x: 'X',
    nativeShare: 'Compartilhar…',
    copyImage: 'Copiar imagem',
    copiedImage: 'Imagem copiada — cole onde quiser',
    download: 'Baixar imagem',
    downloaded: 'Imagem baixada — o QR abre este link',
    close: 'Fechar',
    error: 'Não foi possível criar a imagem. Tente novamente.',
  },
};

// Brand glyphs (lucide has no WhatsApp/X marks). Fill inherits currentColor.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

export default function ShareLinkModal({ paymentLink, amountLabel, name, invoiceNumber, onClose }: Props) {
  const { language } = useI18n();
  const copy = COPY[language];
  const qrWrapRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const filename = `link2pay-${invoiceNumber}.png`;
  const message = `${copy.shareText} ${paymentLink}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(copy.shareText)}&url=${encodeURIComponent(paymentLink)}`;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      const qrCanvas = qrWrapRef.current?.querySelector('canvas');
      if (!qrCanvas) { setFailed(true); return; }
      try {
        const blob = await buildShareCardPng({ qrCanvas, amountLabel, name, url: paymentLink });
        if (cancelled) return;
        blobRef.current = blob;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [paymentLink, amountLabel, name]);

  const handleNativeShare = async () => {
    if (!blobRef.current) return;
    await sharePng(blobRef.current, filename, paymentLink);
  };

  const handleDownload = () => {
    if (!blobRef.current) return;
    downloadPng(blobRef.current, filename);
    toast.success(copy.downloaded);
  };

  // Copying an image needs ClipboardItem (all evergreen browsers by now);
  // hide the button where it's missing and let Download take the row.
  const canCopyImage = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;

  const handleCopyImage = async () => {
    if (!blobRef.current) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobRef.current })]);
      toast.success(copy.copiedImage);
    } catch {
      toast.error(copy.error);
    }
  };

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

        {/* Offscreen QR source for the card composition. */}
        <div ref={qrWrapRef} className="hidden" aria-hidden="true">
          <QRCodeCanvas value={paymentLink} size={512} marginSize={0} />
        </div>

        {failed ? (
          <p className="py-10 text-center text-sm text-danger">{copy.error}</p>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={copy.title}
            className="mx-auto max-h-[45vh] w-auto rounded-xl border border-surface-3"
          />
        ) : (
          <div className="flex justify-center py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
            <WhatsAppIcon className="h-4 w-4" />
            {copy.whatsapp}
          </a>
          <a href={xUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
            <XIcon className="h-4 w-4" />
            {copy.x}
          </a>
          {canShareFiles() && (
            <button type="button" onClick={handleNativeShare} disabled={!previewUrl} className="btn-secondary col-span-2 text-sm">
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {copy.nativeShare}
            </button>
          )}
          {canCopyImage && (
            <button type="button" onClick={handleCopyImage} disabled={!previewUrl} className="btn-ghost text-sm">
              <Copy className="h-4 w-4" aria-hidden="true" />
              {copy.copyImage}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={!previewUrl}
            className={`btn-ghost text-sm ${canCopyImage ? '' : 'col-span-2'}`}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {copy.download}
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-3">{copy.hint}</p>
      </div>
    </div>
  );
}
