import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWalletStore } from '../../store/walletStore';
import { listInvoices } from '../../services/api';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import type { Invoice, InvoiceStatus } from '../../types';
import { CURRENCY_SYMBOLS } from '../../config';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Failed', value: 'FAILED' },
];

export default function InvoiceList() {
  const { publicKey } = useWalletStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!publicKey) return;

    setLoading(true);
    listInvoices(publicKey, filter || undefined)
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [publicKey, filter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: string, currency: string) => {
    const sym = CURRENCY_SYMBOLS[currency] || currency;
    const num = parseFloat(amount);
    if (currency === 'XLM') return `${num.toFixed(2)} ${sym}`;
    return `${sym}${num.toFixed(2)}`;
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-ink-0">Invoices</h2>
        <Link to="/create" className="btn-primary text-sm">
          + New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.value
                ? 'bg-stellar-50 text-stellar-700 border border-stellar-200'
                : 'text-ink-3 hover:bg-surface-1 border border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-12 text-center text-ink-3 text-sm">
          Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-3 text-sm mb-3">No invoices found</p>
          <Link to="/create" className="btn-primary text-sm">
            Create Your First Invoice
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-3 bg-surface-1">
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-surface-1 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="text-sm font-medium text-stellar-600 hover:text-stellar-700"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <p className="text-xs text-ink-3 mt-0.5">{invoice.title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-ink-1">{invoice.clientName}</p>
                    <p className="text-xs text-ink-3">{invoice.clientEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge
                      status={invoice.status as InvoiceStatus}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-mono font-medium text-ink-0">
                      {formatAmount(invoice.total, invoice.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-ink-3">
                    {formatDate(invoice.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
