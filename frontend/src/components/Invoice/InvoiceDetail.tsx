import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWalletStore } from '../../store/walletStore';
import { getInvoice, sendInvoice, deleteInvoice } from '../../services/api';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import type { Invoice, InvoiceStatus } from '../../types';
import { CURRENCY_SYMBOLS, config } from '../../config';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publicKey } = useWalletStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getInvoice(id)
      .then(setInvoice)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const paymentLink = invoice
    ? `${window.location.origin}/pay/${invoice.id}`
    : '';

  const isOwner = invoice?.freelancerWallet === publicKey;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!invoice || !publicKey) return;
    setActionLoading(true);
    try {
      const updated = await sendInvoice(invoice.id, publicKey);
      setInvoice(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice || !publicKey) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    setActionLoading(true);
    try {
      await deleteInvoice(invoice.id, publicKey);
      navigate('/invoices');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    const num = parseFloat(amount);
    if (currency === 'XLM') return `${num.toFixed(2)} ${sym}`;
    return `${sym}${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-ink-3 text-sm">
        Loading invoice...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-danger text-sm mb-3">
          {error || 'Invoice not found'}
        </p>
        <Link to="/invoices" className="btn-secondary text-sm">
          Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-semibold text-ink-0">
              {invoice.invoiceNumber}
            </h2>
            <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
          </div>
          <p className="text-sm text-ink-3">{invoice.title}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold font-mono text-ink-0">
            {formatAmount(invoice.total, invoice.currency)}
          </p>
          <p className="text-xs text-ink-3 mt-1">
            {invoice.currency === 'XLM' ? 'Stellar Lumens' : invoice.currency}
          </p>
        </div>
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="flex items-center gap-3">
          {invoice.status === 'DRAFT' && (
            <>
              <button
                onClick={handleSend}
                disabled={actionLoading}
                className="btn-primary text-sm"
              >
                Send Invoice
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="btn-danger text-sm"
              >
                Delete
              </button>
            </>
          )}
          {['PENDING', 'DRAFT'].includes(invoice.status) && (
            <button
              onClick={handleCopyLink}
              className="btn-secondary text-sm"
            >
              {copied ? '✓ Copied!' : 'Copy Payment Link'}
            </button>
          )}
        </div>
      )}

      {/* Payment Link */}
      {isOwner &&
        ['PENDING', 'DRAFT'].includes(invoice.status) && (
          <div className="card p-4">
            <label className="label">Payment Link</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-surface-1 text-xs font-mono text-ink-2 overflow-x-auto">
                {paymentLink}
              </code>
              <button onClick={handleCopyLink} className="btn-ghost text-xs">
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-ink-3 mt-2">
              Share this link with your client so they can view and pay the
              invoice.
            </p>
          </div>
        )}

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From */}
        <div className="card p-5">
          <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3">
            From
          </h4>
          {invoice.freelancerName && (
            <p className="text-sm font-medium text-ink-0">
              {invoice.freelancerName}
            </p>
          )}
          {invoice.freelancerCompany && (
            <p className="text-sm text-ink-2">{invoice.freelancerCompany}</p>
          )}
          <p className="text-xs font-mono text-ink-3 mt-1 break-all">
            {invoice.freelancerWallet}
          </p>
        </div>

        {/* To */}
        <div className="card p-5">
          <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3">
            To
          </h4>
          <p className="text-sm font-medium text-ink-0">
            {invoice.clientName}
          </p>
          {invoice.clientCompany && (
            <p className="text-sm text-ink-2">{invoice.clientCompany}</p>
          )}
          <p className="text-sm text-ink-3">{invoice.clientEmail}</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-1 border-b border-surface-3">
              <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                Description
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                Qty
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                Rate
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-3">
            {invoice.lineItems.map((item, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-sm text-ink-0">
                  {item.description}
                </td>
                <td className="px-4 py-3 text-sm text-ink-2 text-center">
                  {parseFloat(String(item.quantity))}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-ink-2 text-right">
                  {parseFloat(String(item.rate)).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm font-mono text-ink-0 text-right">
                  {parseFloat(String(item.amount)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-surface-3">
            <tr>
              <td colSpan={3} className="px-4 py-2 text-sm text-ink-3 text-right">
                Subtotal
              </td>
              <td className="px-4 py-2 text-sm font-mono text-right">
                {parseFloat(invoice.subtotal).toFixed(2)}
              </td>
            </tr>
            {invoice.taxRate && parseFloat(invoice.taxRate) > 0 && (
              <>
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm text-ink-3 text-right">
                    Tax ({invoice.taxRate}%)
                  </td>
                  <td className="px-4 py-2 text-sm font-mono text-right">
                    {parseFloat(invoice.taxAmount || '0').toFixed(2)}
                  </td>
                </tr>
              </>
            )}
            <tr>
              <td
                colSpan={3}
                className="px-4 py-3 text-base font-semibold text-right"
              >
                Total
              </td>
              <td className="px-4 py-3 text-base font-semibold font-mono text-stellar-700 text-right">
                {formatAmount(invoice.total, invoice.currency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Description & Notes */}
      {(invoice.description || invoice.notes) && (
        <div className="card p-5 space-y-4">
          {invoice.description && (
            <div>
              <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Description
              </h4>
              <p className="text-sm text-ink-1 whitespace-pre-wrap">
                {invoice.description}
              </p>
            </div>
          )}
          {invoice.notes && (
            <div>
              <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">
                Notes
              </h4>
              <p className="text-sm text-ink-1 whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment Proof */}
      {invoice.status === 'PAID' && invoice.transactionHash && (
        <div className="card p-5 bg-emerald-50 border-emerald-200">
          <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">
            Payment Confirmed
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-emerald-600">Transaction Hash</span>
              <a
                href={`https://stellar.expert/explorer/${config.stellarNetwork === 'testnet' ? 'testnet' : 'public'}/tx/${invoice.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-stellar-600 hover:underline"
              >
                {invoice.transactionHash.slice(0, 16)}...
              </a>
            </div>
            {invoice.paidAt && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-600">Paid At</span>
                <span className="text-emerald-700">
                  {new Date(invoice.paidAt).toLocaleString()}
                </span>
              </div>
            )}
            {invoice.payerWallet && (
              <div className="flex items-center justify-between">
                <span className="text-emerald-600">Payer</span>
                <span className="font-mono text-xs text-emerald-700">
                  {invoice.payerWallet.slice(0, 8)}...{invoice.payerWallet.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
