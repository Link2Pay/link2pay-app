import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { getInvoice, createPayIntent, submitPayment, getPaymentStatus, getXlmPrice } from '../../services/api';
import { useWalletStore } from '../../store/walletStore';
import InvoiceStatusBadge from '../Invoice/InvoiceStatusBadge';
import WalletConnect from '../Wallet/WalletConnect';
import OffRampPayment from './OffRampPayment';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ThemeToggle';
import BrandMark from '../BrandMark';
import BrandWordmark from '../BrandWordmark';
import type { PublicInvoice, InvoiceStatus } from '../../types';
import InvoiceDocument from '../Invoice/InvoiceDocument';
import { formatAmount } from '../../lib/format';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

type PayStep = 'loading' | 'view' | 'connect' | 'paying' | 'confirming' | 'success' | 'error' | 'closed';

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
  const { connected, publicKey, signTransaction, disconnect, getFreighterNetwork, _externalSigner } = useWalletStore();
  const { t, language } = useI18n();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [step, setStep] = useState<PayStep>('loading');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [xlmPriceUsd, setXlmPriceUsd] = useState<number | null>(null);
  const [freighterNetwork, setFreighterNetwork] = useState<string | null>(null);
  const [hasNetworkMismatch, setHasNetworkMismatch] = useState(false);
  const [showMismatchDetails, setShowMismatchDetails] = useState(false);
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

  useEffect(() => {
    if (connected && step === 'connect') {
      setStep('view');
    }
  }, [connected, step]);

  // Detect Freighter's network when connected and check against invoice network.
  // Only applies to the Freighter browser extension — Privy (or any embedded
  // wallet, exposed via _externalSigner) signs on the invoice's own network, so
  // there is nothing to poll and no mismatch to guard against.
  useEffect(() => {
    if (!connected || !invoice || _externalSigner) {
      setFreighterNetwork(null);
      setHasNetworkMismatch(false);
      return;
    }

    const detectFreighterNetwork = async () => {
      try {
        const detectedPassphrase = await getFreighterNetwork();

        setFreighterNetwork(detectedPassphrase);

        // Check if Freighter matches the invoice network
        const hasMismatch = Boolean(
          detectedPassphrase &&
            invoice.networkPassphrase &&
            detectedPassphrase !== invoice.networkPassphrase
        );

        if (hasMismatch) {
          setHasNetworkMismatch(true);
        } else {
          // Network matches now - if there was a mismatch before, disconnect and reload
          if (
            hasNetworkMismatch &&
            detectedPassphrase &&
            invoice.networkPassphrase &&
            detectedPassphrase === invoice.networkPassphrase
          ) {
            disconnect();
            setTimeout(() => window.location.reload(), 500);
          }
          setHasNetworkMismatch(false);
        }
      } catch (err) {
        console.error('[PaymentFlow] Error detecting Freighter network:', err);
      }
    };

    detectFreighterNetwork();

    // Poll for network changes every 2 seconds
    const interval = setInterval(detectFreighterNetwork, 2000);
    return () => clearInterval(interval);
  }, [connected, disconnect, getFreighterNetwork, hasNetworkMismatch, invoice, _externalSigner]);

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
    const canSignInPage = Boolean(publicKey);
    const mobileDevice = isLikelyMobileDevice();

    // Block payment if there's a network mismatch
    if (hasNetworkMismatch) {
      setError('Please switch your Freighter wallet to the correct network first');
      return;
    }

    // Open-amount links require the payer to enter a positive amount.
    if (invoice.isOpenAmount && !(parseFloat(payAmount) > 0)) {
      setError(t('payment.enterAmountPrompt'));
      return;
    }

    // On desktop, prefer in-page Freighter signing over SEP-7 deep links.
    // This avoids "no handler registered" failures for web+stellar URIs.
    if (!canSignInPage && !mobileDevice) {
      setError(t('payment.desktopConnectRequired'));
      setStep('connect');
      return;
    }

    setStep('paying');
    setError(null);

    try {
      // Use the networkPassphrase from the invoice
      console.log('[PaymentFlow] Using networkPassphrase from invoice:', invoice.networkPassphrase);
      const payIntent = await createPayIntent(
        id,
        canSignInPage ? publicKey : undefined,
        invoice.networkPassphrase,
        invoice.isOpenAmount ? payAmount : undefined
      );

      // When no in-page wallet is connected, use SEP-7 deep link flow.
      if (!canSignInPage && payIntent.sep7Uri) {
        console.log('[PaymentFlow] No in-page wallet connected, opening SEP-7 URI');
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

      const signedXdr = await signTransaction(payIntent.transactionXdr, payIntent.networkPassphrase);

      setStep('confirming');
      const result = await submitPayment(id, signedXdr);

      if (result.success) {
        setTxHash(result.transactionHash);
        setStep('success');
        // The payment already succeeded — refreshing the invoice is a nice-to-have
        // for the receipt view. Never let a failed refetch throw us into the catch
        // and show the payer an error for a payment that actually went through.
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
    // "Wallet connected" is only truthful once a wallet is actually connected.
    if (connected) return 1;
    return 0;
  })();

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
        <div className="text-ink-3 text-sm">{t('payment.loadingInvoice')}</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
        <div className="card p-6 text-center max-w-md">
          <p className="text-danger text-sm">{error || t('payment.invoiceNotFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-1 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-lg animate-in">
        <div className="mb-4 flex justify-end gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="mb-6 text-center">
          <BrandMark className="mx-auto mb-3 h-10 w-10 rounded-xl" />
          <h1 className="text-lg font-semibold">
            <BrandWordmark />
          </h1>
          <p className="text-xs text-ink-3">{t('payment.invoicePayment')}</p>
          {invoice && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stellar-100 text-stellar-700">
              <span className="text-3xs font-semibold uppercase tracking-wide">
                {invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet'} Payment
              </span>
            </div>
          )}
        </div>

        {/* Network Mismatch Warning Banner */}
        {hasNetworkMismatch && freighterNetwork && invoice && (
          <div className="mb-4 rounded-lg border-2 border-destructive-border bg-destructive-subtle p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-destructive mb-2">
                  {t('payment.networkMismatchTitle')}
                </h3>
                <p className="text-xs text-destructive mb-3">
                  {t('payment.networkMismatchDesc', {
                    current: freighterNetwork === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet',
                    required: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet',
                  })}
                </p>

                {/* Collapsible instructions — always visible on md+, toggle on mobile */}
                <div className="hidden md:block bg-destructive-subtle border border-destructive-border rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-destructive mb-2">
                    {t('payment.switchInstructions', { network: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet' })}
                  </p>
                  <ol className="text-xs text-destructive space-y-1.5 ml-4 list-decimal">
                    <li>{t('payment.switchStep1')}</li>
                    <li>{t('payment.switchStep2')}</li>
                    <li>{t('payment.switchStep3')}</li>
                    <li>{t('payment.switchStep4', { network: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet' })}</li>
                    <li>{t('payment.switchStep5')}</li>
                  </ol>
                </div>

                {/* Mobile: collapsible */}
                <div className="md:hidden mb-3">
                  <button
                    onClick={() => setShowMismatchDetails(!showMismatchDetails)}
                    className="flex items-center gap-1 text-xs font-semibold text-destructive hover:text-destructive"
                  >
                    {showMismatchDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {t('payment.showInstructions')}
                  </button>
                  {showMismatchDetails && (
                    <div className="mt-2 bg-destructive-subtle border border-destructive-border rounded-lg p-3">
                      <ol className="text-xs text-destructive space-y-1.5 ml-4 list-decimal">
                        <li>{t('payment.switchStep1')}</li>
                        <li>{t('payment.switchStep2')}</li>
                        <li>{t('payment.switchStep3')}</li>
                        <li>{t('payment.switchStep4', { network: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet' })}</li>
                        <li>{t('payment.switchStep5')}</li>
                      </ol>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    disconnect();
                    setHasNetworkMismatch(false);
                    setTimeout(() => window.location.reload(), 300);
                  }}
                  className="btn-secondary text-xs py-1.5 px-3 w-full"
                >
                  {t('payment.disconnectReconnect')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="border-b border-surface-3 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-ink-3">{invoice.invoiceNumber}</span>
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            </div>
            <h2 className="text-base font-semibold text-ink-0 mb-1">{invoice.title}</h2>
            {invoice.description && <p className="text-sm text-ink-3">{invoice.description}</p>}

            <div className="mt-4 rounded-lg border border-surface-3 bg-surface-1 p-3">
              <p className="text-3xs uppercase tracking-wider text-ink-3">{stepLabels.progress}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[stepLabels.loaded, stepLabels.wallet, stepLabels.signed, stepLabels.settled].map((label, index) => {
                  const complete = checkoutStage >= index;
                  return (
                    <div
                      key={label}
                      className={`rounded-md border px-2.5 py-2 ${
                        complete
                          ? 'border-success-border bg-success-subtle'
                          : 'border-surface-3 bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-3xs font-semibold ${
                            complete
                              ? 'bg-success text-success-foreground'
                              : 'bg-surface-2 text-ink-3'
                          }`}
                        >
                          {complete ? <Check className="h-3 w-3" /> : index + 1}
                        </span>
                        <span className={`text-2xs leading-tight ${complete ? 'text-success' : 'text-ink-3'}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {invoice.invoiceType === 'BUSINESS_INVOICE' || invoice.invoiceType === 'SERVICE_INVOICE' ? (
            <>
              <div className="border-b border-surface-3 p-4 sm:p-6">
                <InvoiceDocument invoice={invoice} />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 border-b border-surface-3 bg-surface-1 p-4 sm:grid-cols-2 sm:p-6">
                <div>
                  <p className="text-3xs uppercase tracking-wider text-ink-3 mb-1">{t('payment.from')}</p>
                  <p className="text-sm font-medium text-ink-0">
                    {invoice.freelancerName || t('payment.freelancer')}
                  </p>
                  {invoice.freelancerCompany && <p className="text-xs text-ink-3">{invoice.freelancerCompany}</p>}
                </div>
                <div>
                  <p className="text-3xs uppercase tracking-wider text-ink-3 mb-1">{t('payment.to')}</p>
                  <p className="text-sm font-medium text-ink-0">{invoice.clientName}</p>
                  {invoice.clientCompany && <p className="text-xs text-ink-3">{invoice.clientCompany}</p>}
                </div>
              </div>

              {invoice.isOpenAmount ? (
                <div className="border-b border-surface-3 bg-stellar-50 p-4 sm:p-6">
                  <p className="text-sm font-semibold text-stellar-700">{t('payment.openAmountTitle')}</p>
                  <p className="mt-1 text-xs text-stellar-600">{t('payment.openAmountSubtitle')}</p>
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

              <div className="bg-stellar-50 border-b border-stellar-100 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stellar-700">{t('payment.totalDue')}</span>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono text-stellar-700 sm:text-2xl">
                      {formatAmount(invoice.total, invoice.currency)}
                    </span>
                    {invoice.currency === 'XLM' && formatUsdEquivalent(invoice.total) && (
                      <p className="text-xs text-stellar-500 mt-0.5">
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

          <div className="p-4 sm:p-6">
            {invoice.payoutMethod === 'BRE_B' && (
              <OffRampPayment
                invoice={invoice}
                onRefresh={() => {
                  if (id) getInvoice(id).then(setInvoice).catch(() => {});
                }}
              />
            )}

            {invoice.payoutMethod !== 'BRE_B' && step === 'connect' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-ink-2">{t('payment.connectWalletPrompt')}</p>
                {error && (
                  <p className="text-xs text-danger">{error}</p>
                )}
                {invoice.networkPassphrase && (
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-surface-3 bg-surface-1 px-3 py-1.5 text-xs text-ink-2">
                    <Info className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    {invoice.networkPassphrase === 'Test SDF Network ; September 2015'
                      ? t('payment.requiresTestnet')
                      : t('payment.requiresMainnet')}
                  </div>
                )}
                <WalletConnect variant="large" />
              </div>
            )}

            {invoice.payoutMethod !== 'BRE_B' && step === 'view' && (
              <div className="space-y-4">
                {invoice.isOpenAmount && (
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-3">
                      {t('payment.enterAmount')}
                    </label>
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
                {publicKey && (
                  <div className="text-xs text-ink-3 text-center">
                    {t('payment.payingFrom')}{' '}
                    <span className="font-mono">
                      {publicKey.slice(0, 8)}...{publicKey.slice(-4)}
                    </span>
                  </div>
                )}
                <button
                  onClick={handlePay}
                  disabled={hasNetworkMismatch || (invoice.isOpenAmount && !(parseFloat(payAmount) > 0))}
                  className={`w-full py-3 text-base ${hasNetworkMismatch || (invoice.isOpenAmount && !(parseFloat(payAmount) > 0)) ? 'btn-disabled cursor-not-allowed' : 'btn-primary'}`}
                >
                  {hasNetworkMismatch
                    ? 'Payment Blocked - Wrong Network'
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
                <svg aria-hidden="true" className="animate-spin h-8 w-8 text-stellar-500 mx-auto" viewBox="0 0 24 24">
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
                <svg aria-hidden="true" className="animate-spin h-8 w-8 text-stellar-500 mx-auto" viewBox="0 0 24 24">
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
                    className="text-xs text-stellar-600 hover:underline"
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
                    className="inline-block text-xs text-stellar-600 hover:underline"
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

        <div className="text-center mt-6">
          <p className="text-2xs text-ink-4">{t('payment.poweredBy')}</p>
        </div>
      </div>
    </div>
  );
}
