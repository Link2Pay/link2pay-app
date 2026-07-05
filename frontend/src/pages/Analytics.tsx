import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, Gauge, PieChart, Timer, Users2 } from 'lucide-react';
import { getDashboardStats, listInvoices } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import StatCard, { type StatCardData } from '../components/ui/StatCard';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import { useDashboardViewStore } from '../store/dashboardViewStore';
import { useI18n } from '../i18n/I18nProvider';
import type { DashboardStats, Invoice, InvoiceStatus } from '../types';
import type { Language } from '../i18n/translations';

const DAY_MS = 24 * 60 * 60 * 1000;

type PeriodDays = 7 | 15 | 30 | 60 | 90 | 120 | 150;

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    conversion: string;
    avgTicket: string;
    activeLinks: string;
    settledLinks: string;
    confirmed: string;
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
    period15: string;
    period30: string;
    period60: string;
    period90: string;
    period120: string;
    period150: string;
  }
> = {
  en: {
    title: 'Analytics',
    subtitle: 'Performance metrics and payment behavior',
    conversion: 'Conversion',
    avgTicket: 'Avg ticket',
    activeLinks: 'Active links',
    settledLinks: 'Settled links',
    confirmed: 'Confirmed',
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
    period15: '15D',
    period30: '30D',
    period60: '60D',
    period90: '90D',
    period120: '120D',
    period150: '150D',
  },
  es: {
    title: 'Analítica',
    subtitle: 'Métricas de rendimiento y comportamiento de pagos',
    conversion: 'Conversión',
    avgTicket: 'Ticket promedio',
    activeLinks: 'Links activos',
    settledLinks: 'Links liquidados',
    confirmed: 'Confirmados',
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
    period15: '15D',
    period30: '30D',
    period60: '60D',
    period90: '90D',
    period120: '120D',
    period150: '150D',
  },
  pt: {
    title: 'Analítica',
    subtitle: 'Métricas de performance e comportamento de pagamentos',
    conversion: 'Conversão',
    avgTicket: 'Ticket médio',
    activeLinks: 'Links ativos',
    settledLinks: 'Links liquidados',
    confirmed: 'Confirmados',
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
    period15: '15D',
    period30: '30D',
    period60: '60D',
    period90: '90D',
    period120: '120D',
    period150: '150D',
  },
};

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

const IN_PROGRESS_STATUSES: InvoiceStatus[] = ['PENDING', 'AWAITING_ANCHOR', 'AWAITING_PAYMENT', 'PROCESSING', 'SETTLING'];
const FAILED_STATUSES: InvoiceStatus[] = ['FAILED', 'EXPIRED', 'CANCELLED', 'ANCHOR_ERROR'];

function toNumber(value: string | null | undefined): number {
  const parsed = Number.parseFloat(value || '0');
  return Number.isFinite(parsed) ? parsed : 0;
}

// Alturas fijas para las barras del chart de tendencia del skeleton: dan un
// perfil "de gráfico" realista sin depender de datos ni de valores aleatorios.
const TREND_BAR_HEIGHTS = ['h-10', 'h-16', 'h-12', 'h-20', 'h-14', 'h-8', 'h-16', 'h-12', 'h-16', 'h-20', 'h-10', 'h-14'];

