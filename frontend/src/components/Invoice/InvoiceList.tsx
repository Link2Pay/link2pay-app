import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listInvoices } from '../../services/api';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { useI18n } from '../../i18n/I18nProvider';
import { useWalletStore } from '../../store/walletStore';
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
}> = {
  en: {
    title: 'Invoices',
    newInvoice: 'New Invoice',
    all: 'All',
    draft: 'Draft',
    pending: 'Pending',
    paid: 'Paid',
    failed: 'Failed',
    loadingInvoices: 'Loading invoices...',
    noInvoicesFound: 'No invoices found',
    createFirstInvoice: 'Create Your First Invoice',
    colInvoice: 'Invoice',
    colClient: 'Client',
    colStatus: 'Status',
    colAmount: 'Amount',
    colDate: 'Date',
  },
  es: {
    title: 'Facturas',
    newInvoice: 'Nueva factura',
    all: 'Todas',
    draft: 'Borrador',
    pending: 'Pendiente',
    paid: 'Pagada',
    failed: 'Fallida',
    loadingInvoices: 'Cargando facturas...',
    noInvoicesFound: 'No se encontraron facturas',
    createFirstInvoice: 'Crear primera factura',
    colInvoice: 'Factura',
    colClient: 'Cliente',
    colStatus: 'Estado',
    colAmount: 'Monto',
    colDate: 'Fecha',
  },
  pt: {
    title: 'Faturas',
    newInvoice: 'Nova fatura',
    all: 'Todas',
    draft: 'Rascunho',
    pending: 'Pendente',
    paid: 'Paga',
    failed: 'Falhou',
    loadingInvoices: 'Carregando faturas...',
    noInvoicesFound: 'Nenhuma fatura encontrada',
    createFirstInvoice: 'Criar primeira fatura',
    colInvoice: 'Fatura',
    colClient: 'Cliente',
    colStatus: 'Status',
    colAmount: 'Valor',
    colDate: 'Data',
  },
};

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

export default function InvoiceList() {
  const { publicKey } = useWalletStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const statusFilters: { label: string; value: string }[] = [
    { label: copy.all, value: '' },
    { label: copy.draft, value: 'DRAFT' },
    { label: copy.pending, value: 'PENDING' },
    { label: copy.paid, value: 'PAID' },
    { label: copy.failed, value: 'FAILED' },
  ];

  useEffect(() => {
    if (!publicKey) return;

    setLoading(true);
    listInvoices(publicKey, filter || undefined)
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [publicKey, filter]);

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
        <Link to="/dashboard/create" className="btn-primary w-full text-sm sm:w-auto">
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
        <div className="card p-12 text-center">
          <p className="text-ink-3 text-sm mb-3">{copy.noInvoicesFound}</p>
          <Link to="/dashboard/create" className="btn-primary text-sm">
            {copy.createFirstInvoice}
          </Link>
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
                      <Link to={`/dashboard/invoices/${invoice.id}`} className="text-sm font-medium text-stellar-600 hover:text-stellar-700">
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
    </div>
  );
}
