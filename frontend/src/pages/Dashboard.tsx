import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FilePlus2,
  FileText,
  History,
  Layers,
  PieChart,
  Users2,
} from 'lucide-react';
import { getDashboardStats, listInvoices } from '../services/api';
import InvoiceStatusBadge from '../components/Invoice/InvoiceStatusBadge';
import { useI18n } from '../i18n/I18nProvider';
import { useActiveAddress } from '../hooks/useActiveAddress';
import type { DashboardStats, Invoice, InvoiceStatus } from '../types';
import type { Language } from '../i18n/translations';

const COPY: Record<Language, {
  loading: string;
  totalInvoices: string;
  paid: string;
  pending: string;
  revenue: string;
  conversionRate: string;
  title: string;
  subtitle: string;
  newInvoice: string;
  awaitingPayment: string;
  viewPending: string;
  pipelineTitle: string;
  pipelineSubtitle: string;
  stageDraft: string;
  stageInFlight: string;
  stagePaid: string;
  stageClosed: string;
  settledLabel: string;
  assetMixTitle: string;
  assetMixSubtitle: string;
  noSettledVolume: string;
  clientActivityTitle: string;
  clientActivitySubtitle: string;
  colClient: string;
  colLinks: string;
  colPaid: string;
  colPending: string;
  noClientActivity: string;
  viewClients: string;
  recentInvoices: string;
  viewAll: string;
  noInvoices: string;
  createInvoice: string;
}> = {
  en: {
    loading: 'Loading...',
    totalInvoices: 'Total Links',
    paid: 'Confirmed',
    pending: 'Awaiting',
    revenue: 'Total Volume',
    conversionRate: 'Conversion',
    title: 'Dashboard',
    subtitle: 'Real-time overview of your payment link activity and settlements',
    newInvoice: 'New Link',
    awaitingPayment: 'Pending Settlement',
    viewPending: 'View Pending',
    pipelineTitle: 'Payment Pipeline',
    pipelineSubtitle: 'How links are moving through your lifecycle right now',
    stageDraft: 'Draft',
    stageInFlight: 'In flight',
    stagePaid: 'Paid',
    stageClosed: 'Closed',
    settledLabel: 'settled links',
    assetMixTitle: 'Settled Asset Mix',
    assetMixSubtitle: 'Distribution of confirmed volume by asset',
    noSettledVolume: 'No settled volume yet',
    clientActivityTitle: 'Client Activity',
    clientActivitySubtitle: 'Most active clients in your recent links',
    colClient: 'Client',
    colLinks: 'Links',
    colPaid: 'Paid',
    colPending: 'Pending',
    noClientActivity: 'No client activity available yet.',
    viewClients: 'View Clients',
    recentInvoices: 'Recent Activity',
    viewAll: 'View All',
    noInvoices: 'No payment links yet. Generate your first one to get started.',
    createInvoice: 'Create Link',
  },
  es: {
    loading: 'Cargando...',
    totalInvoices: 'Total de links',
    paid: 'Confirmados',
    pending: 'En espera',
    revenue: 'Volumen total',
    conversionRate: 'Conversión',
    title: 'Panel',
    subtitle: 'Vista en tiempo real de tu actividad de links de pago y liquidaciones',
    newInvoice: 'Nuevo link',
    awaitingPayment: 'Liquidación pendiente',
    viewPending: 'Ver pendientes',
    pipelineTitle: 'Pipeline de pagos',
    pipelineSubtitle: 'Cómo avanzan tus links en el ciclo de vida',
    stageDraft: 'Borrador',
    stageInFlight: 'En curso',
    stagePaid: 'Pagado',
    stageClosed: 'Cerrado',
    settledLabel: 'links liquidados',
    assetMixTitle: 'Mix de activos liquidados',
    assetMixSubtitle: 'Distribución del volumen confirmado por activo',
    noSettledVolume: 'Aún no hay volumen liquidado',
    clientActivityTitle: 'Actividad de clientes',
    clientActivitySubtitle: 'Clientes más activos en tus links recientes',
    colClient: 'Cliente',
    colLinks: 'Links',
    colPaid: 'Pagados',
    colPending: 'Pendientes',
    noClientActivity: 'Aún no hay actividad de clientes.',
    viewClients: 'Ver clientes',
    recentInvoices: 'Actividad reciente',
    viewAll: 'Ver todo',
    noInvoices: 'Aún no tienes links de pago. Genera el primero para comenzar.',
    createInvoice: 'Crear link',
  },
  pt: {
    loading: 'Carregando...',
    totalInvoices: 'Total de links',
    paid: 'Confirmados',
    pending: 'Aguardando',
    revenue: 'Volume total',
    conversionRate: 'Conversão',
    title: 'Painel',
    subtitle: 'Visão em tempo real da sua atividade de links de pagamento e liquidações',
    newInvoice: 'Novo link',
    awaitingPayment: 'Liquidação pendente',
    viewPending: 'Ver pendentes',
    pipelineTitle: 'Pipeline de pagamentos',
    pipelineSubtitle: 'Como seus links avançam no ciclo de vida',
    stageDraft: 'Rascunho',
    stageInFlight: 'Em andamento',
    stagePaid: 'Pago',
    stageClosed: 'Encerrado',
    settledLabel: 'links liquidados',
    assetMixTitle: 'Mix de ativos liquidados',
    assetMixSubtitle: 'Distribuição do volume confirmado por ativo',
    noSettledVolume: 'Ainda não há volume liquidado',
    clientActivityTitle: 'Atividade de clientes',
    clientActivitySubtitle: 'Clientes mais ativos nos seus links recentes',
    colClient: 'Cliente',
    colLinks: 'Links',
    colPaid: 'Pagos',
    colPending: 'Pendentes',
    noClientActivity: 'Ainda não há atividade de clientes.',
    viewClients: 'Ver clientes',
    recentInvoices: 'Atividade recente',
    viewAll: 'Ver tudo',
    noInvoices: 'Nenhum link de pagamento ainda. Gere o primeiro para começar.',
    createInvoice: 'Criar link',
  },
};

