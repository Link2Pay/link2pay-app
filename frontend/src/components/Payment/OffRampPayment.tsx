import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X, Landmark, ArrowRight, ExternalLink } from 'lucide-react';
import {
  offrampPayIntent,
  offrampSubmit,
  offrampStatus,
} from '../../services/api';
import { useWalletStore } from '../../store/walletStore';
import WalletConnect from '../Wallet/WalletConnect';
import type { PublicInvoice } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';

type OffRampStep = 'idle' | 'paying' | 'settling' | 'settled' | 'error';

// Invoice statuses where the off-ramp is still being prepared by the receiver.
const PREPARING = new Set(['DRAFT', 'PENDING', 'AWAITING_ANCHOR']);
// Statuses where the on-chain USDC payment has landed and the anchor is paying out COP.
const IN_FLIGHT = new Set(['PROCESSING', 'SETTLING']);

interface Props {
  invoice: PublicInvoice;
  onRefresh: () => void;
}

function formatCop(amount?: string | null): string | null {
  if (!amount) return null;
  const n = parseFloat(amount);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

export default function OffRampPayment({ invoice, onRefresh }: Props) {
  const { publicKey, signTransaction } = useWalletStore();
  const { t } = useI18n();
  const [step, setStep] = useState<OffRampStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(invoice.transactionHash || null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTestnet = invoice.networkPassphrase?.includes('Test');
  const copAmount = formatCop(invoice.quoteBuyAmount);

  const settled = invoice.status === 'SETTLED_FIAT' || step === 'settled';
  const inFlight = IN_FLIGHT.has(invoice.status) || step === 'settling';
  const preparing = PREPARING.has(invoice.status);
  const readyToPay = invoice.status === 'AWAITING_PAYMENT' && step === 'idle';
  const failed = invoice.status === 'ANCHOR_ERROR' || invoice.status === 'EXPIRED' || step === 'error';

  // Poll the anchor status whenever the payment is in flight, until it settles.
  const poll = useCallback(async () => {
    try {
      const res = await offrampStatus(invoice.id);
      if (res.status === 'SETTLED_FIAT') {
        setStep('settled');
        onRefresh();
        return;
      }
      if (res.status === 'ANCHOR_ERROR' || res.status === 'EXPIRED') {
        setError('The anchor reported an error completing the payout.');
        setStep('error');
        return;
      }
      onRefresh();
    } catch {
      /* transient — keep polling */
    }
    pollRef.current = setTimeout(poll, 5000);
  }, [invoice.id, onRefresh]);

  useEffect(() => {
    if (inFlight) {
      poll();
    }
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFlight, step]);

  const handlePay = async () => {
    if (!publicKey) return;
    setStep('paying');
    setError(null);
    try {
      const intent = await offrampPayIntent(invoice.id, publicKey, invoice.networkPassphrase);
      const signedXdr = await signTransaction(intent.transactionXdr, intent.networkPassphrase);
      const result = await offrampSubmit(invoice.id, signedXdr, intent.depositAddress);
      if (!result.success) throw new Error('Transaction submission failed.');
      setTxHash(result.transactionHash);
      setStep('settling');
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Payment failed.');
      setStep('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* COP payout summary */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 text-amber-800">
          <Landmark className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wide">Fiat off-ramp · Bre-B (COP)</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <div className="text-center">
            <p className="font-mono text-base font-bold text-ink-0">
              {parseFloat(invoice.total).toFixed(2)} {invoice.currency}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-ink-3">You pay</p>
          </div>
          <ArrowRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
          <div className="text-center">
            <p className="font-mono text-base font-bold text-amber-700">
              {copAmount ? `≈ $${copAmount} COP` : '—'}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-ink-3">Receiver gets</p>
          </div>
        </div>
        {invoice.payoutAlias && (
          <p className="mt-2 text-center text-[11px] text-ink-3">
            To Bre-B llave <span className="font-mono">{invoice.payoutAlias}</span>
          </p>
        )}
        <p className="mt-3 rounded-md bg-amber-100 px-2.5 py-1.5 text-center text-[11px] font-medium text-amber-800">
          {t('payment.simulatedSettlement')}
        </p>
      </div>

      {/* States */}
      {preparing && (
        <div className="rounded-lg border border-surface-3 bg-surface-1 p-4 text-center">
          <p className="text-sm text-ink-2">The receiver is still setting up this payout with the anchor.</p>
          <p className="mt-1 text-xs text-ink-3">Check back shortly — this page updates automatically.</p>
        </div>
      )}

      {readyToPay && !publicKey && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-ink-2">Connect a Stellar wallet to pay USDC to the anchor.</p>
          <WalletConnect variant="large" />
        </div>
      )}

      {readyToPay && publicKey && (
        <div className="space-y-3">
          <div className="text-center text-xs text-ink-3">
            Paying from <span className="font-mono">{publicKey.slice(0, 8)}...{publicKey.slice(-4)}</span>
          </div>
          <button onClick={handlePay} className="btn-primary w-full py-3 text-base">
            Pay {parseFloat(invoice.total).toFixed(2)} {invoice.currency} to anchor
          </button>
          <p className="text-center text-[11px] text-ink-4">
            Your wallet pays the anchor directly with the exact memo. Link2Pay never holds your funds.
          </p>
        </div>
      )}

      {step === 'paying' && (
        <div role="status" className="py-4 text-center text-sm text-ink-1">
          Building and signing your USDC payment…
        </div>
      )}

      {inFlight && !settled && !failed && (
        <div role="status" className="space-y-2 py-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stellar-200 border-t-stellar-500" />
          <p className="text-sm text-ink-1">USDC received — anchor is settling COP to the Bre-B llave…</p>
          <p className="text-xs text-ink-3">This page updates automatically.</p>
        </div>
      )}

      {settled && (
        <div role="status" className="space-y-3 py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-0">Settled to fiat</h3>
            <p className="mt-1 text-sm text-ink-3">
              {copAmount ? `≈ $${copAmount} COP delivered to ${invoice.payoutAlias || 'the Bre-B llave'}` : 'COP delivered to the Bre-B llave'}
            </p>
            <p className="mt-1 text-[11px] text-amber-700">{t('payment.simulatedSettlement')}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {txHash && (
              <a
                href={`https://stellar.expert/explorer/${isTestnet ? 'testnet' : 'public'}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-stellar-600 hover:underline"
              >
                View on-chain USDC payment <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {invoice.receiptTxHash && (
              <a
                href={`https://stellar.expert/explorer/${isTestnet ? 'testnet' : 'public'}/tx/${invoice.receiptTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-stellar-600 hover:underline"
              >
                View on-chain receipt <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {failed && (
        <div role="alert" className="space-y-3 py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <X className="h-7 w-7 text-danger" aria-hidden="true" />
          </div>
          <p className="text-sm text-danger">{error || 'The off-ramp could not be completed.'}</p>
          {invoice.status === 'AWAITING_PAYMENT' && (
            <button onClick={() => setStep('idle')} className="btn-secondary text-sm">
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
