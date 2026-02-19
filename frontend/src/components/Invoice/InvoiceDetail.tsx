import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { deleteInvoice, getOwnerInvoice, sendInvoice } from '../../services/api';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { useI18n } from '../../i18n/I18nProvider';
import { useWalletStore } from '../../store/walletStore';
import type { Invoice, InvoiceStatus } from '../../types';
import { CURRENCY_SYMBOLS, config } from '../../config';
import type { Language } from '../../i18n/translations';
import { downloadInvoicePDF } from './InvoicePDF';

const COPY: Record<Language, {
  loadingInvoice: string;
  invoiceNotFound: string;
  backToInvoices: string;
  stellarLumens: string;
  sendInvoice: string;
  delete: string;
  copied: string;
  copyPaymentLink: string;
  paymentLink: string;
  copy: string;
  sharePaymentLinkHelp: string;
  from: string;
  to: string;
  description: string;
  qty: string;
  rate: string;
  amount: string;
  subtotal: string;
  tax: string;
  total: string;
  notes: string;
  paymentConfirmed: string;
  transactionHash: string;
  paidAt: string;
  payer: string;
  confirmDelete: string;
  downloadPdf: string;
  sendByEmail: string;
  generatingPdf: string;
  pdfDownloaded: string;
  emailSubject: string;
  emailBody: string;
}> = {
  en: {
    loadingInvoice: 'Loading invoice...',
    invoiceNotFound: 'Invoice not found',
    backToInvoices: 'Back to Invoices',
    stellarLumens: 'Stellar Lumens',
    sendInvoice: 'Send Invoice',
    delete: 'Delete',
    copied: 'Copied!',
    copyPaymentLink: 'Copy Payment Link',
    paymentLink: 'Payment Link',
    copy: 'Copy',
    sharePaymentLinkHelp: 'Share this link with your client so they can view and pay the invoice.',
    from: 'From',
    to: 'To',
    description: 'Description',
    qty: 'Qty',
    rate: 'Rate',
    amount: 'Amount',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    notes: 'Notes',
    paymentConfirmed: 'Payment Confirmed',
    transactionHash: 'Transaction Hash',
    paidAt: 'Paid At',
    payer: 'Payer',
    confirmDelete: 'Are you sure you want to delete this invoice?',
    downloadPdf: 'Download PDF',
    sendByEmail: 'Send by Email',
    generatingPdf: 'Generating PDF...',
    pdfDownloaded: 'PDF downloaded',
    emailSubject: 'Invoice',
    emailBody: 'Please find the attached invoice. You can also view and pay it online at',
  },
  es: {
    loadingInvoice: 'Cargando factura...',
    invoiceNotFound: 'Factura no encontrada',
    backToInvoices: 'Volver a facturas',
    stellarLumens: 'Stellar Lumens',
    sendInvoice: 'Enviar factura',
    delete: 'Eliminar',
    copied: 'Copiado!',
    copyPaymentLink: 'Copiar link de pago',
    paymentLink: 'Link de pago',
    copy: 'Copiar',
    sharePaymentLinkHelp: 'Comparte este link con tu cliente para que vea y pague la factura.',
    from: 'De',
    to: 'Para',
    description: 'Descripcion',
    qty: 'Cant.',
    rate: 'Tarifa',
    amount: 'Importe',
    subtotal: 'Subtotal',
    tax: 'Impuesto',
    total: 'Total',
    notes: 'Notas',
    paymentConfirmed: 'Pago confirmado',
    transactionHash: 'Hash de transaccion',
    paidAt: 'Pagado en',
    payer: 'Pagador',
    confirmDelete: 'Seguro que quieres eliminar esta factura?',
    downloadPdf: 'Descargar PDF',
    sendByEmail: 'Enviar por correo',
    generatingPdf: 'Generando PDF...',
    pdfDownloaded: 'PDF descargado',
    emailSubject: 'Factura',
    emailBody: 'Adjunto encontraras la factura. Tambien puedes verla y pagarla en linea en',
  },
  pt: {
    loadingInvoice: 'Carregando fatura...',
    invoiceNotFound: 'Fatura nao encontrada',
    backToInvoices: 'Voltar para faturas',
    stellarLumens: 'Stellar Lumens',
    sendInvoice: 'Enviar fatura',
    delete: 'Excluir',
    copied: 'Copiado!',
    copyPaymentLink: 'Copiar link de pagamento',
    paymentLink: 'Link de pagamento',
    copy: 'Copiar',
    sharePaymentLinkHelp: 'Compartilhe este link com seu cliente para visualizar e pagar a fatura.',
    from: 'De',
    to: 'Para',
    description: 'Descricao',
    qty: 'Qtd.',
    rate: 'Taxa',
    amount: 'Valor',
    subtotal: 'Subtotal',
    tax: 'Imposto',
    total: 'Total',
    notes: 'Notas',
    paymentConfirmed: 'Pagamento confirmado',
    transactionHash: 'Hash da transacao',
    paidAt: 'Pago em',
    payer: 'Pagador',
    confirmDelete: 'Tem certeza que deseja excluir esta fatura?',
    downloadPdf: 'Baixar PDF',
    sendByEmail: 'Enviar por email',
    generatingPdf: 'Gerando PDF...',
    pdfDownloaded: 'PDF baixado',
    emailSubject: 'Fatura',
    emailBody: 'Em anexo voce encontra a fatura. Voce tambem pode visualiza-la e paga-la online em',
  },
};

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publicKey } = useWalletStore();
  const { language } = useI18n();
  const copy = COPY[language];

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!id || !publicKey) return;

    setLoading(true);
    setError(null);

    getOwnerInvoice(id, publicKey)
      .then(setInvoice)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, publicKey]);

  const paymentLink = invoice ? `${window.location.origin}/pay/${invoice.id}` : '';
  const isOwner = invoice?.freelancerWallet === publicKey;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!invoice || !publicKey) return;

    setActionLoading(true);
    try {
      const updated = await sendInvoice(invoice.id, publicKey);
      setInvoice(updated);
      toast.success(`Invoice ${invoice.invoiceNumber} sent to client`);
    } catch (err: any) {
      const msg = err.message || 'Failed to send invoice';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice || !publicKey) return;
    if (!window.confirm(copy.confirmDelete)) return;

    setActionLoading(true);
    try {
      await deleteInvoice(invoice.id, publicKey);
      toast.success(`Invoice ${invoice.invoiceNumber} deleted`);
      navigate('/dashboard/invoices');
    } catch (err: any) {
      const msg = err.message || 'Failed to delete invoice';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      await downloadInvoicePDF(invoice, paymentLink);
      toast.success(copy.pdfDownloaded);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendByEmail = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      // First download the PDF so the user has it ready to attach
      await downloadInvoicePDF(invoice, paymentLink);
      toast.success(copy.pdfDownloaded);

      // Then open mailto with pre-filled subject and body
      const subject = encodeURIComponent(`${copy.emailSubject} ${invoice.invoiceNumber}`);
      const body = encodeURIComponent(
        `${copy.emailBody}\n${paymentLink}\n\n—\nLink2Pay`
      );
      window.open(`mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`, '_blank');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const formatAmount = (amount: string, currency: string) => {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const number = parseFloat(amount);
    if (currency === 'XLM') return `${number.toFixed(2)} ${symbol}`;
    return `${symbol}${number.toFixed(2)}`;
  };

  if (loading) {
    return <div className="text-center py-20 text-ink-3 text-sm">{copy.loadingInvoice}</div>;
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-danger text-sm mb-3">{error || copy.invoiceNotFound}</p>
        <Link to="/dashboard/invoices" className="btn-secondary text-sm">
          {copy.backToInvoices}
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-lg font-semibold text-ink-0">{invoice.invoiceNumber}</h2>
            <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
          </div>
          <p className="text-sm text-ink-3">{invoice.title}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-2xl font-semibold font-mono text-ink-0">{formatAmount(invoice.total, invoice.currency)}</p>
          <p className="text-xs text-ink-3 mt-1">{invoice.currency === 'XLM' ? copy.stellarLumens : invoice.currency}</p>
        </div>
      </div>

      {isOwner && (
        <div className="flex flex-wrap items-center gap-3">
          {invoice.status === 'DRAFT' && (
            <>
              <button onClick={handleSend} disabled={actionLoading} className="btn-primary text-sm">
                {copy.sendInvoice}
              </button>
              <button onClick={handleDelete} disabled={actionLoading} className="btn-danger text-sm">
                {copy.delete}
              </button>
            </>
          )}
          {['PENDING', 'DRAFT'].includes(invoice.status) && (
            <button onClick={handleCopyLink} className="btn-secondary text-sm">
              {copied ? copy.copied : copy.copyPaymentLink}
            </button>
          )}
          <button onClick={handleDownloadPdf} disabled={pdfLoading} className="btn-secondary text-sm">
            {pdfLoading ? copy.generatingPdf : copy.downloadPdf}
          </button>
          <button onClick={handleSendByEmail} disabled={pdfLoading} className="btn-secondary text-sm">
            {pdfLoading ? copy.generatingPdf : copy.sendByEmail}
          </button>
        </div>
      )}

      {isOwner && ['PENDING', 'DRAFT'].includes(invoice.status) && (
        <div className="card p-4">
          <label className="label">{copy.paymentLink}</label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 px-3 py-2 rounded-lg bg-surface-1 text-xs font-mono text-ink-2 overflow-x-auto">
              {paymentLink}
            </code>
            <button onClick={handleCopyLink} className="btn-ghost text-xs">
              {copied ? copy.copied : copy.copy}
            </button>
          </div>
          <p className="text-xs text-ink-3 mt-2">{copy.sharePaymentLinkHelp}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3">{copy.from}</h4>
          {invoice.freelancerName && <p className="text-sm font-medium text-ink-0">{invoice.freelancerName}</p>}
          {invoice.freelancerCompany && <p className="text-sm text-ink-2">{invoice.freelancerCompany}</p>}
          <p className="text-xs font-mono text-ink-3 mt-1 break-all">{invoice.freelancerWallet}</p>
        </div>

        <div className="card p-5">
          <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-3">{copy.to}</h4>
          <p className="text-sm font-medium text-ink-0">{invoice.clientName}</p>
          {invoice.clientCompany && <p className="text-sm text-ink-2">{invoice.clientCompany}</p>}
          <p className="text-sm text-ink-3">{invoice.clientEmail}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="bg-surface-1 border-b border-surface-3">
                <th className="text-left px-4 py-3 text-xs font-medium text-ink-3 uppercase">{copy.description}</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-ink-3 uppercase">{copy.qty}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase">{copy.rate}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-ink-3 uppercase">{copy.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-3">
              {invoice.lineItems.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-ink-0">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-ink-2 text-center">{parseFloat(String(item.quantity))}</td>
                  <td className="px-4 py-3 text-sm font-mono text-ink-2 text-right">{parseFloat(String(item.rate)).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-ink-0 text-right">{parseFloat(String(item.amount)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-surface-3">
              <tr>
                <td colSpan={3} className="px-4 py-2 text-sm text-ink-3 text-right">{copy.subtotal}</td>
                <td className="px-4 py-2 text-sm font-mono text-right">{parseFloat(invoice.subtotal).toFixed(2)}</td>
              </tr>
              {invoice.taxRate && parseFloat(invoice.taxRate) > 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-2 text-sm text-ink-3 text-right">
                    {copy.tax} ({invoice.taxRate}%)
                  </td>
                  <td className="px-4 py-2 text-sm font-mono text-right">{parseFloat(invoice.taxAmount || '0').toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="px-4 py-3 text-base font-semibold text-right">{copy.total}</td>
                <td className="px-4 py-3 text-base font-semibold font-mono text-stellar-700 text-right">
                  {formatAmount(invoice.total, invoice.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {(invoice.description || invoice.notes) && (
        <div className="card p-5 space-y-4">
          {invoice.description && (
            <div>
              <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">{copy.description}</h4>
              <p className="text-sm text-ink-1 whitespace-pre-wrap">{invoice.description}</p>
            </div>
          )}
          {invoice.notes && (
            <div>
              <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-1">{copy.notes}</h4>
              <p className="text-sm text-ink-1 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      )}

      {invoice.status === 'PAID' && invoice.transactionHash && (
        <div className="card p-5 bg-emerald-50 border-emerald-200">
          <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">{copy.paymentConfirmed}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-emerald-600">{copy.transactionHash}</span>
              <a
                href={`https://stellar.expert/explorer/${config.stellarNetwork === 'testnet' ? 'testnet' : 'public'}/tx/${invoice.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-stellar-600 hover:underline break-all"
              >
                {invoice.transactionHash.slice(0, 16)}...
              </a>
            </div>
            {invoice.paidAt && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-emerald-600">{copy.paidAt}</span>
                <span className="text-emerald-700">
                  {new Date(invoice.paidAt).toLocaleString(LOCALE_BY_LANGUAGE[language])}
                </span>
              </div>
            )}
            {invoice.payerWallet && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-emerald-600">{copy.payer}</span>
                <span className="font-mono text-xs text-emerald-700">
                  {invoice.payerWallet.slice(0, 8)}...{invoice.payerWallet.slice(-4)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
