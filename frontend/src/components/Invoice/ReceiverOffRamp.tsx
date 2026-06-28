import { useState } from 'react';
import { Landmark, ExternalLink, Copy, Check } from 'lucide-react';
import { offrampQuote, offrampInitiate, type OffRampQuote, type OffRampIntentResponse } from '../../services/api';
import { useWalletStore } from '../../store/walletStore';
import type { Invoice } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';

interface Props {
  invoice: Invoice;
  onUpdated: () => void;
}

/**
 * Receiver-only panel: request a USDC→COP quote and initiate the SEP-24 withdraw,
 * which produces the anchor deposit address + memo the payer pays into.
 * The receiver never custodies funds — this only orchestrates the anchor flow.
 */
export default function ReceiverOffRamp({ invoice, onUpdated }: Props) {
  const { publicKey } = useWalletStore();
  const { t } = useI18n();
  const [alias, setAlias] = useState(invoice.payoutAlias || '');
  const [quote, setQuote] = useState<OffRampQuote | null>(null);
  const [intent, setIntent] = useState<OffRampIntentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const ready = invoice.status === 'AWAITING_PAYMENT' || !!invoice.anchorTxId;

  const handleQuote = async () => {
    if (!publicKey || !alias.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const q = await offrampQuote(
        invoice.id,
        { sellAmount: invoice.total, payoutAlias: alias.trim() },
        publicKey
      );
      setQuote(q);
      onUpdated();
    } catch (err: any) {
      setError(err?.message || 'Failed to get quote.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async () => {
    if (!publicKey || !quote) return;
    setLoading(true);
    setError(null);
    try {
      const i = await offrampInitiate(invoice.id, quote.quoteId, publicKey);
      setIntent(i);
      if (i.interactiveUrl) {
        window.open(i.interactiveUrl, '_blank', 'noopener,noreferrer,width=480,height=720');
      }
      onUpdated();
    } catch (err: any) {
      setError(err?.message || 'Failed to initiate off-ramp.');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/pay/${invoice.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const cop = quote ? parseFloat(quote.buyAmount).toLocaleString('es-CO', { maximumFractionDigits: 0 }) : null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-amber-800">
        <Landmark className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm font-semibold">Bre-B fiat off-ramp (COP)</span>
      </div>
      <p className="mt-1 text-[11px] text-amber-700">{t('payment.simulatedSettlement')}</p>

      {ready || intent ? (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-ink-2">
            Off-ramp initiated. Share the payment link — the payer sends {invoice.currency} to the anchor,
            and the COP payout lands on your llave.
          </p>
          {(intent || invoice.anchorTxId) && (
            <div className="rounded-md bg-white/70 p-2 text-xs">
              {intent?.depositAddress && (
                <p className="break-all">
                  <span className="text-ink-3">Anchor account: </span>
                  <span className="font-mono">{intent.depositAddress}</span>
                </p>
              )}
              {intent?.memo && (
                <p>
                  <span className="text-ink-3">Memo: </span>
                  <span className="font-mono">{intent.memo}</span> ({intent.memoType})
                </p>
              )}
            </div>
          )}
          {intent?.interactiveUrl && (
            <a
              href={intent.interactiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-stellar-600 hover:underline"
            >
              Reopen anchor interactive window <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <button onClick={copyLink} className="btn-secondary mt-1 inline-flex items-center gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy payment link'}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wide text-ink-3">
              Bre-B llave (payout alias)
            </label>
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. @nequi-3001234567"
              className="mt-1 w-full rounded-md border border-surface-3 bg-card px-3 py-2 text-sm"
            />
          </div>

          {!quote ? (
            <button
              onClick={handleQuote}
              disabled={loading || !alias.trim() || !publicKey}
              className="btn-primary w-full text-sm disabled:opacity-50"
            >
              {loading ? 'Requesting quote…' : `Get USDC→COP quote for ${parseFloat(invoice.total).toFixed(2)} ${invoice.currency}`}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-md bg-white/70 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-3">Receiver gets</span>
                  <span className="font-mono font-semibold text-amber-700">≈ ${cop} COP</span>
                </div>
                <div className="flex justify-between text-xs text-ink-3">
                  <span>Rate</span>
                  <span className="font-mono">{quote.rate}</span>
                </div>
                <div className="flex justify-between text-xs text-ink-3">
                  <span>Fee</span>
                  <span className="font-mono">{quote.feeTotal}</span>
                </div>
              </div>
              <button
                onClick={handleInitiate}
                disabled={loading}
                className="btn-primary w-full text-sm disabled:opacity-50"
              >
                {loading ? 'Initiating…' : 'Initiate off-ramp & generate payment link'}
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
