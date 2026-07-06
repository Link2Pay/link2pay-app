import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, Copy, ExternalLink, Gauge, History, Search, XCircle } from 'lucide-react';
import { listInvoices } from '../services/api';
import InvoiceStatusBadge from '../components/Invoice/InvoiceStatusBadge';
import PageHeader from '../components/ui/PageHeader';
import StatCard, { type StatCardData } from '../components/ui/StatCard';
import { useWalletStore } from '../store/walletStore';
import { useNetworkStore } from '../store/networkStore';
import { useDashboardViewStore } from '../store/dashboardViewStore';
import { useI18n } from '../i18n/I18nProvider';
import type { Invoice, InvoiceStatus } from '../types';
import type { Language } from '../i18n/translations';
import { CURRENCY_SYMBOLS, config } from '../config';
import { anonymousPayerWallet, displayClientName, isAnonymousClient } from '../lib/payerDisplay';
import { stellarExpertUrl } from '../lib/stellarExplorer';

type TransactionFilter = 'ALL' | 'IN_PROGRESS' | 'FAILED' | 'PAID';

const COPY: Record<
  Language,
  {
    title: string;
    subtitle: string;
    settled: string;
    inProgress: string;
    failed: string;
    successRate: string;
    all: string;
    filterInProgress: string;
    filterFailed: string;
    filterSettled: string;
    loading: string;
    empty: string;
    emptyFiltered: string;
    loadError: string;
    retry: string;
    colInvoice: string;
    colClient: string;
    colStatus: string;
    colAmount: string;
    colHash: string;
    colDate: string;
    colActions: string;
    searchPlaceholder: string;
    details: string;
    copyCheckout: string;
    copied: string;
    openExplorer: string;
  }
> = {
  en: {
    title: 'Transactions',
    subtitle: 'Settlement and payment activity across your links',
    settled: 'Settled',
    inProgress: 'In Progress',
    failed: 'Failed / Expired',
    successRate: 'Success Rate',
    all: 'All',
    filterInProgress: 'In Progress',
    filterFailed: 'Failed',
    filterSettled: 'Settled',
    loading: 'Loading transactions...',
    empty: 'No transaction activity yet.',
    emptyFiltered: 'No transactions match this filter.',
    loadError: "Couldn't load transactions. Check your connection and try again.",
    retry: 'Retry',
    colInvoice: 'Link',
    colClient: 'Client',
    colStatus: 'Status',
    colAmount: 'Amount',
    colHash: 'Tx Hash',
    colDate: 'Updated',
    colActions: 'Actions',
    searchPlaceholder: 'Search by link, client, or hash...',
    details: 'Details',
    copyCheckout: 'Copy Checkout',
    copied: 'Copied',
    openExplorer: 'Open',
  },
  es: {
    title: 'Transacciones',
    subtitle: 'Actividad de pagos y liquidaciones de tus links',
    settled: 'Liquidadas',
    inProgress: 'En progreso',
    failed: 'Fallidas / Expiradas',
    successRate: 'Tasa de exito',
    all: 'Todas',
    filterInProgress: 'En progreso',
    filterFailed: 'Fallidas',
    filterSettled: 'Liquidadas',
    loading: 'Cargando transacciones...',
    empty: 'Aun no hay actividad de transacciones.',
    emptyFiltered: 'No hay transacciones para este filtro.',
    loadError: 'No se pudieron cargar las transacciones. Revisa tu conexion e intenta de nuevo.',
    retry: 'Reintentar',
    colInvoice: 'Link',
    colClient: 'Cliente',
    colStatus: 'Estado',
    colAmount: 'Monto',
    colHash: 'Hash Tx',
    colDate: 'Actualizado',
    colActions: 'Acciones',
    searchPlaceholder: 'Buscar por link, cliente o hash...',
    details: 'Detalle',
    copyCheckout: 'Copiar checkout',
    copied: 'Copiado',
    openExplorer: 'Abrir',
  },
  pt: {
    title: 'Transacoes',
    subtitle: 'Atividade de pagamentos e liquidacoes dos seus links',
    settled: 'Liquidadas',
    inProgress: 'Em progresso',
    failed: 'Falhas / Expiradas',
    successRate: 'Taxa de sucesso',
    all: 'Todas',
    filterInProgress: 'Em progresso',
    filterFailed: 'Falhas',
    filterSettled: 'Liquidadas',
    loading: 'Carregando transacoes...',
    empty: 'Ainda nao ha atividade de transacoes.',
    emptyFiltered: 'Nenhuma transacao para este filtro.',
    loadError: 'Nao foi possivel carregar as transacoes. Verifique sua conexao e tente novamente.',
    retry: 'Tentar novamente',
    colInvoice: 'Link',
    colClient: 'Cliente',
    colStatus: 'Status',
    colAmount: 'Valor',
    colHash: 'Hash Tx',
    colDate: 'Atualizado',
    colActions: 'Acoes',
    searchPlaceholder: 'Buscar por link, cliente ou hash...',
    details: 'Detalhes',
    copyCheckout: 'Copiar checkout',
    copied: 'Copiado',
    openExplorer: 'Abrir',
  },
};

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

