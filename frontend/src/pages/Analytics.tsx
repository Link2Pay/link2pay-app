import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Clock3, Gauge, PieChart, Users2 } from 'lucide-react';
import { getDashboardStats, listInvoices } from '../services/api';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import { useDashboardViewStore } from '../store/dashboardViewStore';
import { useI18n } from '../i18n/I18nProvider';
import type { DashboardStats, Invoice, InvoiceStatus } from '../types';
import type { Language } from '../i18n/translations';

const DAY_MS = 24 * 60 * 60 * 1000;

type PeriodDays = 7 | 30 | 90;

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    conversion: string;
    avgTicket: string;
    activeLinks: string;
    settledLinks: string;
    settleSpeed: string;
    statusMixTitle: string;
    statusMixSubtitle: string;
    assetMixTitle: string;
    assetMixSubtitle: string;
    trendTitle: string;
    trendSubtitle: string;
    topClientsTitle: string;
    topClientsSubtitle: string;
    noData: string;
    paid: string;
    inProgress: string;
    failed: string;
    other: string;
    client: string;
    links: string;
    paidVolume: string;
    avgMin: string;
    loading: string;
    period7: string;
    period30: string;
    period90: string;
  }
> = {
  en: {
    title: 'Analytics',
    subtitle: 'Performance metrics and payment behavior',
    conversion: 'Conversion',
    avgTicket: 'Avg ticket',
    activeLinks: 'Active links',
    settledLinks: 'Settled links',
    settleSpeed: 'Avg settlement',
    statusMixTitle: 'Status Distribution',
    statusMixSubtitle: 'Current mix of payment lifecycle stages',
    assetMixTitle: 'Paid Volume by Asset',
    assetMixSubtitle: 'Confirmed amount distribution',
    trendTitle: 'Activity Trend',
    trendSubtitle: 'Created links trend for selected period',
    topClientsTitle: 'Top Clients',
    topClientsSubtitle: 'Most active clients by paid volume',
    noData: 'Not enough data yet',
    paid: 'Paid',
    inProgress: 'In Progress',
    failed: 'Failed',
    other: 'Other',
    client: 'Client',
    links: 'Links',
    paidVolume: 'Paid volume',
    avgMin: 'min',
    loading: 'Loading analytics...',
    period7: '7D',
    period30: '30D',
    period90: '90D',
  },
  es: {
    title: 'Analítica',
    subtitle: 'Métricas de rendimiento y comportamiento de pagos',
    conversion: 'Conversión',
    avgTicket: 'Ticket promedio',
    activeLinks: 'Links activos',
    settledLinks: 'Links liquidados',
    settleSpeed: 'Liquidación prom.',
    statusMixTitle: 'Distribución de estados',
    statusMixSubtitle: 'Mix actual de etapas del ciclo de pago',
    assetMixTitle: 'Volumen pagado por activo',
    assetMixSubtitle: 'Distribución de montos confirmados',
    trendTitle: 'Tendencia de actividad',
    trendSubtitle: 'Tendencia de links creados en el período seleccionado',
    topClientsTitle: 'Top clientes',
    topClientsSubtitle: 'Clientes más activos por volumen pagado',
    noData: 'Aún no hay suficientes datos',
    paid: 'Pagado',
    inProgress: 'En progreso',
    failed: 'Fallido',
    other: 'Otros',
    client: 'Cliente',
    links: 'Links',
    paidVolume: 'Volumen pagado',
    avgMin: 'min',
    loading: 'Cargando analítica...',
    period7: '7D',
    period30: '30D',
    period90: '90D',
  },
  pt: {
    title: 'Analítica',
    subtitle: 'Métricas de performance e comportamento de pagamentos',
    conversion: 'Conversão',
    avgTicket: 'Ticket médio',
    activeLinks: 'Links ativos',
    settledLinks: 'Links liquidados',
    settleSpeed: 'Liquidação méd.',
    statusMixTitle: 'Distribuição de status',
    statusMixSubtitle: 'Mix atual das etapas do ciclo de pagamento',
    assetMixTitle: 'Volume pago por ativo',
    assetMixSubtitle: 'Distribuição de valores confirmados',
    trendTitle: 'Tendência de atividade',
    trendSubtitle: 'Tendência de links criados no período selecionado',
    topClientsTitle: 'Top clientes',
    topClientsSubtitle: 'Clientes mais ativos por volume pago',
    noData: 'Ainda não há dados suficientes',
    paid: 'Pago',
    inProgress: 'Em progresso',
    failed: 'Falha',
    other: 'Outros',
    client: 'Cliente',
    links: 'Links',
    paidVolume: 'Volume pago',
    avgMin: 'min',
    loading: 'Carregando analítica...',
    period7: '7D',
    period30: '30D',
    period90: '90D',
  },
};

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

const IN_PROGRESS_STATUSES: InvoiceStatus[] = ['PENDING', 'PROCESSING'];
const FAILED_STATUSES: InvoiceStatus[] = ['FAILED', 'EXPIRED', 'CANCELLED'];