/**
 * Skeleton de carga de la página de analítica: replica la geometría real
 * (6 KPIs + 2 cards de barras horizontales + card de tendencia con toggle +
 * tabla Top Clients) con las mismas primitivas (.card, bg-surface-2) para una
 * transición sin reflow.
 */
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse sm:space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card flex items-center justify-between gap-3 p-6">
            <div className="space-y-2">
              <div className="h-3.5 w-16 rounded bg-surface-2" />
              <div className="h-7 w-14 rounded bg-surface-2" />
            </div>
            <div className="h-9 w-9 shrink-0 rounded-full bg-surface-2" />
          </div>
        ))}
      </div>

      {/* Dos cards de barras horizontales (Status / Asset mix) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[4, 3].map((rows, card) => (
          <div key={card} className="card p-5">
            <div className="h-4 w-40 rounded bg-surface-2" />
            <div className="mt-2 h-3 w-56 rounded bg-surface-2" />
            <div className="mt-5 space-y-3">
              {[...Array(rows)].map((_, r) => (
                <div key={r}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="h-3 w-16 rounded bg-surface-2" />
                    <div className="h-3 w-8 rounded bg-surface-2" />
                  </div>
                  <div className="h-2 rounded-full bg-surface-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Activity Trend (barras verticales + toggle de rango) */}
      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="h-4 w-36 rounded bg-surface-2" />
            <div className="mt-2 h-3 w-52 rounded bg-surface-2" />
          </div>
          <div className="h-9 w-40 rounded-full bg-surface-2" />
        </div>
        <div
          className="mt-5 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${TREND_BAR_HEIGHTS.length}, minmax(0, 1fr))` }}
        >
          {TREND_BAR_HEIGHTS.map((height, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-2">
              <div className="mx-auto mb-2 h-2.5 w-6 rounded bg-surface-2" />
              <div className="mx-auto flex h-20 w-6 items-end rounded bg-muted">
                <div className={`w-full rounded bg-surface-2 ${height}`} />
              </div>
              <div className="mx-auto mt-2 h-2.5 w-4 rounded bg-surface-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Top Clients (tabla de 3 columnas) */}
      <div className="card p-5">
        <div className="h-4 w-32 rounded bg-surface-2" />
        <div className="mt-2 h-3 w-48 rounded bg-surface-2" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border">
                {[...Array(3)].map((_, i) => (
                  <th key={i} className="px-3 py-2">
                    <div className={`h-3 w-16 rounded bg-surface-2 ${i >= 1 ? 'ml-auto' : ''}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...Array(6)].map((_, r) => (
                <tr key={r}>
                  <td className="px-3 py-2.5"><div className="h-3.5 w-32 rounded bg-surface-2" /></td>
                  <td className="px-3 py-2.5"><div className="ml-auto h-3.5 w-10 rounded bg-surface-2" /></td>
                  <td className="px-3 py-2.5"><div className="ml-auto h-3.5 w-20 rounded bg-surface-2" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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

  // KPIs espectrales: Conversión = acento (indigo), Liquidados = ink; resto neutras.
  const kpiCards: StatCardData[] = [
    { label: copy.conversion, value: `${conversionRate.toFixed(1)}%`, icon: Gauge, variant: 'accent' },
    { label: copy.settledLinks, value: paidLinks, icon: CheckCircle2, variant: 'neutral', circle: 'bg-primary/10', glyph: 'text-primary' },
    { label: copy.avgTicket, value: avgTicket.toFixed(2), icon: CircleDollarSign, variant: 'neutral' },
    {
      label: copy.activeLinks,
      value: pendingLinks,
      icon: Clock3,
      variant: 'neutral',
      circle: 'bg-warning-subtle',
      glyph: 'text-warning',
      valueClass: 'text-warning',
    },
    {
      label: copy.confirmed,
      value: paidLinks,
      icon: CheckCircle2,
      variant: 'neutral',
      circle: 'bg-success-subtle',
      glyph: 'text-success',
      valueClass: 'text-success',
    },
    {
      label: copy.settleSpeed,
      value: settlementAvgMinutes !== null ? `${settlementAvgMinutes.toFixed(1)} ${copy.avgMin}` : '--',
      icon: Timer,
      variant: 'neutral',
    },
  ];

  return (
    <div className="space-y-6 animate-in sm:space-y-8">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      {loading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
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
                { label: copy.paid, value: paidLinks, color: 'bg-success' },
                { label: copy.inProgress, value: pendingLinks, color: 'bg-warning' },
                { label: copy.failed, value: failedLinks, color: 'bg-destructive' },
                { label: copy.other, value: otherStatusLinks, color: 'bg-muted-foreground' },
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
              {(['XLM', 'USDC', 'EURC'] as const).map((asset, index) => {
                const value = paidByAsset[asset];
                const width = paidAssetTotal > 0 ? (value / paidAssetTotal) * 100 : 0;
                // DS §4.7: tinta → lavanda → cat, con label textual siempre.
                const assetFill = ['bg-foreground', 'bg-accent', 'bg-cat-sand'][index % 3];
                return (
                  <div key={asset}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-ink-1">{asset}</span>
                      <span className="font-mono text-ink-2">{value.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${assetFill}`} style={{ width: `${width}%` }} />
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
          <div className="pill-toggle scrollbar-none flex max-w-full overflow-x-auto overflow-y-hidden">
            {([
              { value: 7 as const, label: copy.period7 },
              { value: 15 as const, label: copy.period15 },
              { value: 30 as const, label: copy.period30 },
              { value: 60 as const, label: copy.period60 },
              { value: 90 as const, label: copy.period90 },
              { value: 120 as const, label: copy.period120 },
              { value: 150 as const, label: copy.period150 },
            ]).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriodDays(option.value)}
                aria-pressed={periodDays === option.value}
                className={`pill-item shrink-0 ${periodDays === option.value ? 'pill-item-active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {trendPeak <= 0 ? (
          <p className="mt-5 text-xs text-ink-3">{copy.noData}</p>
        ) : (
          <div className="scrollbar-none mt-5 overflow-x-auto">
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${activityTrend.length}, minmax(2.5rem, 1fr))` }}>
              {activityTrend.map((bucket) => (
              <div key={bucket.startMs} className="rounded-xl border border-border bg-card p-2">
                <p className="mb-2 truncate text-center text-3xs text-ink-3">{bucket.label}</p>
                <div className="mx-auto flex h-20 w-6 items-end rounded bg-muted">
                  <div
                    className="w-full rounded bg-accent"
                    style={{ height: `${Math.max(8, (bucket.created / trendPeak) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-center font-mono text-xs text-ink-1 [font-variant-numeric:tabular-nums]">{bucket.created}</p>
              </div>
              ))}
            </div>
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
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.client}</th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.links}</th>
                  <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.paidVolume}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topClients.map((client) => (
                  <tr key={client.name} className="transition-colors hover:bg-muted">
                    <td className="px-3 py-2.5 text-sm font-medium text-ink-1">{client.name}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm text-ink-1 [font-variant-numeric:tabular-nums]">{client.links}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm text-positive [font-variant-numeric:tabular-nums]">
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
        </>
      )}
    </div>
  );
}