const IN_PROGRESS_STATUSES: InvoiceStatus[] = ['PENDING', 'AWAITING_ANCHOR', 'AWAITING_PAYMENT', 'PROCESSING', 'SETTLING'];
const FAILED_STATUSES: InvoiceStatus[] = ['FAILED', 'EXPIRED', 'CANCELLED', 'ANCHOR_ERROR'];

/**
 * Skeleton de carga de la página de transacciones: replica la geometría real
 * (grid de 4 stat cards + card de búsqueda/tabs + tabla de 7 columnas) con las
 * mismas primitivas (.card, .input, bg-surface-2) para una transición sin reflow.
 */
function TransactionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse sm:space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card flex items-center justify-between gap-3 p-6">
            <div className="space-y-2">
              <div className="h-3.5 w-20 rounded bg-surface-2" />
              <div className="h-7 w-16 rounded bg-surface-2" />
            </div>
            <div className="h-9 w-9 shrink-0 rounded-full bg-surface-2" />
          </div>
        ))}
      </div>

      <div className="card space-y-4 p-4">
        <div className="h-11 w-full rounded-xl bg-surface-2" />
        <div className="flex items-center gap-8 border-b border-border">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="mb-2.5 h-4 w-16 rounded bg-surface-2" />
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="border-b border-border">
                {[...Array(7)].map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <div className={`h-3 w-16 rounded bg-surface-2 ${i >= 3 ? 'ml-auto' : ''}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...Array(6)].map((_, r) => (
                <tr key={r}>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-24 rounded bg-surface-2" />
                    <div className="mt-1 h-3 w-16 rounded bg-surface-2" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-28 rounded bg-surface-2" />
                    <div className="mt-1 h-3 w-20 rounded bg-surface-2" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-6 w-20 rounded-full bg-surface-2" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="ml-auto h-3.5 w-16 rounded bg-surface-2" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-3.5 w-24 rounded bg-surface-2" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="ml-auto h-3 w-20 rounded bg-surface-2" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="ml-auto h-3 w-24 rounded bg-surface-2" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { publicKey } = useWalletStore();
  const { networkPassphrase } = useNetworkStore();
  const { showPreviewLinks } = useDashboardViewStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [hasError, setHasError] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TransactionFilter>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadTransactions = useCallback(() => {
    if (!publicKey) return () => {};
    let cancelled = false;
    setLoading(true);
    setHasError(false);
    listInvoices(publicKey, undefined, 100, 0, {
      excludePreview: !showPreviewLinks,
      networkPassphrase,
    })
      .then(({ invoices: rows }) => {
        if (!cancelled) setInvoices(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        // Distinguish a failed load from a genuinely empty history — otherwise
        // a network error silently reads as "No transaction activity yet."
        if (!cancelled) {
          setInvoices([]);
          setHasError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey, networkPassphrase, showPreviewLinks]);

  useEffect(() => loadTransactions(), [loadTransactions]);

  const transactionRows = useMemo(
    () => invoices.filter((invoice) => invoice.status !== 'DRAFT'),
    [invoices]
  );

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    const byFilter = transactionRows.filter((invoice) => {
      if (filter === 'PAID') return invoice.status === 'PAID';
      if (filter === 'IN_PROGRESS') return IN_PROGRESS_STATUSES.includes(invoice.status as InvoiceStatus);
      if (filter === 'FAILED') return FAILED_STATUSES.includes(invoice.status as InvoiceStatus);
      return true;
    });

    if (!q) return byFilter;

    return byFilter.filter((invoice) =>
      [
        invoice.invoiceNumber,
        invoice.title,
        invoice.clientName,
        invoice.clientEmail,
        invoice.transactionHash || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [filter, query, transactionRows]);

  const settledCount = transactionRows.filter((invoice) => invoice.status === 'PAID').length;
  const inProgressCount = transactionRows.filter((invoice) =>
    IN_PROGRESS_STATUSES.includes(invoice.status as InvoiceStatus)
  ).length;
  const failedCount = transactionRows.filter((invoice) =>
    FAILED_STATUSES.includes(invoice.status as InvoiceStatus)
  ).length;

  const formatAmount = (amount: string, currency: string) => {
    const value = Number.parseFloat(amount || '0');
    if (currency === 'XLM') return `${value.toFixed(2)} XLM`;
    if (currency === 'EURC') return `EUR ${value.toFixed(2)}`;
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    return `${symbol}${value.toFixed(2)}`;
  };

  const successRate =
    transactionRows.length > 0 ? ((settledCount / transactionRows.length) * 100).toFixed(1) : '0.0';

  // Stat cards espectrales: Success rate = acento (indigo), Settled = ink; el
  // resto neutras con tinte semántico (warning / destructive).
  const summaryCards: StatCardData[] = [
    { label: copy.successRate, value: `${successRate}%`, icon: Gauge, variant: 'accent' },
    { label: copy.settled, value: settledCount, icon: CheckCircle2, variant: 'neutral', circle: 'bg-primary/10', glyph: 'text-primary' },
    {
      label: copy.inProgress,
      value: inProgressCount,
      icon: Clock3,
      variant: 'neutral',
      circle: 'bg-warning-subtle',
      glyph: 'text-warning',
      valueClass: 'text-warning',
    },
    {
      label: copy.failed,
      value: failedCount,
      icon: XCircle,
      variant: 'neutral',
      circle: 'bg-destructive-subtle',
      glyph: 'text-destructive',
      valueClass: 'text-destructive',
    },
  ];

  const filterButtons: Array<{ label: string; value: TransactionFilter }> = [
    { label: copy.all, value: 'ALL' },
    { label: copy.filterSettled, value: 'PAID' },
    { label: copy.filterInProgress, value: 'IN_PROGRESS' },
    { label: copy.filterFailed, value: 'FAILED' },
  ];

  const handleCopyCheckout = async (invoiceId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const checkoutUrl = `${origin}/pay/${invoiceId}`;

    try {
      await navigator.clipboard.writeText(checkoutUrl);
      setCopiedId(invoiceId);
      window.setTimeout(() => {
        setCopiedId((current) => (current === invoiceId ? null : current));
      }, 1300);
    } catch {
      // Ignore clipboard errors.
    }
  };

  return (
    <div className="space-y-6 animate-in sm:space-y-8">
      <PageHeader title={copy.title} subtitle={copy.subtitle} />

      {loading ? (
        <TransactionsSkeleton />
      ) : (
        <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="card space-y-4 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="input pl-9 text-sm"
          />
        </div>
        <div className="tabs overflow-x-auto overflow-y-hidden">
          {filterButtons.map((button) => (
            <button
              key={button.value}
              type="button"
              onClick={() => setFilter(button.value)}
              aria-current={filter === button.value ? 'true' : undefined}
              className={`tab whitespace-nowrap ${filter === button.value ? 'tab-active' : ''}`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {hasError ? (
        <div className="card p-12 text-center">
          <History className="mx-auto mb-3 h-6 w-6 text-destructive" />
          <p className="mb-3 text-sm text-destructive">{copy.loadError}</p>
          <button onClick={loadTransactions} className="btn-secondary text-sm">
            {copy.retry}
          </button>
        </div>
      ) : transactionRows.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="mx-auto mb-3 h-6 w-6 text-ink-3" />
          <p className="text-sm text-ink-3">{copy.empty}</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="mx-auto mb-3 h-6 w-6 text-ink-3" />
          <p className="text-sm text-ink-3">{copy.emptyFiltered}</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colInvoice}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colClient}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colStatus}</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colAmount}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colHash}</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colDate}</th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-muted">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-ink-1">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-ink-3">{invoice.title}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-1">
                      {/* Anonymous quick links: payer wallet once paid, dash while unpaid. */}
                      {isAnonymousClient(invoice) ? (
                        anonymousPayerWallet(invoice) ? (
                          <a
                            href={stellarExpertUrl('account', anonymousPayerWallet(invoice)!, invoice.networkPassphrase)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono hover:text-stellar-600 hover:underline"
                          >
                            {displayClientName(invoice)}
                          </a>
                        ) : (
                          <p className="font-mono">—</p>
                        )
                      ) : (
                        <>
                          <p>{invoice.clientName}</p>
                          <p className="text-xs text-ink-3">{invoice.clientEmail}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-ink-1 [font-variant-numeric:tabular-nums]">
                      {formatAmount(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {invoice.transactionHash ? (
                        <a
                          href={`https://stellar.expert/explorer/${config.stellarNetwork === 'testnet' ? 'testnet' : 'public'}/tx/${invoice.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[13px] text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {invoice.transactionHash.slice(0, 10)}...
                          <ExternalLink className="h-3 w-3" />
                          {copy.openExplorer}
                        </a>
                      ) : (
                        <span className="text-xs text-ink-3">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-ink-3">
                      {new Date(invoice.updatedAt || invoice.createdAt).toLocaleString(LOCALE_BY_LANGUAGE[language])}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link to={`/dashboard/links/${invoice.id}`} className="text-xs font-medium text-secondary-foreground hover:text-foreground hover:underline">
                          {copy.details}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyCheckout(invoice.id)}
                          className="inline-flex items-center gap-1 text-xs text-ink-2 hover:text-ink-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedId === invoice.id ? copy.copied : copy.copyCheckout}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
