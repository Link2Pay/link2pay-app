import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X, Landmark, ArrowRight, ExternalLink } from 'lucide-react';
import {
  offrampPayIntent,
  offrampSubmit,
  offrampStatus,
  offrampPathQuote,
  offrampSetAmount,
  getFxRate,
} from '../../services/api';
import WalletRoller from './WalletRoller';
import type { PublicInvoice } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';
import { shortenAddress } from '../../lib/format';
import { config } from '../../config';
import { kitSignWith } from '../../services/walletsKit';

type OffRampStep = 'idle' | 'paying' | 'settling' | 'settled' | 'error';

// Demo COP rate for the pre-quote estimate shown while the payer types an
// amount. Mirrors the backend MockBreBAdapter — the firm quote comes back from
// the server once the amount is submitted.
const SIMULATED_USDC_COP_RATE = 4120.5;

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
  const { t } = useI18n();
  const [step, setStep] = useState<OffRampStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(invoice.transactionHash || null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollActiveRef = useRef(false);

  // Open-amount Bre-B: the payer sets the amount here before the pay step.
  const [amountInput, setAmountInput] = useState('');
  const [settingAmount, setSettingAmount] = useState(false);
  const needsAmount = invoice.isOpenAmount && invoice.status === 'PENDING';

  // Wallet roller: payer identity stays page-local; never touches walletStore.
  const [kitAddress, setKitAddress] = useState<string | null>(null);

  // Phase 7: optional live Reflector FX estimate (dormant unless the feed has COP).
  const [fxEstimate, setFxEstimate] = useState<string | null>(null);

  // Phase 5: pay-in-any-asset (flagged). sourceAsset === invoice.currency means a direct payment.
  const pathEnabled = config.enablePathPayments;
  const [sourceAsset, setSourceAsset] = useState<string>(invoice.currency);
  const [pathPreview, setPathPreview] = useState<string | null>(null);
  const isPathPay = pathEnabled && sourceAsset !== invoice.currency;

  const isTestnet = invoice.networkPassphrase?.includes('Test');
  const copAmount = formatCop(invoice.quoteBuyAmount);

  // Before the amount is set (open-amount), reflect what the payer is typing in
  // the summary using the demo rate; afterwards use the firm quote from the server.
  const parsedAmountInput = parseFloat(amountInput);
  const displayPay = needsAmount
    ? Number.isFinite(parsedAmountInput)
      ? parsedAmountInput
      : 0
    : parseFloat(invoice.total);
  const displayCop = needsAmount
    ? parsedAmountInput > 0
      ? formatCop((parsedAmountInput * SIMULATED_USDC_COP_RATE).toString())
      : null
    : copAmount;

  const settled = invoice.status === 'SETTLED_FIAT' || step === 'settled';
  const inFlight = IN_FLIGHT.has(invoice.status) || step === 'settling';
  // An open-amount invoice sits in PENDING waiting for the payer to choose an
  // amount — that's the amount-entry state, not "receiver still preparing".
  const preparing = PREPARING.has(invoice.status) && !needsAmount;
  const readyToPay = invoice.status === 'AWAITING_PAYMENT' && step === 'idle';
  const failed = invoice.status === 'ANCHOR_ERROR' || invoice.status === 'EXPIRED' || step === 'error';

  // Poll the anchor status whenever the payment is in flight, until it settles.
  const poll = useCallback(async () => {
    try {
      const res = await offrampStatus(invoice.id);
      if (!pollActiveRef.current) return;
      if (res.status === 'SETTLED_FIAT') {
        setStep('settled');
        onRefresh();
        return;
      }
      if (res.status === 'ANCHOR_ERROR' || res.status === 'EXPIRED') {
        setError(t('payment.offramp.anchorError'));
        setStep('error');
        return;
      }
      onRefresh();
    } catch {
      /* transient — keep polling */
    }
    if (!pollActiveRef.current) return;
    pollRef.current = setTimeout(poll, 5000);
  }, [invoice.id, onRefresh, t]);

  useEffect(() => {
    if (inFlight) {
      pollActiveRef.current = true;
      poll();
    }
    return () => {
      pollActiveRef.current = false;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFlight, step]);

  // Preview how much of the chosen asset the payer would send (path payment).
  useEffect(() => {
    let cancelled = false;
    if (!isPathPay) {
      setPathPreview(null);
      return;
    }
    setPathPreview('…');
    offrampPathQuote(invoice.id, sourceAsset, invoice.networkPassphrase)
      .then((q) => {
        if (cancelled) return;
        setPathPreview(q.found ? `≈ ${parseFloat(q.sendMax).toFixed(4)} ${sourceAsset} (max)` : 'No route found');
      })
      .catch(() => !cancelled && setPathPreview('No route found'));
    return () => {
      cancelled = true;
    };
  }, [isPathPay, sourceAsset, invoice.id, invoice.networkPassphrase]);

  // Fetch the live oracle estimate once (flagged; only shows if the feed has it).
  useEffect(() => {
    if (!config.enableFxPreview) return;
    let cancelled = false;
    getFxRate('COP')
      .then((r) => {
        if (cancelled || !r.available || !r.rate || !invoice.quoteBuyAmount) return;
        // Show an oracle-derived COP estimate from the USDC total.
        const est = parseFloat(invoice.total) * parseFloat(r.rate);
        if (Number.isFinite(est)) setFxEstimate(est.toLocaleString('es-CO', { maximumFractionDigits: 0 }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [invoice.total, invoice.quoteBuyAmount]);

  const handleSetAmount = async () => {
    const amt = parseFloat(amountInput);
    if (!(amt > 0)) {
      setError(t('payment.offramp.enterPositiveAmount'));
      return;
    }
    setSettingAmount(true);
    setError(null);
    try {
      // Persists the amount, quotes, and initiates the anchor withdraw. On
      // refresh the invoice comes back as AWAITING_PAYMENT and the pay UI shows.
      await offrampSetAmount(invoice.id, amt);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || t('payment.offramp.couldNotSetAmount'));
    } finally {
      setSettingAmount(false);
    }
  };

  const handlePay = async () => {
    if (!kitAddress) return;
    setStep('paying');
    setError(null);
    try {
      const intent = await offrampPayIntent(
        invoice.id,
        kitAddress,
        invoice.networkPassphrase,
        isPathPay ? sourceAsset : undefined
      );
      const signedXdr = await kitSignWith(kitAddress, intent.transactionXdr, intent.networkPassphrase);
      const result = await offrampSubmit(invoice.id, signedXdr, intent.depositAddress);
      if (!result.success) throw new Error(t('payment.offramp.txSubmissionFailed'));
      setTxHash(result.transactionHash);
      setStep('settling');
      onRefresh();
    } catch (err: any) {
      if (err?.message === 'NO_PATH_FOUND' || err?.status === 409) {
        setSourceAsset(invoice.currency);
        setError(t('payment.offramp.noSwapRoute', { source: sourceAsset, target: invoice.currency }));
        setStep('idle');
        return;
      }
      setError(err?.message || t('payment.offramp.paymentFailed'));
      setStep('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* COP payout summary */}
      <div className="rounded-2xl border border-warning-border bg-warning-subtle p-4">
        <div className="flex items-center gap-2 text-warning">
          <Landmark className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-2xs font-medium uppercase tracking-label">{t('payment.offramp.title')}</span>
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-sm">
          <div className="min-w-0 text-center">
            <p className="truncate font-mono text-base font-bold text-ink-0 [font-variant-numeric:tabular-nums]">
              {displayPay.toFixed(2)} {invoice.currency}
            </p>
            <p className="text-3xs uppercase tracking-wider text-ink-3">{t('payment.offramp.youPay')}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
          <div className="min-w-0 text-center">
            <p className="truncate font-mono text-base font-bold text-warning [font-variant-numeric:tabular-nums]">
              {displayCop ? `≈ $${displayCop} COP` : '—'}
            </p>
            <p className="text-3xs uppercase tracking-wider text-ink-3">{t('payment.offramp.receiverGets')}</p>
          </div>
        </div>
        {invoice.payoutAlias && (
          <p className="mt-2 text-center text-2xs text-ink-3">
            {t('payment.offramp.toLlave')} <span className="font-mono">{invoice.payoutAlias}</span>
          </p>
        )}
        {fxEstimate && (
          <p className="mt-2 text-center text-2xs text-ink-3">
            {t('payment.offramp.oracleEstimate', { amount: fxEstimate })}
          </p>
        )}
        {/* Only local dev runs the mock anchor — deployed envs settle for real. */}
        {import.meta.env.DEV && (
          <p className="mt-3 text-center">
            <span className="badge bg-warning-subtle text-warning border-warning-border">
              {t('payment.simulatedSettlement')}
            </span>
          </p>
        )}
      </div>

      {/* States */}
      {needsAmount && (
        <div className="space-y-3">
          <div>
            <label className="label">
              {t('payment.offramp.amountToPay', { currency: invoice.currency })}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                autoFocus
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.00"
                className="input pr-16 text-lg font-mono"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-3">
                {invoice.currency}
              </span>
            </div>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            onClick={handleSetAmount}
            disabled={settingAmount || !(parseFloat(amountInput) > 0)}
            className="btn-primary w-full py-3 text-base"
          >
            {settingAmount ? t('payment.offramp.preparing') : t('payment.offramp.continue')}
          </button>
          <p className="text-center text-2xs text-ink-4">
            {t('payment.offramp.amountHelp')}
          </p>
        </div>
      )}

      {preparing && (
        <div className="rounded-xl border border-surface-3 bg-surface-1 p-4 text-center">
          <p className="text-sm text-ink-2">{t('payment.offramp.receiverPreparing')}</p>
          <p className="mt-1 text-xs text-ink-3">{t('payment.offramp.checkBack')}</p>
        </div>
      )}

      {readyToPay && !kitAddress && (
        <div className="space-y-3">
          <p className="text-sm text-ink-2 text-center">{t('payment.offramp.connectToPay')}</p>
          {config.enableWalletsKit ? (
            <WalletRoller
              networkPassphrase={invoice.networkPassphrase}
              onConnect={setKitAddress}
              connectedAddress={kitAddress}
            />
          ) : null}
        </div>
      )}

      {readyToPay && kitAddress && (
        <div className="space-y-3">
          <div className="text-center text-xs text-ink-3">
            {t('payment.offramp.payingFrom')}{' '}
            <span className="font-mono tabular-nums">{shortenAddress(kitAddress, 8, 4)}</span>
          </div>
          {pathEnabled && (
            <div>
              <label className="label">{t('payment.offramp.payWith')}</label>
              <select
                value={sourceAsset}
                onChange={(e) => setSourceAsset(e.target.value)}
                className="input"
              >
                <option value={invoice.currency}>{invoice.currency} {t('payment.offramp.direct')}</option>
                {['XLM', 'USDC', 'EURC']
                  .filter((a) => a !== invoice.currency)
                  .map((a) => (
                    <option key={a} value={a}>{a} → {invoice.currency}</option>
                  ))}
              </select>
              {isPathPay && pathPreview && (
                <p className="mt-1 text-2xs text-ink-3">{t('payment.offramp.pathPreview', { preview: pathPreview, amount: `${parseFloat(invoice.total).toFixed(2)} ${invoice.currency}` })}</p>
              )}
            </div>
          )}
          <button
            onClick={handlePay}
            disabled={isPathPay && pathPreview === 'No route found'}
            className="btn-primary w-full py-3 text-base"
          >
            {isPathPay
              ? t('payment.offramp.payWithAsset', { asset: sourceAsset })
              : t('payment.offramp.payToAnchor', { amount: `${parseFloat(invoice.total).toFixed(2)} ${invoice.currency}` })}
          </button>
          <p className="text-center text-2xs text-ink-4">
            {t('payment.offramp.anchorHold')}
          </p>
        </div>
      )}

      {step === 'paying' && (
        <div role="status" className="py-4 text-center text-sm text-ink-1">
          {t('payment.offramp.signingPayment')}
        </div>
      )}

      {inFlight && !settled && !failed && (
        <div role="status" className="space-y-2 py-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-surface-2 border-t-primary" />
          <p className="text-sm text-ink-1">{t('payment.offramp.settlingCop')}</p>
          <p className="text-xs text-ink-3">{t('payment.offramp.pageAutoUpdates')}</p>
        </div>
      )}

      {settled && (
        <div role="status" className="space-y-3 py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle">
            <Check className="h-7 w-7 text-success" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-0">{t('payment.offramp.settledTitle')}</h3>
            <p className="mt-1 text-sm text-ink-3">
              {copAmount
                ? t('payment.offramp.settledBody', { amount: copAmount, alias: invoice.payoutAlias || t('payment.offramp.theBreBLlave') })
                : t('payment.offramp.settledBodyNoAmount')}
            </p>
            {import.meta.env.DEV && (
              <p className="mt-1 text-2xs text-warning">{t('payment.simulatedSettlement')}</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            {txHash && (
              <a
                href={`https://stellar.expert/explorer/${isTestnet ? 'testnet' : 'public'}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
              >
                {t('payment.offramp.viewOnchainPayment')} <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {invoice.receiptTxHash && (
              <a
                href={`https://stellar.expert/explorer/${isTestnet ? 'testnet' : 'public'}/tx/${invoice.receiptTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"
              >
                {t('payment.offramp.viewOnchainReceipt')} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      )}

      {failed && (
        <div role="alert" className="space-y-3 py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive-subtle">
            <X className="h-7 w-7 text-danger" aria-hidden="true" />
          </div>
          <p className="text-sm text-danger">{error || t('payment.offramp.offrampFailed')}</p>
          {invoice.status === 'AWAITING_PAYMENT' && (
            <button onClick={() => setStep('idle')} className="btn-secondary text-sm">
              {t('payment.tryAgain')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