export default function Dashboard() {
  const walletAddress = useActiveAddress();
  const { language } = useI18n();
  const copy = COPY[language];

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) return;

    Promise.all([getDashboardStats(walletAddress), listInvoices(walletAddress, undefined, 50, 0)])
      .then(([dashboardStats, invoiceResult]) => {
        const safeStats =
          dashboardStats && typeof dashboardStats === 'object' ? dashboardStats : null;
        const safeInvoices = Array.isArray(invoiceResult?.invoices)
          ? invoiceResult.invoices
          : [];

        setStats(safeStats);
        setAllInvoices(safeInvoices);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [walletAddress]);

  const invoices = Array.isArray(allInvoices) ? allInvoices : [];
  const recentInvoices = invoices.slice(0, 5);

  const totalLinks = stats?.totalInvoices ?? invoices.length;
  const paidLinks = stats?.paidInvoices ?? invoices.filter((invoice) => invoice.status === 'PAID').length;
  const pendingLinks = stats?.pendingInvoices ?? invoices.filter((invoice) => ['PENDING', 'PROCESSING'].includes(invoice.status)).length;
  const closedLinks = invoices.filter((invoice) => ['FAILED', 'EXPIRED', 'CANCELLED'].includes(invoice.status)).length;
  const draftLinks = invoices.filter((invoice) => invoice.status === 'DRAFT').length;
  const conversionRate = totalLinks > 0 ? (paidLinks / totalLinks) * 100 : 0;

  const toAmount = (value: string | null | undefined) => {
    const parsed = Number.parseFloat(value || '0');
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const settledByAsset = useMemo(() => {
    const totals: Record<'XLM' | 'USDC' | 'EURC', number> = { XLM: 0, USDC: 0, EURC: 0 };
    invoices.forEach((invoice) => {
      if (invoice.status !== 'PAID') return;
      if (invoice.currency in totals) {
        totals[invoice.currency as 'XLM' | 'USDC' | 'EURC'] += toAmount(invoice.total);
      }
    });
    return totals;
  }, [invoices]);

  const settledAssetRows = (Object.keys(settledByAsset) as Array<'XLM' | 'USDC' | 'EURC'>).map((asset) => ({
    asset,
    value: settledByAsset[asset],
  }));

  const settledTotal = settledAssetRows.reduce((sum, row) => sum + row.value, 0);

  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; links: number; paid: number; pending: number }>();

    invoices.forEach((invoice) => {
      const name = invoice.clientName || 'Unknown';
      const entry = map.get(name) || { name, links: 0, paid: 0, pending: 0 };
      entry.links += 1;
      if (invoice.status === 'PAID') entry.paid += 1;
      if (['PENDING', 'PROCESSING'].includes(invoice.status)) entry.pending += 1;
      map.set(name, entry);
    });

    return Array.from(map.values())
      .sort((a, b) => b.links - a.links || b.paid - a.paid)
      .slice(0, 5);
  }, [invoices]);

  const totalRevenueValue =
    stats?.totalRevenue === undefined || stats?.totalRevenue === null
      ? '0.00'
      : String(stats.totalRevenue);

  const formatSettledAmount = (asset: 'XLM' | 'USDC' | 'EURC', value: number) => {
    const fixed = value.toFixed(2);
    if (asset === 'XLM') return `${fixed} XLM`;
    if (asset === 'EURC') return `€${fixed}`;
    return `$${fixed}`;
  };

  const statCards = [
    {
      label: copy.totalInvoices,
      value: totalLinks,
      color: 'text-ink-0',
      icon: FileText,
      border: '',
    },
    {
      label: copy.paid,
      value: paidLinks,
      color: 'text-emerald-600',
      icon: CheckCircle2,
      border: 'border-l-4 border-l-emerald-500',
    },
    {
      label: copy.pending,
      value: pendingLinks,
      color: 'text-amber-600',
      icon: Clock3,
      border: 'border-l-4 border-l-amber-500',
    },
    {
      label: copy.revenue,
      value: totalRevenueValue,
      color: 'text-stellar-600',
      icon: CircleDollarSign,
      border: 'border-l-4 border-l-primary',
    },
  ];

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

  return (
    <div className="space-y-6 animate-in sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
          <p className="text-sm text-ink-3">{copy.subtitle}</p>
        </div>
        <Link to="/dashboard/create-link" className="btn-primary w-full text-sm sm:w-auto">
          <FilePlus2 className="h-4 w-4" />
          {copy.newInvoice}
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className={`card p-5 ${stat.border}`}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-ink-3">{stat.label}</p>
                <span className="rounded-md bg-muted p-1.5 text-ink-3">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
              <p className={`text-2xl font-semibold font-mono ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {stats && toAmount(stats.pendingAmount) > 0 && (
        <div className="card p-5 bg-amber-50 border-amber-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs text-amber-600 font-medium mb-1">{copy.awaitingPayment}</p>
                <p className="text-xl font-semibold font-mono text-amber-700">{stats.pendingAmount}</p>
              </div>
            </div>
            <Link to="/dashboard/links?status=PENDING" className="btn-secondary w-full text-xs sm:w-auto">
              {copy.viewPending}
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
                <Layers className="h-4 w-4 text-ink-3" />
                {copy.pipelineTitle}
              </h3>
              <p className="mt-1 text-xs text-ink-3">{copy.pipelineSubtitle}</p>
            </div>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {conversionRate.toFixed(1)}% {copy.conversionRate}
            </span>
          </div>

          <div className="mb-4 flex h-2 overflow-hidden rounded-full bg-muted">
            {[
              { key: copy.stageDraft, value: draftLinks, color: 'bg-slate-400' },
              { key: copy.stageInFlight, value: pendingLinks, color: 'bg-amber-500' },
              { key: copy.stagePaid, value: paidLinks, color: 'bg-emerald-500' },
              { key: copy.stageClosed, value: closedLinks, color: 'bg-rose-500' },
            ].map((segment) => {
              const width = totalLinks > 0 ? (segment.value / totalLinks) * 100 : 0;
              return (
                <div
                  key={segment.key}
                  className={`${segment.color}`}
                  style={{ width: `${width}%` }}
                  title={`${segment.key}: ${segment.value}`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: copy.stageDraft, value: draftLinks, textColor: 'text-slate-600' },
              { key: copy.stageInFlight, value: pendingLinks, textColor: 'text-amber-600' },
              { key: copy.stagePaid, value: paidLinks, textColor: 'text-emerald-600' },
              { key: copy.stageClosed, value: closedLinks, textColor: 'text-rose-600' },
            ].map((item) => (
              <div key={item.key} className="rounded-lg border border-surface-3 bg-surface-1 p-3">
                <p className="text-[11px] text-ink-3">{item.key}</p>
                <p className={`mt-1 text-lg font-semibold font-mono ${item.textColor}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
              <PieChart className="h-4 w-4 text-ink-3" />
              {copy.assetMixTitle}
            </h3>
            <p className="mt-1 text-xs text-ink-3">{copy.assetMixSubtitle}</p>
          </div>

          {settledTotal <= 0 ? (
            <div className="rounded-lg border border-dashed border-surface-3 bg-surface-1 px-3 py-6 text-center text-xs text-ink-3">
              {copy.noSettledVolume}
            </div>
          ) : (
            <div className="space-y-3">
              {settledAssetRows.map((row) => {
                const pct = settledTotal > 0 ? (row.value / settledTotal) * 100 : 0;
                return (
                  <div key={row.asset}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-ink-1">{row.asset}</span>
                      <span className="font-mono text-ink-2">{formatSettledAmount(row.asset, row.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <p className="pt-1 text-[11px] text-ink-3">
                {paidLinks} {copy.settledLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
              <Users2 className="h-4 w-4 text-ink-3" />
              {copy.clientActivityTitle}
            </h3>
            <p className="mt-1 text-xs text-ink-3">{copy.clientActivitySubtitle}</p>
          </div>
          <Link
            to="/dashboard/clients"
            className="inline-flex items-center gap-1 text-xs text-stellar-600 hover:text-stellar-700"
          >
            {copy.viewClients}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {topClients.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-3 bg-surface-1 px-3 py-6 text-center text-xs text-ink-3">
            {copy.noClientActivity}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-surface-3 text-xs text-ink-3">
                  <th className="px-3 py-2 text-left font-medium">{copy.colClient}</th>
                  <th className="px-3 py-2 text-right font-medium">{copy.colLinks}</th>
                  <th className="px-3 py-2 text-right font-medium">{copy.colPaid}</th>
                  <th className="px-3 py-2 text-right font-medium">{copy.colPending}</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client) => (
                  <tr key={client.name} className="border-b border-surface-3/70 last:border-0">
                    <td className="px-3 py-2.5 text-sm text-ink-1">{client.name}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm text-ink-1">{client.links}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm text-emerald-600">{client.paid}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm text-amber-600">{client.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
            <History className="h-4 w-4 text-ink-3" />
            {copy.recentInvoices}
          </h3>
          <Link
            to="/dashboard/links"
            className="inline-flex items-center gap-1 text-xs text-stellar-600 hover:text-stellar-700"
          >
            {copy.viewAll}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-ink-3 mb-3">{copy.noInvoices}</p>
            <Link to="/dashboard/create-link" className="btn-primary text-sm">
              <FilePlus2 className="h-4 w-4" />
              {copy.createInvoice}
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-surface-3">
            {recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/dashboard/links/${invoice.id}`}
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
