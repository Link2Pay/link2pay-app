import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWalletStore } from '../store/walletStore';
import { getDashboardStats, listInvoices } from '../services/api';
import InvoiceStatusBadge from '../components/Invoice/InvoiceStatusBadge';
import type { Invoice, InvoiceStatus, DashboardStats } from '../types';
import { CURRENCY_SYMBOLS } from '../config';

export default function Dashboard() {
  const { publicKey } = useWalletStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;

    Promise.all([
      getDashboardStats(publicKey),
      listInvoices(publicKey),
    ])
      .then(([s, invoices]) => {
        setStats(s);
        setRecentInvoices(invoices.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [publicKey]);

  if (loading) {
    return (
      <div className="text-center py-20 text-ink-3 text-sm">Loading...</div>
    );
  }

  const statCards = [
    {
      label: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      color: 'text-ink-0',
    },
    {
      label: 'Paid',
      value: stats?.paidInvoices || 0,
      color: 'text-emerald-600',
    },
    {
      label: 'Pending',
      value: stats?.pendingInvoices || 0,
      color: 'text-amber-600',
    },
    {
      label: 'Revenue',
      value: stats?.totalRevenue || '0.00',
      color: 'text-stellar-600',
      prefix: '',
    },
  ];

  return (
    <div className="space-y-8 animate-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-0">Dashboard</h2>
          <p className="text-sm text-ink-3">
            Overview of your invoicing activity
          </p>
        </div>
        <Link to="/create" className="btn-primary text-sm">
          + New Invoice
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="text-xs text-ink-3 mb-1">{stat.label}</p>
            <p className={`text-2xl font-semibold font-mono ${stat.color}`}>
              {stat.prefix !== undefined ? stat.prefix : ''}
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pending Amount */}
      {stats && parseFloat(stats.pendingAmount) > 0 && (
        <div className="card p-5 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium mb-1">
                Awaiting Payment
              </p>
              <p className="text-xl font-semibold font-mono text-amber-700">
                {stats.pendingAmount}
              </p>
            </div>
            <Link to="/invoices?status=PENDING" className="btn-secondary text-xs">
              View Pending
            </Link>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-ink-0">Recent Invoices</h3>
          <Link
            to="/invoices"
            className="text-xs text-stellar-600 hover:text-stellar-700"
          >
            View All →
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-ink-3 mb-3">
              No invoices yet. Create your first one!
            </p>
            <Link to="/create" className="btn-primary text-sm">
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-surface-3">
            {recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-1 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink-0">
                      {invoice.title}
                    </p>
                    <p className="text-xs text-ink-3">
                      {invoice.clientName} · {invoice.invoiceNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <InvoiceStatusBadge
                    status={invoice.status as InvoiceStatus}
                  />
                  <span className="text-sm font-mono font-medium text-ink-0 w-24 text-right">
                    {parseFloat(invoice.total).toFixed(2)}{' '}
                    <span className="text-ink-3 text-xs">{invoice.currency}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
