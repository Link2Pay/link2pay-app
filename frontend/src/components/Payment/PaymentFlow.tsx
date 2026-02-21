import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, X, AlertCircle } from 'lucide-react';
import { getInvoice, createPayIntent, submitPayment, getPaymentStatus, getXlmPrice } from '../../services/api';
import { useWalletStore } from '../../store/walletStore';
import { useNetworkStore } from '../../store/networkStore';
import InvoiceStatusBadge from '../Invoice/InvoiceStatusBadge';
import WalletConnect from '../Wallet/WalletConnect';
import LanguageToggle from '../LanguageToggle';
import ThemeToggle from '../ThemeToggle';
import NetworkToggle from '../NetworkToggle';
import type { PublicInvoice, InvoiceStatus } from '../../types';
import { CURRENCY_SYMBOLS, config } from '../../config';
import { useI18n } from '../../i18n/I18nProvider';

type PayStep = 'loading' | 'view' | 'connect' | 'paying' | 'confirming' | 'success' | 'error';

export default function PaymentFlow() {
  const { id } = useParams<{ id: string}>();
  const { connected, publicKey, signTransaction, disconnect } = useWalletStore();
  const { network, networkPassphrase, setNetwork } = useNetworkStore();
  const { t } = useI18n();
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [step, setStep] = useState<PayStep>('loading');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [xlmPriceUsd, setXlmPriceUsd] = useState<number | null>(null);
  const [freighterNetwork, setFreighterNetwork] = useState<string | null>(null);
  const [hasNetworkMismatch, setHasNetworkMismatch] = useState(false);

  useEffect(() => {
    if (!id) return;

    getInvoice(id)
      .then((inv) => {
        setInvoice(inv);
        if (inv.status === 'PAID') {
          setStep('success');
          setTxHash(inv.transactionHash || null);
        } else {
          setStep(connected ? 'view' : 'connect');
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
        const freighter = await import('@stellar/freighter-api');
        let detectedPassphrase: string | null = null;

        // Try getNetworkDetails first
        if (typeof freighter.getNetworkDetails === 'function') {
          const details = await freighter.getNetworkDetails();
          if (details && details.networkPassphrase) {
            detectedPassphrase = details.networkPassphrase;
          }
        }
        // Fall back to getNetwork
        else if (typeof freighter.getNetwork === 'function') {
          const network = await freighter.getNetwork();
          if (network === 'PUBLIC') {
            detectedPassphrase = 'Public Global Stellar Network ; September 2015';
          } else if (network === 'TESTNET') {
            detectedPassphrase = 'Test SDF Network ; September 2015';
          }
        }

        setFreighterNetwork(detectedPassphrase);

        // Check if Freighter matches the invoice network
        if (detectedPassphrase && invoice.networkPassphrase && detectedPassphrase !== invoice.networkPassphrase) {
          setHasNetworkMismatch(true);
        } else {
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
  }, [connected, invoice]);

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
    if (!invoice || !publicKey || !id) return;

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
      const payIntent = await createPayIntent(id, publicKey, invoice.networkPassphrase);
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
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-stellar-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <h1 className="text-lg font-semibold text-ink-0">Link2Pay</h1>
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
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-red-900 mb-2">
                  ⚠️ Network Mismatch - Payment Blocked
                </h3>
                <p className="text-xs text-red-800 mb-3">
                  Your <span className="font-bold">Freighter wallet</span> is connected to{' '}
                  <span className="font-bold bg-red-200 px-1.5 py-0.5 rounded">
                    {freighterNetwork === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet'}
                  </span>
                  , but this invoice requires{' '}
                  <span className="font-bold bg-red-200 px-1.5 py-0.5 rounded">
                    {invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet'}
                  </span>.
                </p>

                <div className="bg-white border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-semibold text-red-900 mb-2">
                    📋 How to switch Freighter to {invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet'}:
                  </p>
                  <ol className="text-xs text-red-800 space-y-1.5 ml-4 list-decimal">
                    <li>Click the <span className="font-semibold">Freighter extension</span> in your browser</li>
                    <li>Click the <span className="font-semibold">Settings icon</span> (gear/cog) in the top right</li>
                    <li>Find <span className="font-semibold">"Network"</span> section</li>
                    <li>Select <span className="font-bold bg-red-100 px-1 rounded">{invoice.networkPassphrase === 'Test SDF Network ; September 2015' ? 'Testnet' : 'Mainnet'}</span></li>
                    <li>This page will detect the change automatically and allow payment</li>
                  </ol>
                </div>

                <button
                  onClick={() => { disconnect(); setHasNetworkMismatch(false); }}
                  className="btn-secondary text-xs py-1.5 px-3 w-full"
                >
                  Disconnect wallet and reconnect on correct network
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
              <div className="text-center space-y-3 py-4">
                <svg className="animate-spin h-8 w-8 text-stellar-500 mx-auto" viewBox="0 0 24 24">
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
              <div className="text-center space-y-3 py-4">
                <svg className="animate-spin h-8 w-8 text-stellar-500 mx-auto" viewBox="0 0 24 24">
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
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-0">{t('payment.paymentSuccessful')}</h3>
                  <p className="text-sm text-ink-3 mt-1">
                    {t('payment.amountSent', { amount: formatAmount(invoice.total, invoice.currency) })}
                  </p>
                </div>
                {txHash && (
                  <a
                    href={`https://stellar.expert/explorer/${config.stellarNetwork === 'testnet' ? 'testnet' : 'public'}/tx/${txHash}`}
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
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <X className="h-7 w-7 text-danger" />
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
