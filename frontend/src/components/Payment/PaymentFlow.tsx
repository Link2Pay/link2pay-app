import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, AlertCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { getInvoice, createPayIntent, submitPayment, getPaymentStatus, getXlmPrice } from '../../services/api';
import { useWalletStore } from '../../store/walletStore';
import InvoiceStatusBadge from '../Invoice/InvoiceStatusBadge';
import WalletConnect from '../Wallet/WalletConnect';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ThemeToggle';
import NetworkToggle from '../NetworkToggle';
import BrandMark from '../BrandMark';
import BrandWordmark from '../BrandWordmark';
import type { PublicInvoice, InvoiceStatus } from '../../types';
import { CURRENCY_SYMBOLS } from '../../config';
import { useI18n } from '../../i18n/I18nProvider';
import type { Language } from '../../i18n/translations';

type PayStep = 'loading' | 'view' | 'connect' | 'paying' | 'confirming' | 'success' | 'error';

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

  const userAgent = navigator.userAgent || '';
  const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  return (
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent) ||
    isTouchMac
  );
}

export default function PaymentFlow() {
  const { id } = useParams<{ id: string }>();
  const { connected, publicKey, signTransaction, disconnect, getFreighterNetwork } = useWalletStore();
  const { t, language } = useI18n();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [step, setStep] = useState<PayStep>('loading');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [xlmPriceUsd, setXlmPriceUsd] = useState<number | null>(null);
  const [freighterNetwork, setFreighterNetwork] = useState<string | null>(null);
  const [hasNetworkMismatch, setHasNetworkMismatch] = useState(false);
  const [showMismatchDetails, setShowMismatchDetails] = useState(false);
  const stepLabels = CHECKOUT_STEP_LABELS[language];

  useEffect(() => {
    if (!id) return;

    getInvoice(id)
      .then((inv) => {
        setInvoice(inv);
        if (inv.status === 'PAID') {
          setStep('success');
          setTxHash(inv.transactionHash || null);
        } else {
          const allowMobileDirectPay = isLikelyMobileDevice();
          setStep(connected || allowMobileDirectPay ? 'view' : 'connect');
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

  // Detect Freighter's network when connected and check against invoice network
  useEffect(() => {
    if (!connected || !invoice) {
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
  }, [connected, disconnect, getFreighterNetwork, hasNetworkMismatch, invoice]);

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
      } catch {
        // Keep polling on error
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
        const updated = await getInvoice(id);
        setInvoice(updated);
      }
    } catch {
      // ignore
    }
  };

  const handlePay = async () => {
    if (!invoice || !id) return;

    const mobileDirectPay = isLikelyMobileDevice();
    if (!mobileDirectPay && !publicKey) return;

    // Block payment if there's a network mismatch
    if (hasNetworkMismatch) {
      setError('Please switch your Freighter wallet to the correct network first');
      return;
    }

    setStep('paying');
    setError(null);

    try {
      // Use the networkPassphrase from the invoice
      console.log('[PaymentFlow] Using networkPassphrase from invoice:', invoice.networkPassphrase);
      const payIntent = await createPayIntent(
        id,
        mobileDirectPay ? undefined : publicKey,
        invoice.networkPassphrase
      );

      // Mobile fallback: open wallet app through SEP-7 deep link.
      // Desktop path remains extension-based signing.
      if (mobileDirectPay && payIntent.sep7Uri) {
        console.log('[PaymentFlow] Mobile detected, opening SEP-7 URI');
        setStep('confirming');
        window.location.assign(payIntent.sep7Uri);
        return;
      }

      if (!payIntent.transactionXdr) {
        throw new Error('Unable to build transaction for signing. Please reconnect your wallet and try again.');
      }

      const signedXdr = await signTransaction(payIntent.transactionXdr, payIntent.networkPassphrase);

      setStep('confirming');
      const result = await submitPayment(id, signedXdr);

      if (result.success) {
        setTxHash(result.transactionHash);
        setStep('success');
        const updated = await getInvoice(id);
        setInvoice(updated);
      } else {
        throw new Error(t('payment.txSubmissionFailed'));
      }
    } catch (err: any) {
      console.error('[PaymentFlow] Payment error:', err);
      setError(err.message || t('payment.paymentFailedDefault'));
      setStep('error');
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const number = parseFloat(amount);
    if (currency === 'XLM') return `${number.toFixed(2)} ${symbol}`;
    return `${symbol}${number.toFixed(2)}`;
  };

  const formatUsdEquivalent = (amount: string): string | null => {
    if (!xlmPriceUsd) return null;
    const usd = parseFloat(amount) * xlmPriceUsd;
    return usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const checkoutStage = (() => {
    if (step === 'success' || invoice?.status === 'PAID') return 3;
    if (step === 'confirming' || step === 'paying') return 2;
    if (connected || step === 'view' || step === 'error') return 1;
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
          <NetworkToggle />
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
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet'} Payment
              </span>
            </div>
          )}
        </div>

        {/* Network Mismatch Warning Banner */}
        {hasNetworkMismatch && freighterNetwork && invoice && (
          <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-red-900 mb-2">
                  {t('payment.networkMismatchTitle')}
                </h3>
                <p className="text-xs text-red-800 mb-3">
                  {t('payment.networkMismatchDesc', {
                    current: freighterNetwork === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet',
                    required: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet',
                  })}
                </p>

                {/* Collapsible instructions — always visible on md+, toggle on mobile */}
                <div className="hidden md:block bg-white border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-red-900 mb-2">
                    {t('payment.switchInstructions', { network: invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet' })}
                  </p>
                  <ol className="text-xs text-red-800 space-y-1.5 ml-4 list-decimal">
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
                    className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900"
                  >
                    {showMismatchDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {t('payment.showInstructions')}
                  </button>
                  {showMismatchDetails && (
                    <div className="mt-2 bg-white border border-red-200 rounded-lg p-3">
                      <ol className="text-xs text-red-800 space-y-1.5 ml-4 list-decimal">
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
              <p className="text-[10px] uppercase tracking-wider text-ink-3">{stepLabels.progress}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[stepLabels.loaded, stepLabels.wallet, stepLabels.signed, stepLabels.settled].map((label, index) => {
                  const complete = checkoutStage >= index;
                  return (
                    <div
                      key={label}
                      className={`rounded-md border px-2.5 py-2 ${
                        complete
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-surface-3 bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                            complete
                              ? 'bg-emerald-600 text-white'
                              : 'bg-surface-2 text-ink-3'
                          }`}
                        >
                          {complete ? <Check className="h-3 w-3" /> : index + 1}
                        </span>
                        <span className={`text-[11px] leading-tight ${complete ? 'text-emerald-700' : 'text-ink-3'}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-b border-surface-3 bg-surface-1 p-4 sm:grid-cols-2 sm:p-6">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">{t('payment.from')}</p>
              <p className="text-sm font-medium text-ink-0">
                {invoice.freelancerName || t('payment.freelancer')}
              </p>
              {invoice.freelancerCompany && <p className="text-xs text-ink-3">{invoice.freelancerCompany}</p>}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">{t('payment.to')}</p>
              <p className="text-sm font-medium text-ink-0">{invoice.clientName}</p>
              {invoice.clientCompany && <p className="text-xs text-ink-3">{invoice.clientCompany}</p>}
            </div>
          </div>

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

          <div className="p-4 sm:p-6">
            {step === 'connect' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-ink-2">{t('payment.connectWalletPrompt')}</p>
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

            {step === 'view' && (
              <div className="space-y-4">
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
                  disabled={hasNetworkMismatch}
                  className={`w-full py-3 text-base ${hasNetworkMismatch ? 'btn-disabled cursor-not-allowed' : 'btn-primary'}`}
                >
                  {hasNetworkMismatch ? 'Payment Blocked - Wrong Network' : t('payment.payAmount', { amount: formatAmount(invoice.total, invoice.currency) })}
                </button>
                <p className="text-[11px] text-ink-4 text-center">{t('payment.approveTransaction')}</p>
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
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check aria-hidden="true" className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-0">{t('payment.paymentSuccessful')}</h3>
                  <p className="text-sm text-ink-3 mt-1">
                    {t('payment.amountSent', { amount: formatAmount(invoice.total, invoice.currency) })}
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
                <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <X aria-hidden="true" className="h-7 w-7 text-danger" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-0">{t('payment.paymentFailed')}</h3>
                  <p className="text-sm text-danger mt-1">{error}</p>
                </div>
                <button onClick={() => setStep('view')} className="btn-secondary text-sm">
                  {t('payment.tryAgain')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-[11px] text-ink-4">{t('payment.poweredBy')}</p>
        </div>
      </div>
    </div>
  );
}
