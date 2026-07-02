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
import { useWalletStore } from '../../store/walletStore';
import WalletConnect from '../Wallet/WalletConnect';
import type { PublicInvoice } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';
import { config } from '../../config';
import { kitMountButton, kitGetAddress, kitSign } from '../../services/walletsKit';

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
  const { publicKey, signTransaction } = useWalletStore();
  const { t } = useI18n();
  const [step, setStep] = useState<OffRampStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(invoice.transactionHash || null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against an in-flight poll that resolves *after* cleanup: without it,
  // the awaited request would reschedule a fresh timeout the cleanup can't reach.
  const pollActiveRef = useRef(false);

  // Open-amount Bre-B: the payer sets the amount here before the pay step.
  const [amountInput, setAmountInput] = useState('');
  const [settingAmount, setSettingAmount] = useState(false);
  const needsAmount = invoice.isOpenAmount && invoice.status === 'PENDING';

  // Phase 6: multi-wallet connect via Stellar Wallets Kit (flagged on).
  const walletsKit = config.enableWalletsKit;
  const kitBtnRef = useRef<HTMLDivElement | null>(null);
  const [kitAddress, setKitAddress] = useState<string | null>(null);
  // Effective payer: a Wallets-Kit wallet if connected, else Freighter via the store.
  const effectiveKey = kitAddress || publicKey;

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
        setError('The anchor reported an error completing the payout.');
        setStep('error');
        return;
      }
      onRefresh();
    } catch {
      /* transient — keep polling */
    }
    if (!pollActiveRef.current) return;
    pollRef.current = setTimeout(poll, 5000);
  }, [invoice.id, onRefresh]);

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

  // Mount the Wallets Kit button and detect a connected wallet by polling.
  useEffect(() => {
    if (!walletsKit || !readyToPay || effectiveKey || !kitBtnRef.current) return;
    let cancelled = false;
    kitMountButton(kitBtnRef.current, invoice.networkPassphrase).catch(() => {});
    const iv = setInterval(async () => {
      const addr = await kitGetAddress();
      if (!cancelled && addr) {
        setKitAddress(addr);
        clearInterval(iv);
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [walletsKit, readyToPay, effectiveKey, invoice.networkPassphrase]);

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
      setError('Enter an amount greater than 0.');
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
      setError(err?.message || 'Could not set the amount.');
    } finally {
      setSettingAmount(false);
    }
  };

  const handlePay = async () => {
    if (!effectiveKey) return;
    setStep('paying');
    setError(null);
    try {
      const intent = await offrampPayIntent(
        invoice.id,
        effectiveKey,
        invoice.networkPassphrase,
        isPathPay ? sourceAsset : undefined
      );
      const signedXdr = kitAddress
        ? await kitSign(intent.transactionXdr, intent.networkPassphrase)
        : await signTransaction(intent.transactionXdr, intent.networkPassphrase);
      const result = await offrampSubmit(invoice.id, signedXdr, intent.depositAddress);
      if (!result.success) throw new Error('Transaction submission failed.');
      setTxHash(result.transactionHash);
      setStep('settling');
      onRefresh();
    } catch (err: any) {
      // Thin liquidity — guide the payer back to paying USDC directly.
      if (err?.message === 'NO_PATH_FOUND' || err?.status === 409) {
        setSourceAsset(invoice.currency);
        setError(`No swap route for ${sourceAsset} right now — pay ${invoice.currency} directly instead.`);
        setStep('idle');
        return;
      }
      setError(err?.message || 'Payment failed.');
      setStep('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* COP payout summary */}
      <div className="rounded-lg border border-warning-border bg-warning-subtle p-4">
        <div className="flex items-center gap-2 text-warning">
          <Landmark className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-wide">Fiat off-ramp · Bre-B (COP)</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <div className="text-center">
            <p className="font-mono text-base font-bold text-ink-0">
              {displayPay.toFixed(2)} {invoice.currency}
            </p>
            <p className="text-3xs uppercase tracking-wider text-ink-3">You pay</p>
          </div>
          <ArrowRight className="h-4 w-4 text-ink-3" aria-hidden="true" />
          <div className="text-center">
            <p className="font-mono text-base font-bold text-warning">
              {displayCop ? `≈ $${displayCop} COP` : '—'}
            </p>
            <p className="text-3xs uppercase tracking-wider text-ink-3">Receiver gets</p>
          </div>
        </div>
        {invoice.payoutAlias && (
          <p className="mt-2 text-center text-2xs text-ink-3">
            To Bre-B llave <span className="font-mono">{invoice.payoutAlias}</span>
          </p>
        )}
        {fxEstimate && (
          <p className="mt-2 text-center text-2xs text-ink-3">
            Live oracle estimate: ≈ ${fxEstimate} COP <span className="text-ink-4">(Reflector — not the firm quote)</span>
          </p>
        )}
        <p className="mt-3 rounded-md bg-warning-subtle px-2.5 py-1.5 text-center text-2xs font-medium text-warning">
          {t('payment.simulatedSettlement')}
        </p>
      </div>

      {/* States */}
      {needsAmount && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-3">
              Amount to pay ({invoice.currency})
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
            className={`w-full py-3 text-base ${
              settingAmount || !(parseFloat(amountInput) > 0)
                ? 'btn-disabled cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {settingAmount ? 'Preparing…' : 'Continue'}
          </button>
          <p className="text-center text-2xs text-ink-4">
            You choose the amount; the receiver gets the equivalent in COP via Bre-B.
          </p>
        </div>
      )}

      {preparing && (
        <div className="rounded-lg border border-surface-3 bg-surface-1 p-4 text-center">
          <p className="text-sm text-ink-2">The receiver is still setting up this payout with the anchor.</p>
          <p className="mt-1 text-xs text-ink-3">Check back shortly — this page updates automatically.</p>
        </div>
      )}

      {readyToPay && !effectiveKey && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-ink-2">Connect a Stellar wallet to pay USDC to the anchor.</p>
          {walletsKit ? (
            <div ref={kitBtnRef} className="flex justify-center" />
          ) : (
            <WalletConnect variant="large" />
          )}
        </div>
      )}

      {readyToPay && effectiveKey && (
        <div className="space-y-3">
          <div className="text-center text-xs text-ink-3">
            Paying from <span className="font-mono">{effectiveKey.slice(0, 8)}...{effectiveKey.slice(-4)}</span>
          </div>
          {pathEnabled && (
            <div>
              <label className="text-2xs font-medium uppercase tracking-wide text-ink-3">Pay with</label>
              <select
                value={sourceAsset}
                onChange={(e) => setSourceAsset(e.target.value)}
                className="mt-1 w-full rounded-md border border-surface-3 bg-card px-3 py-2 text-sm"
              >
                <option value={invoice.currency}>{invoice.currency} (direct)</option>
                {['XLM', 'USDC', 'EURC']
                  .filter((a) => a !== invoice.currency)
                  .map((a) => (
                    <option key={a} value={a}>{a} → {invoice.currency}</option>
                  ))}
              </select>
              {isPathPay && pathPreview && (
                <p className="mt-1 text-2xs text-ink-3">You send {pathPreview}; anchor receives exactly {parseFloat(invoice.total).toFixed(2)} {invoice.currency}.</p>
              )}
            </div>
          )}
          <button
            onClick={handlePay}
            disabled={isPathPay && pathPreview === 'No route found'}
            className="btn-primary w-full py-3 text-base disabled:opacity-50"
          >
            Pay {isPathPay ? `with ${sourceAsset}` : `${parseFloat(invoice.total).toFixed(2)} ${invoice.currency}`} to anchor
          </button>
          <p className="text-center text-2xs text-ink-4">
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle">
            <Check className="h-7 w-7 text-success" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-0">Settled to fiat</h3>
            <p className="mt-1 text-sm text-ink-3">
              {copAmount ? `≈ $${copAmount} COP delivered to ${invoice.payoutAlias || 'the Bre-B llave'}` : 'COP delivered to the Bre-B llave'}
            </p>
            <p className="mt-1 text-2xs text-warning">{t('payment.simulatedSettlement')}</p>
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive-subtle">
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
