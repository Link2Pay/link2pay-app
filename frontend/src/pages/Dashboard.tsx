import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, listInvoices } from '../services/api';
import InvoiceStatusBadge from '../components/Invoice/InvoiceStatusBadge';
import { useI18n } from '../i18n/I18nProvider';
import { useWalletStore } from '../store/walletStore';
import type { DashboardStats, Invoice, InvoiceStatus } from '../types';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  loading: string;
  totalInvoices: string;
  paid: string;
  pending: string;
  revenue: string;
  title: string;
  subtitle: string;
  newInvoice: string;
  awaitingPayment: string;
  viewPending: string;
  recentInvoices: string;
  viewAll: string;
  noInvoices: string;
  createInvoice: string;
}> = {
  en: {
    loading: 'Loading...',
    totalInvoices: 'Total Invoices',
    paid: 'Paid',
    pending: 'Pending',
    revenue: 'Revenue',
    title: 'Dashboard',
    subtitle: 'Overview of your invoicing activity',
    newInvoice: 'New Invoice',
    awaitingPayment: 'Awaiting Payment',
    viewPending: 'View Pending',
    recentInvoices: 'Recent Invoices',
    viewAll: 'View All',
    noInvoices: 'No invoices yet. Create your first one!',
    createInvoice: 'Create Invoice',
  },
  es: {
    loading: 'Cargando...',
    totalInvoices: 'Facturas totales',
    paid: 'Pagadas',
    pending: 'Pendientes',
    revenue: 'Ingresos',
    title: 'Panel',
    subtitle: 'Resumen de tu actividad de facturacion',
    newInvoice: 'Nueva factura',
    awaitingPayment: 'Pago pendiente',
    viewPending: 'Ver pendientes',
    recentInvoices: 'Facturas recientes',
    viewAll: 'Ver todo',
    noInvoices: 'Aun no hay facturas. Crea la primera.',
    createInvoice: 'Crear factura',
  },
  pt: {
    loading: 'Carregando...',
    totalInvoices: 'Total de faturas',
    paid: 'Pagas',
    pending: 'Pendentes',
    revenue: 'Receita',
    title: 'Painel',
    subtitle: 'Visao geral da sua atividade de faturamento',
    newInvoice: 'Nova fatura',
    awaitingPayment: 'Aguardando pagamento',
    viewPending: 'Ver pendentes',
    recentInvoices: 'Faturas recentes',
    viewAll: 'Ver tudo',
    noInvoices: 'Ainda nao ha faturas. Crie a primeira agora.',
    createInvoice: 'Criar fatura',
  },
};

export default function Dashboard() {
  const { publicKey } = useWalletStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) return;

    Promise.all([getDashboardStats(publicKey), listInvoices(publicKey, undefined, 5, 0)])
      .then(([dashboardStats, { invoices }]) => {
        setStats(dashboardStats);
        setRecentInvoices(invoices);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [publicKey]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse sm:space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-5 w-32 bg-surface-2 rounded mb-2" />
            <div className="h-4 w-56 bg-surface-2 rounded" />
          </div>
          <div className="h-9 w-32 bg-surface-2 rounded-lg" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="h-3 w-20 bg-surface-2 rounded mb-3" />
              <div className="h-7 w-12 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
        {/* Recent invoices skeleton */}
        <div className="card divide-y divide-surface-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-surface-2 rounded" />
                <div className="h-3 w-28 bg-surface-2 rounded" />
              </div>
              <div className="h-4 w-20 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: copy.totalInvoices,
      value: stats?.totalInvoices || 0,
      color: 'text-ink-0',
    },
    {
      label: copy.paid,
      value: stats?.paidInvoices || 0,
      color: 'text-emerald-600',
    },
    {
      label: copy.pending,
      value: stats?.pendingInvoices || 0,
      color: 'text-amber-600',
    },
    {
      label: copy.revenue,
      value: stats?.totalRevenue || '0.00',
      color: 'text-stellar-600',
      prefix: '',
    },
  ];

  return (
    <div className="space-y-6 animate-in sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
          <p className="text-sm text-ink-3">{copy.subtitle}</p>
        </div>
        <Link to="/dashboard/create" className="btn-primary w-full text-sm sm:w-auto">
          + {copy.newInvoice}
        </Link>
      </div>

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

      {stats && parseFloat(stats.pendingAmount) > 0 && (
        <div className="card p-5 bg-amber-50 border-amber-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium mb-1">{copy.awaitingPayment}</p>
              <p className="text-xl font-semibold font-mono text-amber-700">{stats.pendingAmount}</p>
            </div>
            <Link to="/dashboard/invoices?status=PENDING" className="btn-secondary w-full text-xs sm:w-auto">
              {copy.viewPending}
            </Link>
          </div>
        </div>
      )}

      <div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-ink-0">{copy.recentInvoices}</h3>
          <Link to="/dashboard/invoices" className="text-xs text-stellar-600 hover:text-stellar-700">
            {copy.viewAll} -&gt;
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-ink-3 mb-3">{copy.noInvoices}</p>
            <Link to="/dashboard/create" className="btn-primary text-sm">
              {copy.createInvoice}
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-surface-3">
            {recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/dashboard/invoices/${invoice.id}`}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-surface-1 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink-0 break-words">{invoice.title}</p>
                    <p className="text-xs text-ink-3">
                      {invoice.clientName} | {invoice.invoiceNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
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
