import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FilePlus2, Filter } from 'lucide-react';
import { listInvoices } from '../../services/api';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import PageHeader from '../ui/PageHeader';
import Select from '../ui/Select';
import DateRangePicker from '../ui/DateRangePicker';
import { useI18n } from '../../i18n/I18nProvider';
import { useWalletStore } from '../../store/walletStore';
import { useNetworkStore } from '../../store/networkStore';
import { useDashboardViewStore } from '../../store/dashboardViewStore';
import type { InvoiceStatus } from '../../types';
import { formatAmount } from '../../lib/format';
import type { Language } from '../../i18n/translations';

const COPY: Record<Language, {
  title: string;
  newInvoice: string;
  show: string;
  dateAny: string;
  dateFrom: string;
  dateTo: string;
  dateClear: string;
  all: string;
  draft: string;
  pending: string;
  paid: string;
  failed: string;
  loadingInvoices: string;
  noInvoicesFound: string;
  createFirstInvoice: string;
  colInvoice: string;
  colClient: string;
  colStatus: string;
  colAmount: string;
  colDate: string;
  prev: string;
  next: string;
}> = {
  en: {
    title: 'Payment Links',
    newInvoice: 'New Link',
    show: 'Apply filters',
    dateAny: 'Any date',
    dateFrom: 'From',
    dateTo: 'To',
    dateClear: 'Clear',
    all: 'All',
    draft: 'Draft',
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    loadingInvoices: 'Loading payment links...',
    noInvoicesFound: 'No payment links found',
    createFirstInvoice: 'Create Your First Link',
    colInvoice: 'Link',
    colClient: 'Client',
    colStatus: 'Status',
    colAmount: 'Amount',
    colDate: 'Date',
    prev: 'Prev',
    next: 'Next',
  },
  es: {
    title: 'Links de pago',
    newInvoice: 'Nuevo link',
    show: 'Aplicar filtros',
    dateAny: 'Cualquier fecha',
    dateFrom: 'Desde',
    dateTo: 'Hasta',
    dateClear: 'Limpiar',
    all: 'Todas',
    draft: 'Borrador',
    pending: 'Pendiente',
    paid: 'Pagada',
    failed: 'Fallida',
    loadingInvoices: 'Cargando links de pago...',
    noInvoicesFound: 'No se encontraron links de pago',
    createFirstInvoice: 'Crear primer link',
    colInvoice: 'Link',
    colClient: 'Cliente',
    colStatus: 'Estado',
    colAmount: 'Monto',
    colDate: 'Fecha',
    prev: 'Anterior',
    next: 'Siguiente',
  },
  pt: {
    title: 'Links de pagamento',
    newInvoice: 'Novo link',
    show: 'Aplicar filtros',
    dateAny: 'Qualquer data',
    dateFrom: 'De',
    dateTo: 'Até',
    dateClear: 'Limpar',
    all: 'Todas',
    draft: 'Rascunho',
    pending: 'Pendente',
    paid: 'Paga',
    failed: 'Falhou',
    loadingInvoices: 'Carregando links de pagamento...',
    noInvoicesFound: 'Nenhum link de pagamento encontrado',
    createFirstInvoice: 'Criar primeiro link',
    colInvoice: 'Link',
    colClient: 'Cliente',
    colStatus: 'Status',
    colAmount: 'Valor',
    colDate: 'Data',
    prev: 'Anterior',
    next: 'Próximo',
  },
};

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

export default function InvoiceList() {
  const { publicKey } = useWalletStore();
  const { networkPassphrase } = useNetworkStore();
  const { showPreviewLinks } = useDashboardViewStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [filter, setFilter] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    setPage(0);
  }, [showPreviewLinks, networkPassphrase]);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['invoices', publicKey, filter, dateRange.from, dateRange.to, page, networkPassphrase, showPreviewLinks],
    queryFn: () =>
      listInvoices(publicKey!, filter || undefined, PAGE_SIZE, page * PAGE_SIZE, {
        excludePreview: !showPreviewLinks,
        networkPassphrase,
        createdAfter: dateRange.from || undefined,
        createdBefore: dateRange.to || undefined,
      }),
    enabled: !!publicKey,
    placeholderData: (prev) => prev,
  });

  const invoices = data?.invoices ?? [];
  const total = data?.total ?? 0;
  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const matchesNetwork =
          !invoice.networkPassphrase || invoice.networkPassphrase === networkPassphrase;
        if (!matchesNetwork) return false;
        if (showPreviewLinks) return true;
        return !invoice.notes?.includes('__hero_preview_v1__');
      }),
    [invoices, networkPassphrase, showPreviewLinks]
  );

  const statusFilters: { label: string; value: string }[] = [
    { label: copy.all, value: '' },
    { label: copy.draft, value: 'DRAFT' },
    { label: copy.pending, value: 'PENDING' },
    { label: copy.paid, value: 'PAID' },
    { label: copy.failed, value: 'FAILED' },
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(LOCALE_BY_LANGUAGE[language], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={copy.title}
        actions={
          <Link to="/dashboard/create-link" className="btn-primary w-full text-sm sm:w-auto">
            <FilePlus2 className="h-4 w-4" />
            {copy.newInvoice}
          </Link>
        }
      />

      {/* Filtros: etiqueta + dropdowns (status + rango de fechas) — móvil y desktop */}
      <div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2">
          <Filter className="h-4 w-4 text-ink-3" aria-hidden="true" />
          {copy.show}
        </span>
        <div className="mt-2 flex gap-2">
          <div className="flex-1 sm:max-w-[220px]">
            <Select
              id="links-status-filter"
              value={filter}
              options={statusFilters}
              onChange={(value) => { setFilter(value); setPage(0); }}
            />
          </div>
          <div className="flex-1 sm:max-w-[220px]">
            <DateRangePicker
              id="links-date-filter"
              from={dateRange.from}
              to={dateRange.to}
              onChange={(range) => { setDateRange(range); setPage(0); }}
              labels={{ trigger: copy.dateAny, from: copy.dateFrom, to: copy.dateTo, clear: copy.dateClear }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-ink-3 text-sm">{copy.loadingInvoices}</div>
      ) : filteredInvoices.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-ink-3 text-sm mb-3">{copy.noInvoicesFound}</p>
          <Link to="/dashboard/create-link" className="btn-primary text-sm">
            {copy.createFirstInvoice}
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colInvoice}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colClient}</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colStatus}</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colAmount}</th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium uppercase tracking-label text-ink-3">{copy.colDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="transition-colors hover:bg-muted">
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/links/${invoice.id}`} className="text-sm font-medium text-ink-0 hover:text-primary">
                        {invoice.invoiceNumber}
                      </Link>
                      <p className="text-xs text-ink-3 mt-0.5">{invoice.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-ink-1">{invoice.clientName}</p>
                      <p className="text-xs text-ink-3">{invoice.clientEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm font-medium text-ink-0 [font-variant-numeric:tabular-nums]">{formatAmount(invoice.total, invoice.currency)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-ink-3">{formatDate(invoice.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-xs text-ink-3">
          <span className="[font-variant-numeric:tabular-nums]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary h-9 px-3 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              {copy.prev}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
              className="btn-secondary h-9 px-3 text-xs"
            >
              {copy.next}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
