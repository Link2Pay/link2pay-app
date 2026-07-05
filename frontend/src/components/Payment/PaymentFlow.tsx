import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, Info, ArrowRight, ArrowDown } from 'lucide-react';
import { getInvoice, createPayIntent, submitPayment, getPaymentStatus, getXlmPrice } from '../../services/api';
import { kitSignWith, kitGetNetwork } from '../../services/walletsKit';
import InvoiceStatusBadge from '../Invoice/InvoiceStatusBadge';
import WalletRoller from './WalletRoller';
import OffRampPayment from './OffRampPayment';
import BrandMark from '../BrandMark';
import BrandWordmark from '../BrandWordmark';
import type { PublicInvoice, InvoiceStatus } from '../../types';
import InvoiceDocument from '../Invoice/InvoiceDocument';
import { formatAmount } from '../../lib/format';
import { config } from '../../config';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

type PayStep = 'loading' | 'view' | 'paying' | 'confirming' | 'success' | 'error' | 'closed';

type CheckoutStepLabels = {
  progress: string;
  loaded: string;
  wallet: string;
  signed: string;
  settled: string;
};

const CHECKOUT_STEP_LABELS: Record<Language, CheckoutStepLabels> = {
  en: {
    progress: 'Checkout progress',
    loaded: 'Link loaded',
    wallet: 'Wallet connected',
    signed: 'Transaction signed',
    settled: 'Settlement confirmed',
  },
  es: {
    progress: 'Progreso del checkout',
    loaded: 'Link cargado',
    wallet: 'Wallet conectada',
    signed: 'Transacción firmada',
    settled: 'Liquidación confirmada',
  },
  pt: {
    progress: 'Progresso do checkout',
    loaded: 'Link carregado',
    wallet: 'Wallet conectada',
    signed: 'Transação assinada',
    settled: 'Liquidação confirmada',
  },
};

function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function launchSep7Uri(uri: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId = 0;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
    };

    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        finish(true);
      }
    };

    const onWindowBlur = () => finish(true);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);

    timeoutId = window.setTimeout(() => {
      finish(document.hidden);
    }, 1200);

    try {
      window.location.assign(uri);
    } catch {
      finish(false);
    }
  });
}