function toNumber(value: string | null | undefined): number {
  const parsed = Number.parseFloat(value || '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function Analytics() {
  const { publicKey } = useWalletStore();
  const { networkPassphrase } = useNetworkStore();
  const { showPreviewLinks } = useDashboardViewStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState<PeriodDays>(30);

  useEffect(() => {
    if (!publicKey) return;

    setLoading(true);
    Promise.all([
      getDashboardStats(publicKey, {
        excludePreview: !showPreviewLinks,
        networkPassphrase,
      }),
      listInvoices(publicKey, undefined, 200, 0, {
        excludePreview: !showPreviewLinks,
        networkPassphrase,
      }),
    ])
      .then(([dashboardStats, result]) => {
        setStats(dashboardStats);
        setInvoices(Array.isArray(result?.invoices) ? result.invoices : []);
      })
      .catch(() => {
        setStats(null);
        setInvoices([]);
      })
      .finally(() => setLoading(false));
  }, [publicKey, networkPassphrase, showPreviewLinks]);

  const now = Date.now();
  const periodStartMs = now - (periodDays - 1) * DAY_MS;

  const periodInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const createdMs = new Date(invoice.createdAt).getTime();
        return Number.isFinite(createdMs) && createdMs >= periodStartMs;
      }),
    [invoices, periodStartMs]
  );

  const paidInvoices = useMemo(
    () => periodInvoices.filter((invoice) => invoice.status === 'PAID'),
    [periodInvoices]
  );

  const totalLinks = periodInvoices.length;
  const paidLinks = paidInvoices.length;
  const pendingLinks = periodInvoices.filter((invoice) =>
    IN_PROGRESS_STATUSES.includes(invoice.status as InvoiceStatus)
  ).length;
  const failedLinks = periodInvoices.filter((invoice) =>
    FAILED_STATUSES.includes(invoice.status as InvoiceStatus)
  ).length;
  const conversionRate = totalLinks > 0 ? (paidLinks / totalLinks) * 100 : 0;

  const avgTicket =
    paidInvoices.length > 0
      ? paidInvoices.reduce((sum, invoice) => sum + toNumber(invoice.total), 0) / paidInvoices.length
      : 0;

  const paidByAsset = useMemo(() => {
    const values: Record<'XLM' | 'USDC' | 'EURC', number> = { XLM: 0, USDC: 0, EURC: 0 };
    paidInvoices.forEach((invoice) => {
      if (invoice.currency in values) {
        values[invoice.currency as 'XLM' | 'USDC' | 'EURC'] += toNumber(invoice.total);
      }
    });
    return values;
  }, [paidInvoices]);

  const settlementAvgMinutes = useMemo(() => {
    const durations = paidInvoices
      .map((invoice) => {
        if (!invoice.paidAt) return null;
        const createdMs = new Date(invoice.createdAt).getTime();
        const paidMs = new Date(invoice.paidAt).getTime();
        if (!Number.isFinite(createdMs) || !Number.isFinite(paidMs) || paidMs <= createdMs) return null;
        return (paidMs - createdMs) / 60000;
      })
      .filter((minutes): minutes is number => minutes !== null);

    if (durations.length === 0) return null;
    return durations.reduce((sum, value) => sum + value, 0) / durations.length;
  }, [paidInvoices]);

  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; links: number; paidVolume: number }>();

    periodInvoices.forEach((invoice) => {
      const name = invoice.clientName || 'Unknown';
      const current = map.get(name) || { name, links: 0, paidVolume: 0 };
      current.links += 1;
      if (invoice.status === 'PAID') {
        current.paidVolume += toNumber(invoice.total);
      }
      map.set(name, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.paidVolume - a.paidVolume || b.links - a.links)
      .slice(0, 6);
  }, [periodInvoices]);

  const activityTrend = useMemo(() => {
    const locale = LOCALE_BY_LANGUAGE[language];
    const bucketSize = periodDays <= 14 ? 1 : periodDays <= 30 ? 3 : 7;
    const bucketCount = Math.ceil(periodDays / bucketSize);

    const buckets = Array.from({ length: bucketCount }).map((_, idx) => {
      const startMs = periodStartMs + idx * bucketSize * DAY_MS;
      const startDate = new Date(startMs);
      const label = startDate.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
      });

      return {
        startMs,
        endMs: startMs + bucketSize * DAY_MS,
        label,
        created: 0,
      };
    });

    periodInvoices.forEach((invoice) => {
      const createdMs = new Date(invoice.createdAt).getTime();
      if (!Number.isFinite(createdMs) || createdMs < periodStartMs) return;
      const offsetDays = Math.floor((createdMs - periodStartMs) / DAY_MS);
      const bucketIndex = Math.min(bucketCount - 1, Math.floor(offsetDays / bucketSize));
      const bucket = buckets[bucketIndex];
      if (bucket && createdMs >= bucket.startMs && createdMs < bucket.endMs) {
        bucket.created += 1;
      }
    });

    return buckets;
  }, [language, periodDays, periodInvoices, periodStartMs]);

  const trendPeak = Math.max(...activityTrend.map((bucket) => bucket.created), 0);
  const paidAssetTotal = Object.values(paidByAsset).reduce((sum, value) => sum + value, 0);
  const otherStatusLinks = Math.max(0, totalLinks - paidLinks - pendingLinks - failedLinks);

  if (loading) {
    return <div className="card p-12 text-center text-sm text-ink-3">{copy.loading}</div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <p className="text-sm text-ink-3">{copy.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.conversion}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-primary">{conversionRate.toFixed(1)}%</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.avgTicket}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-ink-1">{avgTicket.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.activeLinks}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-amber-600">{pendingLinks}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.settledLinks}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-emerald-600">{paidLinks}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.settleSpeed}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-ink-1">
            {settlementAvgMinutes !== null ? `${settlementAvgMinutes.toFixed(1)} ${copy.avgMin}` : '--'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
            <PieChart className="h-4 w-4 text-ink-3" />
            {copy.statusMixTitle}
          </h3>
          <p className="mt-1 text-xs text-ink-3">{copy.statusMixSubtitle}</p>
          {totalLinks <= 0 ? (
            <p className="mt-5 text-xs text-ink-3">{copy.noData}</p>
          ) : (
            <div className="mt-5 space-y-3">
              {[
                { label: copy.paid, value: paidLinks, color: 'bg-emerald-500' },
                { label: copy.inProgress, value: pendingLinks, color: 'bg-amber-500' },
                { label: copy.failed, value: failedLinks, color: 'bg-rose-500' },
                { label: copy.other, value: otherStatusLinks, color: 'bg-slate-400' },
              ].map((item) => {
                const width = totalLinks > 0 ? (item.value / totalLinks) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-ink-1">{item.label}</span>
                      <span className="font-mono text-ink-2">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className={`${item.color} h-2 rounded-full`} style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
            <Gauge className="h-4 w-4 text-ink-3" />
            {copy.assetMixTitle}
          </h3>
          <p className="mt-1 text-xs text-ink-3">{copy.assetMixSubtitle}</p>
          {paidAssetTotal <= 0 ? (
            <p className="mt-5 text-xs text-ink-3">{copy.noData}</p>
          ) : (
            <div className="mt-5 space-y-3">
              {(['XLM', 'USDC', 'EURC'] as const).map((asset) => {
                const value = paidByAsset[asset];
                const width = paidAssetTotal > 0 ? (value / paidAssetTotal) * 100 : 0;
                return (
                  <div key={asset}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-ink-1">{asset}</span>
                      <span className="font-mono text-ink-2">{value.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
              <CalendarDays className="h-4 w-4 text-ink-3" />
              {copy.trendTitle}
            </h3>
            <p className="mt-1 text-xs text-ink-3">{copy.trendSubtitle}</p>
          </div>
          <div className="inline-flex items-center rounded-lg border border-surface-3 bg-surface-1 p-1">
            {([
              { value: 7 as const, label: copy.period7 },
              { value: 30 as const, label: copy.period30 },
              { value: 90 as const, label: copy.period90 },
            ]).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriodDays(option.value)}
                className={`rounded-md px-2.5 py-1 text-xs ${
                  periodDays === option.value
                    ? 'bg-primary/15 text-primary'
                    : 'text-ink-3 hover:text-ink-1'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {trendPeak <= 0 ? (
          <p className="mt-5 text-xs text-ink-3">{copy.noData}</p>
        ) : (
          <div className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${activityTrend.length}, minmax(0, 1fr))` }}>
            {activityTrend.map((bucket) => (
              <div key={bucket.startMs} className="rounded-lg border border-surface-3 bg-surface-1 p-2">
                <p className="mb-2 truncate text-center text-[10px] text-ink-3">{bucket.label}</p>
                <div className="mx-auto flex h-20 w-6 items-end rounded bg-muted">
                  <div
                    className="w-full rounded bg-primary"
                    style={{ height: `${Math.max(8, (bucket.created / trendPeak) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs font-mono text-ink-1">{bucket.created}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-0">
          <Users2 className="h-4 w-4 text-ink-3" />
          {copy.topClientsTitle}
        </h3>
        <p className="mt-1 text-xs text-ink-3">{copy.topClientsSubtitle}</p>

        {topClients.length === 0 ? (
          <p className="mt-5 text-xs text-ink-3">{copy.noData}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-surface-3 text-xs text-ink-3">
                  <th className="px-3 py-2 text-left font-medium">{copy.client}</th>
                  <th className="px-3 py-2 text-right font-medium">{copy.links}</th>
                  <th className="px-3 py-2 text-right font-medium">{copy.paidVolume}</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client) => (
                  <tr key={client.name} className="border-b border-surface-3/70 last:border-0">
                    <td className="px-3 py-2.5 text-sm text-ink-1">{client.name}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm text-ink-1">{client.links}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm text-primary">
                      {client.paidVolume.toLocaleString(LOCALE_BY_LANGUAGE[language], {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {stats && (
        <div className="card p-4">
          <p className="text-xs text-ink-3">
            <span className="inline-flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Global totals:
            </span>{' '}
            total links {stats.totalInvoices} | paid {stats.paidInvoices} | pending {stats.pendingInvoices} | revenue {toNumber(stats.totalRevenue).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
