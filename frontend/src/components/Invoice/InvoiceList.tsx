import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, KeyRound, Lock, Webhook } from 'lucide-react';
import { listInvoices } from '../../services/api';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { useI18n } from '../../i18n/I18nProvider';
import { useActorWallet } from '../../hooks/useActorWallet';
import type { Invoice, InvoiceStatus } from '../../types';
import { CURRENCY_SYMBOLS } from '../../config';
import type { Language } from '../../i18n/translations';

const COPY: Record<Language, {
  title: string;
  newInvoice: string;
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
  quickstartTitle: string;
  quickstartDesc: string;
  quickstartStep1: string;
  quickstartStep2: string;
  quickstartStep3: string;
  quickstartDocs: string;
  quickstartOpen: string;
  tryNowTitle: string;
  tryNowDesc: string;
  tryNowCta: string;
}> = {
  en: {
    title: 'Payment Links',
    newInvoice: 'New Link',
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
    quickstartTitle: 'Quickstart (Developers)',
    quickstartDesc: 'Infrastructure path for production integrations.',
    quickstartStep1: 'Get API key (Pro)',
    quickstartStep2: 'Create link via API/SDK',
    quickstartStep3: 'Confirm payment with polling/webhooks',
    quickstartDocs: 'Read docs',
    quickstartOpen: 'Open quickstart',
    tryNowTitle: 'Try it now (No setup)',
    tryNowDesc: 'Create a basic payment link on Free to validate your checkout flow.',
    tryNowCta: 'Create a Link',
  },
  es: {
    title: 'Links de pago',
    newInvoice: 'Nuevo link',
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
    quickstartTitle: 'Quickstart (Desarrolladores)',
    quickstartDesc: 'Ruta de infraestructura para integraciones en produccion.',
    quickstartStep1: 'Obtener API key (Pro)',
    quickstartStep2: 'Crear link via API/SDK',
    quickstartStep3: 'Confirmar pago con polling/webhooks',
    quickstartDocs: 'Leer docs',
    quickstartOpen: 'Abrir quickstart',
    tryNowTitle: 'Probar ahora (sin setup)',
    tryNowDesc: 'Crea un link basico en Free para validar tu flujo de checkout.',
    tryNowCta: 'Crear Link',
  },
  pt: {
    title: 'Links de pagamento',
    newInvoice: 'Novo link',
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
    quickstartTitle: 'Quickstart (Desenvolvedores)',
    quickstartDesc: 'Caminho de infraestrutura para integracoes em producao.',
    quickstartStep1: 'Gerar API key (Pro)',
    quickstartStep2: 'Criar link via API/SDK',
    quickstartStep3: 'Confirmar pagamento via polling/webhooks',
    quickstartDocs: 'Ler docs',
    quickstartOpen: 'Abrir quickstart',
    tryNowTitle: 'Teste agora (sem setup)',
    tryNowDesc: 'Crie um link basico no Free para validar o fluxo de checkout.',
    tryNowCta: 'Criar Link',
  },
};

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

export default function InvoiceList() {
  const actorWallet = useActorWallet();
  const { language } = useI18n();
  const copy = COPY[language];

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const statusFilters: { label: string; value: string }[] = [
    { label: copy.all, value: '' },
    { label: copy.draft, value: 'DRAFT' },
    { label: copy.pending, value: 'PENDING' },
    { label: copy.paid, value: 'PAID' },
    { label: copy.failed, value: 'FAILED' },
  ];

  // Reset to page 0 when filter changes
  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    if (!actorWallet) return;

    setLoading(true);
    listInvoices(actorWallet, filter || undefined, PAGE_SIZE, page * PAGE_SIZE)
      .then(({ invoices: fetched, total: fetchedTotal }) => {
        setInvoices(fetched);
        setTotal(fetchedTotal);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actorWallet, filter, page]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(LOCALE_BY_LANGUAGE[language], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: string, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const number = parseFloat(amount);
    if (currency === 'XLM') return `${number.toFixed(2)} ${symbol}`;
    return `${symbol}${number.toFixed(2)}`;
  };

  return (
    <div className="animate-in">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-ink-0">{copy.title}</h2>
        <Link to="/app/create-link" className="btn-primary w-full text-sm sm:w-auto">
          + {copy.newInvoice}
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {statusFilters.map((statusFilter) => (
          <button
            key={statusFilter.value}
            onClick={() => setFilter(statusFilter.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === statusFilter.value
                ? 'bg-stellar-50 text-stellar-700 border border-stellar-200'
                : 'text-ink-3 hover:bg-surface-1 border border-transparent'
            }`}
          >
            {statusFilter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center text-ink-3 text-sm">{copy.loadingInvoices}</div>
      ) : invoices.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h4 className="text-sm font-semibold text-ink-0">{copy.quickstartTitle}</h4>
            <p className="mt-1 text-xs text-ink-3">{copy.quickstartDesc}</p>
            <div className="mt-4 space-y-2 text-xs text-ink-2">
              <div className="flex items-center gap-2 rounded-lg border border-surface-3 bg-surface-1 px-3 py-2">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span>{copy.quickstartStep1}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-surface-3 bg-surface-1 px-3 py-2">
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span>{copy.quickstartStep2}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-surface-3 bg-surface-1 px-3 py-2">
                <Webhook className="h-3.5 w-3.5 text-emerald-600" />
                <span>{copy.quickstartStep3}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/sdk" className="btn-secondary text-xs">
                <KeyRound className="h-3.5 w-3.5" />
                {copy.quickstartDocs}
              </Link>
              <Link to="/sdk" className="btn-secondary text-xs">
                {copy.quickstartOpen}
              </Link>
            </div>
          </div>

          <div className="card p-5">
            <h4 className="text-sm font-semibold text-ink-0">{copy.tryNowTitle}</h4>
            <p className="mt-1 text-xs text-ink-3">{copy.tryNowDesc}</p>
            <div className="mt-4 rounded-lg border border-dashed border-border bg-surface-1 p-4 text-xs text-ink-3">
              {copy.noInvoicesFound}
            </div>
            <Link to="/app/create-link" className="btn-primary mt-4 text-sm">
              {copy.tryNowCta}
            </Link>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-surface-3 bg-surface-1">
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">{copy.colInvoice}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">{copy.colClient}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">{copy.colStatus}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">{copy.colAmount}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase tracking-wider">{copy.colDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-3">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-surface-1 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/app/links/${invoice.id}`} className="text-sm font-medium text-stellar-600 hover:text-stellar-700">
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
                      <span className="text-sm font-mono font-medium text-ink-0">{formatAmount(invoice.total, invoice.currency)}</span>
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
        <div className="mt-4 flex items-center justify-between text-xs text-ink-3">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} / {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-surface-3 disabled:opacity-40 hover:bg-surface-1 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * PAGE_SIZE >= total}
              className="px-3 py-1.5 rounded-lg border border-surface-3 disabled:opacity-40 hover:bg-surface-1 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

