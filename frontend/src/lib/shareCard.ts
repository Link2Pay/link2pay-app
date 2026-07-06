// Branded share-card PNG for a payment link: Link2Pay wordmark, amount,
// QR code and the URL, composed on a canvas. Shared via the native share
// sheet (image + link travel together) with a download fallback.

const FONT = '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';

const W = 1080;
const H = 1350;

const INK = '#1a1712';
const INK_SOFT = '#6b6353';
const BG = '#faf8f4';
const CARD = '#ffffff';
const ACCENT = '#b8860b';

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface ShareCardInput {
  /** Canvas already holding the rendered QR (e.g. qrcode.react's QRCodeCanvas). */
  qrCanvas: HTMLCanvasElement;
  amountLabel: string;
  /** Merchant display name; omitted from the card when empty. */
  name?: string | null;
  url: string;
}

export async function buildShareCardPng({ qrCanvas, amountLabel, name, url }: ShareCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Wordmark
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `700 64px ${FONT}`;
  ctx.fillText('Link2Pay', W / 2, 148);
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(W / 2 + ctx.measureText('Link2Pay').width / 2 + 26, 130, 10, 0, Math.PI * 2);
  ctx.fill();

  // QR tile
  const tile = 640;
  const tileX = (W - tile) / 2;
  const tileY = 220;
  ctx.save();
  ctx.shadowColor = 'rgba(26, 23, 18, 0.12)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = CARD;
  roundedRect(ctx, tileX, tileY, tile, tile, 48);
  ctx.fill();
  ctx.restore();
  const qrSize = tile - 120;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(qrCanvas, tileX + 60, tileY + 60, qrSize, qrSize);
  ctx.imageSmoothingEnabled = true;

  // Amount + name
  ctx.fillStyle = INK;
  ctx.font = `700 96px ${FONT}`;
  ctx.fillText(amountLabel, W / 2, tileY + tile + 150);
  if (name) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = `400 44px ${FONT}`;
    ctx.fillText(name, W / 2, tileY + tile + 224);
  }

  // URL footer
  ctx.fillStyle = ACCENT;
  ctx.font = `600 36px ${MONO}`;
  const shortUrl = url.replace(/^https?:\/\//, '');
  ctx.fillText(shortUrl.length > 48 ? `${shortUrl.slice(0, 45)}…` : shortUrl, W / 2, H - 90);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

/**
 * Share the PNG through the native share sheet (with the link as caption)
 * when the platform supports sharing files; otherwise download it.
 * Returns which path was taken so callers can word their toast.
 */
export async function sharePng(blob: Blob, filename: string, url: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: url });
      return 'shared';
    } catch (err) {
      // AbortError = user closed the sheet; treat as done, don't force a download.
      if ((err as DOMException)?.name === 'AbortError') return 'shared';
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  return 'downloaded';
}