export default function PaymentFlow() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [step, setStep] = useState<PayStep>('loading');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [xlmPriceUsd, setXlmPriceUsd] = useState<number | null>(null);
  const [kitAddress, setKitAddress] = useState<string | null>(null);
  const [hasNetworkMismatch, setHasNetworkMismatch] = useState(false);
  // Open-amount invoices: the payer types the amount here at pay time.
  const [payAmount, setPayAmount] = useState('');
  const stepLabels = CHECKOUT_STEP_LABELS[language];

  useEffect(() => {
    if (!id) return;

    getInvoice(id)
      .then((inv) => {
        setInvoice(inv);
        if (inv.status === 'PAID' || inv.status === 'SETTLED_FIAT') {
          setStep('success');
          setTxHash(inv.transactionHash || null);
        } else if (inv.status === 'CANCELLED' || inv.status === 'EXPIRED') {
          // Terminal, non-payable states — never render an active Pay button.
          setStep('closed');
        } else {
          // Always show pay action. If wallet is not connected in-page,
          // payment falls back to SEP-7 deep-link flow.
          setStep('view');
        }
      })
      .catch((err) => {
        setError(err.message);
        setStep('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Detect Kit wallet network mismatch when a connected wallet is on the wrong network.
  useEffect(() => {
    if (!kitAddress || !invoice) return;
    let cancelled = false;
    const check = async () => {
      const info = await kitGetNetwork();
      if (cancelled || !info) return;
      const mismatch = info.networkPassphrase !== invoice.networkPassphrase;
      if (mismatch !== hasNetworkMismatch) {
        setHasNetworkMismatch(mismatch);
      }
    };
    check();
    const interval = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [kitAddress, invoice, hasNetworkMismatch]);

  // Fetch XLM price for USD equivalent display
  useEffect(() => {
    if (!invoice || invoice.currency !== 'XLM') return;
    getXlmPrice()
      .then((price) => setXlmPriceUsd(price.usd))
      .catch(() => { /* silently ignore — USD equivalent is non-critical */ });
  }, [invoice]);

  // Elapsed seconds counter shown during confirming step
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (step !== 'confirming') {
      setElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [step]);

  // Exponential-backoff polling: 3s, 5s, 10s, 20s, 30s, then 60s
  const BACKOFF_INTERVALS = [3000, 5000, 10000, 20000, 30000, 60000];

  useEffect(() => {
    if (step !== 'confirming' || !id) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let attemptIndex = 0;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const status = await getPaymentStatus(id);
        if (status.status === 'PAID') {
          setTxHash(status.transactionHash);
          setStep('success');
          getInvoice(id).then(setInvoice).catch(() => {});
          return;
        }
      } catch (pollError: any) {
        // Respect backend rate limiting by jumping to max poll interval.
        if (pollError?.status === 429) {
          attemptIndex = BACKOFF_INTERVALS.length - 1;
        }
      }
      if (cancelled) return;
      const delay = BACKOFF_INTERVALS[Math.min(attemptIndex, BACKOFF_INTERVALS.length - 1)];
      attemptIndex++;
      timeoutId = setTimeout(poll, delay);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, id]);

  const handleManualRefresh = async () => {
    if (!id) return;
    try {
      const status = await getPaymentStatus(id);
      if (status.status === 'PAID') {
        setTxHash(status.transactionHash);
        setStep('success');
        getInvoice(id).then(setInvoice).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  // "Try again" after an error must not blindly re-open the pay form: the first
  // attempt may have actually landed on-chain (client threw after submit). Check
  // the authoritative status first, and only re-enable paying if it's still open.
  const handleTryAgain = async () => {
    if (id) {
      try {
        const status = await getPaymentStatus(id);
        if (status.status === 'PAID') {
          setTxHash(status.transactionHash);
          setStep('success');
          getInvoice(id).then(setInvoice).catch(() => {});
          return;
        }
      } catch {
        // fall through and let the payer retry
      }
    }
    setError(null);
    setStep('view');
  };

  const handlePay = async () => {
    if (!invoice || !id) return;
    const mobileDevice = isLikelyMobileDevice();

    // Block payment if there's a network mismatch
    if (hasNetworkMismatch) {
      setError('Please switch your wallet to the correct network first.');
      return;
    }

    // Open-amount links require the payer to enter a positive amount.
    if (invoice.isOpenAmount && !(parseFloat(payAmount) > 0)) {
      setError(t('payment.enterAmountPrompt'));
      return;
    }

    // On desktop, if no Kit wallet is connected, try SEP-7 deep link on mobile only.
    // Desktop without Kit wallet shows the roller — no old Freighter fallback.
    if (!kitAddress && !mobileDevice) {
      setError(t('payment.desktopConnectRequired'));
      return;
    }

    setStep('paying');
    setError(null);

    try {
      const payIntent = await createPayIntent(
        id,
        kitAddress || undefined,
        invoice.networkPassphrase,
        invoice.isOpenAmount ? payAmount : undefined
      );

      // When no in-page wallet is connected, use SEP-7 deep link flow.
      if (!kitAddress && payIntent.sep7Uri) {
        const launched = await launchSep7Uri(payIntent.sep7Uri);
        if (!launched) {
          throw new Error(t('payment.sep7NoHandlerMobile'));
        }
        setStep('confirming');
        return;
      }

      if (!payIntent.transactionXdr) {
        if (payIntent.sep7Uri) {
          const launched = await launchSep7Uri(payIntent.sep7Uri);
          if (!launched) {
            throw new Error(t('payment.sep7NoHandlerMobile'));
          }
          setStep('confirming');
          return;
        }
        throw new Error('Unable to build transaction for signing. Please reconnect your wallet and try again.');
      }

      const signedXdr = await kitSignWith(kitAddress!, payIntent.transactionXdr, payIntent.networkPassphrase);

      setStep('confirming');
      const result = await submitPayment(id, signedXdr);

      if (result.success) {
        setTxHash(result.transactionHash);
        setStep('success');
        getInvoice(id).then(setInvoice).catch(() => {});
      } else {
        throw new Error(t('payment.txSubmissionFailed'));
      }
    } catch (err: any) {
      console.error('[PaymentFlow] Payment error:', err);
      setError(err.message || t('payment.paymentFailedDefault'));
      setStep('error');
    }
  };

  const formatUsdEquivalent = (amount: string): string | null => {
    if (!xlmPriceUsd) return null;
    const usd = parseFloat(amount) * xlmPriceUsd;
    return usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const checkoutStage = (() => {
    if (step === 'success' || invoice?.status === 'PAID') return 3;
    if (step === 'confirming' || step === 'paying') return 2;
    if (kitAddress) return 1;
    return 0;
  })();
  const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
  const isTestnetInvoice = invoice?.networkPassphrase === TESTNET_PASSPHRASE;
  // Whole tracker is done once the payment lands.
  const allStepsDone = step === 'success' || invoice?.status === 'PAID';

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-ink-3 text-sm">{t('payment.loadingInvoice')}</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card p-6 text-center max-w-md">
          <p className="text-danger text-sm">{error || t('payment.invoiceNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto w-full max-w-4xl animate-in">
        <div className="mb-6 text-center">
          <BrandMark className="mx-auto mb-3 h-9 w-9" />
          <h1 className="font-display text-2xl font-extrabold text-ink-0">
            <BrandWordmark />
          </h1>
          <p className="mt-1 text-xs text-ink-3">{t('payment.invoicePayment')}</p>
          {invoice && (
            <span
              className={`mt-3 ${
                isTestnetInvoice
                  ? 'badge bg-warning-subtle text-warning border-warning-border'
                  : 'badge bg-success-subtle text-success border-success-border'
              }`}
            >
              {isTestnetInvoice ? t('payment.testnetPayment') : t('payment.mainnetPayment')}
            </span>
          )}
        </div>

        {/* Network Mismatch Warning Banner */}
        {hasNetworkMismatch && kitAddress && invoice && (
          <div className="mb-4 rounded-lg border border-destructive-border bg-destructive-subtle p-4">
            <div className="flex items-start gap-3">
              <Info className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-destructive mb-2">
                  {t('payment.networkMismatchTitle')}
                </h3>
                <p className="text-xs text-destructive mb-3">
                  {t('payment.networkMismatchDesc', {
                    current: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Mainnet' : 'Testnet',
                    required: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet',
                  })}
                </p>
                <p className="text-xs text-destructive">
                  {t('payment.switchInstructions', { network: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet' })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)] lg:items-start lg:gap-6">
        {/* ===== IZQUIERDA — Resumen del cobro ===== */}
        <div className="card overflow-hidden border border-border">
          <div className="border-b border-surface-3 p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-ink-3">{invoice.invoiceNumber}</span>
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            </div>
            <h2 className="font-display text-xl font-bold text-ink-0 sm:text-2xl">{invoice.title}</h2>
            {invoice.description && <p className="mt-1 text-sm text-ink-3">{invoice.description}</p>}
          </div>

          {invoice.invoiceType === 'BUSINESS_INVOICE' || invoice.invoiceType === 'SERVICE_INVOICE' ? (
            <>
              <div className="p-5 sm:p-6">
                <InvoiceDocument invoice={invoice} />
              </div>
            </>
          ) : (
            <>
              {(() => {
                const merchantName = invoice.freelancerName || invoice.freelancerCompany || t('payment.freelancer');
                const merchantInitial = merchantName.charAt(0).toUpperCase();
                const payerName = invoice.clientName || invoice.clientCompany || '';
                const payerInitial = (payerName || '?').charAt(0).toUpperCase();
                return (
                  <div className="grid grid-cols-1 items-center gap-4 border-b border-surface-3 bg-surface-1 p-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3 sm:p-6">
                    {/* De (comercio) — emisor, énfasis de marca */}
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-base font-semibold text-primary">
                        {invoice.freelancerLogoUrl ? (
                          <img src={invoice.freelancerLogoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          merchantInitial
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="label mb-0.5">{t('payment.from')}</p>
                        <p className="truncate font-display text-base font-bold text-ink-0">{merchantName}</p>
                        {invoice.freelancerCompany && invoice.freelancerName && (
                          <p className="truncate text-xs text-ink-3">{invoice.freelancerCompany}</p>
                        )}
                      </div>
                    </div>

                    {/* Dirección De → Para (flecha horizontal en desktop, vertical en mobile) */}
                    <div className="flex items-center justify-center text-ink-3" aria-hidden="true">
                      <ArrowRight className="hidden h-4 w-4 sm:block" />
                      <ArrowDown className="h-4 w-4 sm:hidden" />
                    </div>

                    {/* Para (pagador) — secundario, neutro */}
                    <div className="flex items-center gap-3 sm:justify-end sm:text-right">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-base font-semibold text-ink-2 sm:order-2">
                        {payerInitial}
                      </span>
                      <div className="min-w-0 sm:order-1">
                        <p className="label mb-0.5">{t('payment.to')}</p>
                        <p className="truncate text-sm font-semibold text-ink-0">{payerName || '—'}</p>
                        {invoice.clientCompany && invoice.clientName && (
                          <p className="truncate text-xs text-ink-3">{invoice.clientCompany}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {invoice.isOpenAmount ? (
                <div className="border-b border-surface-3 bg-info-subtle p-4 sm:p-6">
                  <p className="text-sm font-semibold text-info">{t('payment.openAmountTitle')}</p>
                  <p className="mt-1 text-xs text-ink-3">{t('payment.openAmountSubtitle')}</p>
                </div>
              ) : (
              <>
              <div className="border-b border-surface-3 p-4 sm:p-6">
                <div className="space-y-2">
                  {invoice.lineItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="pr-3">
                        <p className="text-ink-1 break-words">{item.description}</p>
                        <p className="text-xs text-ink-3">
                          {parseFloat(String(item.quantity))} x {parseFloat(String(item.rate)).toFixed(2)}
                        </p>
                      </div>
                      <span className="font-mono text-ink-0">{parseFloat(String(item.amount)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-surface-3 space-y-1">
                  <div className="flex items-center justify-between text-sm text-ink-3">
                    <span>{t('payment.subtotal')}</span>
                    <span className="font-mono">{parseFloat(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  {invoice.taxRate && parseFloat(invoice.taxRate) > 0 && (
                    <div className="flex items-center justify-between text-sm text-ink-3">
                      <span>{t('payment.tax', { rate: invoice.taxRate })}</span>
                      <span className="font-mono">{parseFloat(invoice.taxAmount || '0').toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="label mb-0">{t('payment.totalDue')}</span>
                  <div className="text-right">
                    <span className="font-display text-3xl font-extrabold text-ink-0 [font-variant-numeric:tabular-nums] sm:text-4xl">
                      {formatAmount(invoice.total, invoice.currency)}
                    </span>
                    {invoice.currency === 'XLM' && formatUsdEquivalent(invoice.total) && (
                      <p className="mt-0.5 text-xs text-ink-3 [font-variant-numeric:tabular-nums]">
                        {t('payment.usdEquivalent', { amount: formatUsdEquivalent(invoice.total)! })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              </>
              )}
            </>
          )}
        </div>

        {/* ===== DERECHA — Panel de pago (sticky en desktop) ===== */}
        <div className="card border border-border p-5 sm:p-6 lg:sticky lg:top-6">
          <div className="space-y-5">
            {/* Tracker de progreso del checkout (oculto en estados terminales negativos) */}
            {step !== 'error' && step !== 'closed' && (
              <div className="rounded-xl border border-surface-3 bg-surface-1 p-3">
                <p className="label mb-0">{stepLabels.progress}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-success transition-all duration-500"
                    style={{ width: `${(checkoutStage / 3) * 100}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[stepLabels.loaded, stepLabels.wallet, stepLabels.signed, stepLabels.settled].map((label, index) => {
                    const done = allStepsDone || index < checkoutStage;
                    const active = !allStepsDone && index === checkoutStage;
                    return (
                      <div
                        key={label}
                        className={`rounded-lg border px-2.5 py-2 transition-colors ${
                          done
                            ? 'border-success-border bg-success-subtle'
                            : active
                            ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20'
                            : 'border-surface-3 bg-card'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-3xs font-semibold ${
                              done
                                ? 'bg-success text-success-foreground'
                                : active
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-surface-2 text-ink-3'
                            }`}
                          >
                            {done ? <Check className="h-3 w-3" /> : index + 1}
                          </span>
                          <span
                            className={`text-2xs leading-tight ${
                              done ? 'text-success' : active ? 'font-semibold text-ink-0' : 'text-ink-3'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {invoice.payoutMethod === 'BRE_B' && (
              <OffRampPayment
                invoice={invoice}
                onRefresh={() => {
                  if (id) getInvoice(id).then(setInvoice).catch(() => {});
                }}
              />
            )}

            {invoice.payoutMethod !== 'BRE_B' && step === 'view' && (
              <div className="space-y-4">
                {/* Wallet roller for in-page Kit wallet connection */}
                {config.enableWalletsKit && (
                  <WalletRoller
                    networkPassphrase={invoice.networkPassphrase || ''}
                    onConnect={setKitAddress}
                    connectedAddress={kitAddress}
                  />
                )}

                {invoice.isOpenAmount && (
                  <div>
                    <label className="label">{t('payment.enterAmount')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        inputMode="decimal"
                        autoFocus
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        className="input pr-16 text-lg font-mono"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-3">
                        {invoice.currency}
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={handlePay}
                  disabled={hasNetworkMismatch || (invoice.isOpenAmount && !(parseFloat(payAmount) > 0))}
                  className="btn-primary w-full py-3 text-base"
                >
                  {hasNetworkMismatch
                    ? t('payment.paymentBlocked')
                    : invoice.isOpenAmount
                    ? parseFloat(payAmount) > 0
                      ? t('payment.payAmount', { amount: formatAmount(payAmount, invoice.currency) })
                      : t('payment.enterAmountPrompt')
                    : t('payment.payAmount', { amount: formatAmount(invoice.total, invoice.currency) })}
                </button>
                <p className="text-2xs text-ink-4 text-center">{t('payment.approveTransaction')}</p>
              </div>
            )}

            {step === 'paying' && (
              <div role="status" aria-live="polite" className="text-center space-y-3 py-4">
                <svg aria-hidden="true" className="animate-spin h-8 w-8 text-primary mx-auto" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <p className="text-sm text-ink-1">{t('payment.buildingTransaction')}</p>
                <p className="text-xs text-ink-3">{t('payment.pleaseApprove')}</p>
              </div>
            )}

            {step === 'confirming' && (
              <div role="status" aria-live="polite" className="text-center space-y-3 py-4">
                <svg aria-hidden="true" className="animate-spin h-8 w-8 text-primary mx-auto" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <p className="text-sm text-ink-1">{t('payment.confirmingNetwork')}</p>
                <p className="text-xs text-ink-3">{t('payment.usuallyTakes')}</p>
                <p className="text-xs text-ink-4 font-mono">
                  {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:
                  {String(elapsedSeconds % 60).padStart(2, '0')}
                </p>
                {elapsedSeconds >= 30 && (
                  <button
                    onClick={handleManualRefresh}
                    className="text-xs font-medium text-accent-ink hover:underline"
                  >
                    {t('payment.refreshStatus')}
                  </button>
                )}
              </div>
            )}

            {step === 'success' && (
              <div role="status" aria-live="polite" className="text-center space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-success-subtle flex items-center justify-center">
                  <Check aria-hidden="true" className="h-7 w-7 text-success" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-0">{t('payment.paymentSuccessful')}</h3>
                  <p className="text-sm text-ink-3 mt-1">
                    {t('payment.amountSent', {
                      amount: formatAmount(
                        // Open-amount links carry a 0 total until the backend refetch
                        // lands — show what the payer actually entered.
                        invoice.isOpenAmount && parseFloat(payAmount) > 0 ? payAmount : invoice.total,
                        invoice.currency
                      ),
                    })}
                  </p>
                </div>
                {txHash && (
                  <a
                    href={`https://stellar.expert/explorer/${invoice.networkPassphrase?.includes('Test') ? 'testnet' : 'public'}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-medium text-accent-ink hover:underline"
                  >
                    {t('payment.viewExplorer')}
                  </a>
                )}
              </div>
            )}

            {step === 'error' && (
              <div role="alert" className="text-center space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-destructive-subtle flex items-center justify-center">
                  <X aria-hidden="true" className="h-7 w-7 text-danger" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-0">{t('payment.paymentFailed')}</h3>
                  <p className="text-sm text-danger mt-1">{error}</p>
                </div>
                <button onClick={handleTryAgain} className="btn-secondary text-sm">
                  {t('payment.tryAgain')}
                </button>
              </div>
            )}

            {step === 'closed' && (
              <div role="status" className="text-center space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-surface-3 flex items-center justify-center">
                  <X aria-hidden="true" className="h-7 w-7 text-ink-3" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-0">
                    {invoice.status === 'EXPIRED'
                      ? t('payment.invoiceExpiredTitle')
                      : t('payment.invoiceCancelledTitle')}
                  </h3>
                  <p className="text-sm text-ink-3 mt-1">
                    {invoice.status === 'EXPIRED'
                      ? t('payment.invoiceExpiredBody')
                      : t('payment.invoiceCancelledBody')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-2xs text-ink-4">{t('payment.poweredBy')}</p>
        </div>
      </div>
    </div>
  );
}
