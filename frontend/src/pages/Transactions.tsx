import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink, History, Search } from 'lucide-react';
import { listInvoices } from '../services/api';
import InvoiceStatusBadge from '../components/Invoice/InvoiceStatusBadge';
import { useWalletStore } from '../store/walletStore';
import { useI18n } from '../i18n/I18nProvider';
import type { Invoice, InvoiceStatus } from '../types';
import type { Language } from '../i18n/translations';
import { CURRENCY_SYMBOLS, config } from '../config';

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
    failed: 'Failed/Expired',
    successRate: 'Success Rate',
    all: 'All',
    filterInProgress: 'In Progress',
    filterFailed: 'Failed',
    filterSettled: 'Settled',
    loading: 'Loading transactions...',
    empty: 'No transaction activity yet.',
    emptyFiltered: 'No transactions match this filter.',
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
    failed: 'Fallidas/expiradas',
    successRate: 'Tasa de exito',
    all: 'Todas',
    filterInProgress: 'En progreso',
    filterFailed: 'Fallidas',
    filterSettled: 'Liquidadas',
    loading: 'Cargando transacciones...',
    empty: 'Aun no hay actividad de transacciones.',
    emptyFiltered: 'No hay transacciones para este filtro.',
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
    failed: 'Falhas/expiradas',
    successRate: 'Taxa de sucesso',
    all: 'Todas',
    filterInProgress: 'Em progresso',
    filterFailed: 'Falhas',
    filterSettled: 'Liquidadas',
    loading: 'Carregando transacoes...',
    empty: 'Ainda nao ha atividade de transacoes.',
    emptyFiltered: 'Nenhuma transacao para este filtro.',
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

const IN_PROGRESS_STATUSES: InvoiceStatus[] = ['PENDING', 'PROCESSING'];
const FAILED_STATUSES: InvoiceStatus[] = ['FAILED', 'EXPIRED', 'CANCELLED'];

export default function Transactions() {
  const { publicKey } = useWalletStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<TransactionFilter>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;

    setLoading(true);
    listInvoices(publicKey, undefined, 100, 0)
      .then(({ invoices: rows }) => setInvoices(Array.isArray(rows) ? rows : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [publicKey]);

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

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div>
          <div className="h-5 w-36 bg-surface-2 rounded mb-2" />
          <div className="h-4 w-64 bg-surface-2 rounded" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="h-3 w-20 bg-surface-2 rounded mb-3" />
              <div className="h-7 w-10 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
        <div className="card p-5 space-y-3">
          <div className="h-9 bg-surface-2 rounded-lg" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-7 w-20 bg-surface-2 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-surface-3 bg-surface-1 px-4 py-3 flex gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 w-16 bg-surface-2 rounded" />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-surface-3 last:border-0">
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 bg-surface-2 rounded" />
                <div className="h-3 w-24 bg-surface-2 rounded" />
              </div>
              <div className="h-3.5 w-20 bg-surface-2 rounded" />
              <div className="h-5 w-16 bg-surface-2 rounded-full" />
              <div className="h-3.5 w-16 bg-surface-2 rounded ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <p className="text-sm text-ink-3">{copy.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.settled}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-emerald-600">{settledCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.inProgress}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-amber-600">{inProgressCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.failed}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-rose-600">{failedCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink-3">{copy.successRate}</p>
          <p className="mt-2 text-2xl font-semibold font-mono text-primary">{successRate}%</p>
        </div>
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
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((button) => (
            <button
              key={button.value}
              type="button"
              onClick={() => setFilter(button.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === button.value
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-surface-3 text-ink-3 hover:bg-surface-1 hover:text-ink-1'
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {transactionRows.length === 0 ? (
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
                <tr className="border-b border-surface-3 bg-surface-1">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colInvoice}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colClient}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colStatus}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colAmount}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colHash}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colDate}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-3">{copy.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3">
                {filteredRows.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-surface-1/60">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-ink-1">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-ink-3">{invoice.title}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-1">
                      <p>{invoice.clientName}</p>
                      <p className="text-xs text-ink-3">{invoice.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-ink-1">
                      {formatAmount(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-4 py-3">
                      {invoice.transactionHash ? (
                        <a
                          href={`https://stellar.expert/explorer/${config.stellarNetwork === 'testnet' ? 'testnet' : 'public'}/tx/${invoice.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-stellar-600 hover:underline"
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
                        <Link to={`/dashboard/links/${invoice.id}`} className="text-xs text-stellar-600 hover:underline">
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
    </div>
  );
}
