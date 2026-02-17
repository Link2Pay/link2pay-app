import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getInvoice, createPayIntent, submitPayment, getPaymentStatus } from '../../services/api';
import { useWalletStore } from '../../store/walletStore';
import InvoiceStatusBadge from '../Invoice/InvoiceStatusBadge';
import WalletConnect from '../Wallet/WalletConnect';
import type { Invoice, InvoiceStatus } from '../../types';
import { CURRENCY_SYMBOLS, config } from '../../config';

type PayStep = 'loading' | 'view' | 'connect' | 'paying' | 'confirming' | 'success' | 'error';

export default function PaymentFlow() {
  const { id } = useParams<{ id: string }>();
  const { connected, publicKey, signTransaction } = useWalletStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [step, setStep] = useState<PayStep>('loading');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Load invoice
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
  }, [id, connected]);

  // Poll for status while confirming
  useEffect(() => {
    if (step !== 'confirming' || !id) return;

    const interval = setInterval(async () => {
      try {
        const status = await getPaymentStatus(id);
        if (status.status === 'PAID') {
          setTxHash(status.transactionHash);
          setStep('success');
          // Refresh invoice data
          const updated = await getInvoice(id);
          setInvoice(updated);
        }
      } catch {
        // Keep polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, id]);

  const handlePay = async () => {
    if (!invoice || !publicKey || !id) return;

    setStep('paying');
    setError(null);

    try {
      // 1. Get pay intent (unsigned transaction)
      const payIntent = await createPayIntent(id, publicKey);

      // 2. Sign the transaction via Freighter
      const signedXdr = await signTransaction(payIntent.transactionXdr);

      // 3. Submit signed transaction
      setStep('confirming');
      const result = await submitPayment(id, signedXdr);

      if (result.success) {
        setTxHash(result.transactionHash);
        setStep('success');
        // Refresh invoice
        const updated = await getInvoice(id);
        setInvoice(updated);
      } else {
        throw new Error('Transaction submission failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setStep('error');
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    const num = parseFloat(amount);
    if (currency === 'XLM') return `${num.toFixed(2)} ${sym}`;
    return `${sym}${num.toFixed(2)}`;
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="text-ink-3 text-sm">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-1">
        <div className="card p-8 text-center max-w-md">
          <p className="text-danger text-sm">{error || 'Invoice not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-stellar-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <h1 className="text-lg font-semibold text-ink-0">StellarPay</h1>
          <p className="text-xs text-ink-3">Invoice Payment</p>
        </div>

        {/* Invoice Card */}
        <div className="card overflow-hidden">
          {/* Invoice Header */}
          <div className="p-6 border-b border-surface-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-ink-3">
                {invoice.invoiceNumber}
              </span>
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            </div>
            <h2 className="text-base font-semibold text-ink-0 mb-1">
              {invoice.title}
            </h2>
            {invoice.description && (
              <p className="text-sm text-ink-3">{invoice.description}</p>
            )}
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4 p-6 border-b border-surface-3 bg-surface-1">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">
                From
              </p>
              <p className="text-sm font-medium text-ink-0">
                {invoice.freelancerName || 'Freelancer'}
              </p>
              {invoice.freelancerCompany && (
                <p className="text-xs text-ink-3">{invoice.freelancerCompany}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1">
                To
              </p>
              <p className="text-sm font-medium text-ink-0">
                {invoice.clientName}
              </p>
              {invoice.clientCompany && (
                <p className="text-xs text-ink-3">{invoice.clientCompany}</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6 border-b border-surface-3">
            <div className="space-y-2">
              {invoice.lineItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-ink-1">{item.description}</p>
                    <p className="text-xs text-ink-3">
                      {parseFloat(String(item.quantity))} ×{' '}
                      {parseFloat(String(item.rate)).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-mono text-ink-0">
                    {parseFloat(String(item.amount)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-surface-3 space-y-1">
              <div className="flex items-center justify-between text-sm text-ink-3">
                <span>Subtotal</span>
                <span className="font-mono">
                  {parseFloat(invoice.subtotal).toFixed(2)}
                </span>
              </div>
              {invoice.taxRate && parseFloat(invoice.taxRate) > 0 && (
                <div className="flex items-center justify-between text-sm text-ink-3">
                  <span>Tax ({invoice.taxRate}%)</span>
                  <span className="font-mono">
                    {parseFloat(invoice.taxAmount || '0').toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="p-6 bg-stellar-50 border-b border-stellar-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stellar-700">
                Total Due
              </span>
              <span className="text-2xl font-bold font-mono text-stellar-700">
                {formatAmount(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>

          {/* Payment Action */}
          <div className="p-6">
            {step === 'connect' && (
              <div className="text-center space-y-4">
                <p className="text-sm text-ink-2">
                  Connect your Freighter wallet to pay this invoice
                </p>
                <WalletConnect variant="large" />
              </div>
            )}

            {step === 'view' && (
              <div className="space-y-4">
                {publicKey && (
                  <div className="text-xs text-ink-3 text-center">
                    Paying from:{' '}
                    <span className="font-mono">
                      {publicKey.slice(0, 8)}...{publicKey.slice(-4)}
                    </span>
                  </div>
                )}
                <button
                  onClick={handlePay}
                  className="btn-primary w-full py-3 text-base"
                >
                  Pay {formatAmount(invoice.total, invoice.currency)}
                </button>
                <p className="text-[11px] text-ink-4 text-center">
                  You'll be asked to approve the transaction in your Freighter wallet
                </p>
              </div>
            )}

            {step === 'paying' && (
              <div className="text-center space-y-3 py-4">
                <svg
                  className="animate-spin h-8 w-8 text-stellar-500 mx-auto"
                  viewBox="0 0 24 24"
                >
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
                <p className="text-sm text-ink-1">
                  Building transaction...
                </p>
                <p className="text-xs text-ink-3">
                  Please approve in your Freighter wallet
                </p>
              </div>
            )}

            {step === 'confirming' && (
              <div className="text-center space-y-3 py-4">
                <svg
                  className="animate-spin h-8 w-8 text-stellar-500 mx-auto"
                  viewBox="0 0 24 24"
                >
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
                <p className="text-sm text-ink-1">
                  Confirming on Stellar network...
                </p>
                <p className="text-xs text-ink-3">
                  This usually takes 3-5 seconds
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-2xl text-emerald-600">✓</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-0">
                    Payment Successful
                  </h3>
                  <p className="text-sm text-ink-3 mt-1">
                    {formatAmount(invoice.total, invoice.currency)} has been sent
                  </p>
                </div>
                {txHash && (
                  <a
                    href={`https://stellar.expert/explorer/${config.stellarNetwork === 'testnet' ? 'testnet' : 'public'}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-stellar-600 hover:underline"
                  >
                    View on Stellar Explorer →
                  </a>
                )}
              </div>
            )}

            {step === 'error' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-2xl text-danger">×</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink-0">
                    Payment Failed
                  </h3>
                  <p className="text-sm text-danger mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setStep('view')}
                  className="btn-secondary text-sm"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-ink-4">
            Powered by StellarPay · Payments on the Stellar Network
          </p>
        </div>
      </div>
    </div>
  );
}
