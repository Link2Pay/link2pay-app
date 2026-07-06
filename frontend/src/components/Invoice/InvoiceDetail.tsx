import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowDown, ArrowRight, Mail, Share2, Wallet } from 'lucide-react';
import { buildShareCardPng, sharePng } from '../../lib/shareCard';
import { cancelInvoice, deleteInvoice, getOwnerInvoice, sendInvoice } from '../../services/api';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { useI18n } from '../../i18n/I18nProvider';
import { useWalletStore } from '../../store/walletStore';
import type { Invoice, InvoiceStatus } from '../../types';
import { config } from '../../config';
import { formatAmount } from '../../lib/format';
import { counterpartyWallet, displayClientName, isAnonymousClient } from '../../lib/payerDisplay';
import { stellarExpertUrl } from '../../lib/stellarExplorer';
import type { Language } from '../../i18n/translations';
import { downloadInvoicePDF } from './InvoicePDF';
import ReceiverOffRamp from './ReceiverOffRamp';

const initial = (value?: string) => (value?.trim()?.[0] ?? '?').toUpperCase();
const shortWallet = (wallet?: string) =>
  wallet && wallet.length > 14 ? `${wallet.slice(0, 6)}…${wallet.slice(-6)}` : wallet ?? '';

const COPY: Record<Language, {
  loadingInvoice: string;
  invoiceNotFound: string;
  backToInvoices: string;
  sendInvoice: string;
  delete: string;
  cancelLink: string;
  confirmCancel: string;
  linkCancelled: string;
  copied: string;
  paymentLink: string;
  copy: string;
  shareImage: string;
  imageDownloaded: string;
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
  generatingPdf: string;
  pdfDownloaded: string;
}> = {
  en: {
    loadingInvoice: 'Loading invoice...',
    invoiceNotFound: 'Invoice not found',
    backToInvoices: 'Back to Invoices',
    sendInvoice: 'Send Invoice',
    delete: 'Delete',
    cancelLink: 'Cancel link',
    confirmCancel: 'Cancel this payment link? The payer will no longer be able to pay it.',
    linkCancelled: 'Link cancelled',
    copied: 'Copied!',
    paymentLink: 'Payment Link',
    copy: 'Copy',
    shareImage: 'Share image',
    imageDownloaded: 'Image downloaded — attach it anywhere, the QR opens this link',
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
    generatingPdf: 'Generating PDF...',
    pdfDownloaded: 'PDF downloaded',
  },
  es: {
    loadingInvoice: 'Cargando factura...',
    invoiceNotFound: 'Factura no encontrada',
    backToInvoices: 'Volver a facturas',
    sendInvoice: 'Enviar factura',
    delete: 'Eliminar',
    cancelLink: 'Cancelar link',
    confirmCancel: '¿Cancelar este link de pago? El pagador ya no podrá pagarlo.',
    linkCancelled: 'Link cancelado',
    copied: 'Copiado!',
    paymentLink: 'Link de pago',
    copy: 'Copiar',
    shareImage: 'Compartir imagen',
    imageDownloaded: 'Imagen descargada — adjúntala donde quieras, el QR abre este link',
    sharePaymentLinkHelp: 'Comparte este link con tu cliente para que vea y pague la factura.',
    from: 'De',
    to: 'Para',
    description: 'Descripción',
    qty: 'Cant.',
    rate: 'Tarifa',
    amount: 'Importe',
    subtotal: 'Subtotal',
    tax: 'Impuesto',
    total: 'Total',
    notes: 'Notas',
    paymentConfirmed: 'Pago confirmado',
    transactionHash: 'Hash de transacción',
    paidAt: 'Pagado en',
    payer: 'Pagador',
    confirmDelete: '¿Seguro que quieres eliminar esta factura?',
    downloadPdf: 'Descargar PDF',
    generatingPdf: 'Generando PDF...',
    pdfDownloaded: 'PDF descargado',
  },
  pt: {
    loadingInvoice: 'Carregando fatura...',
    invoiceNotFound: 'Fatura não encontrada',
    backToInvoices: 'Voltar para faturas',
    sendInvoice: 'Enviar fatura',
    delete: 'Excluir',
    cancelLink: 'Cancelar link',
    confirmCancel: 'Cancelar este link de pagamento? O pagador não poderá mais pagá-lo.',
    linkCancelled: 'Link cancelado',
    copied: 'Copiado!',
    paymentLink: 'Link de pagamento',
    copy: 'Copiar',
    shareImage: 'Compartilhar imagem',
    imageDownloaded: 'Imagem baixada — anexe onde quiser, o QR abre este link',
    sharePaymentLinkHelp: 'Compartilhe este link com seu cliente para visualizar e pagar a fatura.',
    from: 'De',
    to: 'Para',
    description: 'Descrição',
    qty: 'Qtd.',
    rate: 'Taxa',
    amount: 'Valor',
    subtotal: 'Subtotal',
    tax: 'Imposto',
    total: 'Total',
    notes: 'Notas',
    paymentConfirmed: 'Pagamento confirmado',
    transactionHash: 'Hash da transação',
    paidAt: 'Pago em',
    payer: 'Pagador',
    confirmDelete: 'Tem certeza que deseja excluir esta fatura?',
    downloadPdf: 'Baixar PDF',
    generatingPdf: 'Gerando PDF...',
    pdfDownloaded: 'PDF baixado',
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
  const [sharingImage, setSharingImage] = useState(false);
  const qrCanvasWrapRef = useRef<HTMLDivElement>(null);

  // Preview solo-dev (`/dev/links/mock-*`): renderiza el detalle real con datos mock,
  // sin wallet conectada y sin backend. Detrás de `import.meta.env.DEV` → sin efecto en prod.
  const isMockPreview = import.meta.env.DEV && (id?.startsWith('mock') ?? false);

  useEffect(() => {
    if (!id) return;
    if (!publicKey && !isMockPreview) return;

    setLoading(true);
    setError(null);

    getOwnerInvoice(id, publicKey ?? '')
      .then(setInvoice)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, publicKey, isMockPreview]);

  const paymentLink = invoice ? `${window.location.origin}/pay/${invoice.id}` : '';
  const isOwner = isMockPreview ? true : invoice?.freelancerWallet === publicKey;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareImage = async () => {
    const qrCanvas = qrCanvasWrapRef.current?.querySelector('canvas');
    if (!invoice || !qrCanvas) return;
    setSharingImage(true);
    try {
      const blob = await buildShareCardPng({
        qrCanvas,
        amountLabel: formatAmount(invoice.total, invoice.currency),
        name: invoice.freelancerName || invoice.freelancerCompany,
        url: paymentLink,
      });
      const result = await sharePng(blob, `link2pay-${invoice.invoiceNumber}.png`, paymentLink);
      if (result === 'downloaded') toast.success(copy.imageDownloaded);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create image');
    } finally {
      setSharingImage(false);
    }
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
      navigate('/dashboard/links');
    } catch (err: any) {
      const msg = err.message || 'Failed to delete invoice';
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice || !publicKey) return;
    if (!window.confirm(copy.confirmCancel)) return;

    setActionLoading(true);
    try {
      const updated = await cancelInvoice(invoice.id, publicKey);
      setInvoice(updated);
      toast.success(copy.linkCancelled);
    } catch (err: any) {
      const msg = err.message || 'Failed to cancel link';
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

  if (loading) {
    return <div className="text-center py-20 text-ink-3 text-sm">{copy.loadingInvoice}</div>;
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-danger text-sm mb-3">{error || copy.invoiceNotFound}</p>
        <Link to="/dashboard/links" className="btn-secondary text-sm">
          {copy.backToInvoices}
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg font-semibold text-ink-0">{invoice.invoiceNumber}</h2>
          <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
        </div>
        <p className="text-sm text-ink-3">{invoice.title}</p>
      </div>

      {isOwner && ['PENDING', 'DRAFT'].includes(invoice.status) && (
        <div className="card p-4">
          <label className="label">{copy.paymentLink}</label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 px-3 py-2 rounded-lg bg-surface-1 text-xs font-mono text-ink-2 overflow-x-auto">
              {paymentLink}
            </code>
            <button onClick={handleCopyLink} className="btn-secondary text-xs">
              {copied ? copy.copied : copy.copy}
            </button>
            <button onClick={handleShareImage} disabled={sharingImage} className="btn-ghost text-xs">
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.shareImage}
            </button>
          </div>
          <p className="text-xs text-ink-3 mt-2">{copy.sharePaymentLinkHelp}</p>
          {/* Offscreen QR source for the share-card PNG (crisp at 512px). */}
          <div ref={qrCanvasWrapRef} className="hidden" aria-hidden="true">
            <QRCodeCanvas value={paymentLink} size={512} marginSize={0} />
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
          {/* DE (emisor) — énfasis */}
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-base font-semibold text-ink-1">
              {invoice.freelancerLogoUrl ? (
                <img src={invoice.freelancerLogoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initial(invoice.freelancerName || invoice.freelancerCompany || invoice.freelancerWallet)
              )}
            </span>
            <div className="min-w-0">
              <p className="label mb-0.5">{copy.from}</p>
              <p className="truncate font-display text-base font-bold text-ink-0">{invoice.freelancerName ?? '—'}</p>
              {invoice.freelancerCompany && invoice.freelancerName && (
                <p className="truncate text-xs text-ink-3">{invoice.freelancerCompany}</p>
              )}
              <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-ink-3">
                <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{shortWallet(invoice.freelancerWallet)}</span>
              </p>
            </div>
          </div>

          {/* DE → PARA */}
          <div className="flex items-center justify-center text-ink-3" aria-hidden="true">
            <ArrowRight className="hidden h-4 w-4 sm:block" />
            <ArrowDown className="h-4 w-4 sm:hidden" />
          </div>

          {/* PARA (cliente) — secundario, alineado a la derecha en desktop.
              Con wallet conocida (pagador o cliente) el nombre enlaza al explorer;
              links anónimos muestran la wallet una vez pagado, '—' antes. */}
          <div className="flex items-center gap-3 sm:justify-end sm:text-right">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-base font-semibold text-ink-1 sm:order-2">
              {initial(displayClientName(invoice) ?? '—')}
            </span>
            <div className="min-w-0 sm:order-1">
              <p className="label mb-0.5">{copy.to}</p>
              {counterpartyWallet(invoice) && displayClientName(invoice) ? (
                <a
                  href={stellarExpertUrl('account', counterpartyWallet(invoice)!, invoice.networkPassphrase)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block truncate text-sm font-semibold text-ink-0 hover:text-stellar-600 hover:underline ${isAnonymousClient(invoice) ? 'font-mono' : ''}`}
                >
                  {displayClientName(invoice)}
                </a>
              ) : (
                <p className={`truncate text-sm font-semibold text-ink-0 ${isAnonymousClient(invoice) ? 'font-mono' : ''}`}>
                  {displayClientName(invoice) ?? '—'}
                </p>
              )}
              {!isAnonymousClient(invoice) && invoice.clientCompany && <p className="truncate text-xs text-ink-3">{invoice.clientCompany}</p>}
              {!isAnonymousClient(invoice) && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-3 sm:justify-end">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{invoice.clientEmail}</span>
                </p>
              )}
            </div>
          </div>
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

      {isOwner && invoice.payoutMethod === 'BRE_B' && invoice.status !== 'SETTLED_FIAT' && (
        <ReceiverOffRamp
          invoice={invoice}
          onUpdated={() => {
            if (id && publicKey) getOwnerInvoice(id, publicKey).then(setInvoice).catch(() => {});
          }}
        />
      )}

      {invoice.status === 'PAID' && invoice.transactionHash && (
        <div className="card p-5 bg-success-subtle border-success-border">
          <h4 className="text-xs font-semibold text-success uppercase tracking-wider mb-3">{copy.paymentConfirmed}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-success">{copy.transactionHash}</span>
              <a
                href={`https://stellar.expert/explorer/${invoice.networkPassphrase?.includes('Test') ? 'testnet' : 'public'}/tx/${invoice.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-stellar-600 hover:underline break-all"
              >
                {invoice.transactionHash.slice(0, 16)}...
              </a>
            </div>
            {invoice.paidAt && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-success">{copy.paidAt}</span>
                <span className="text-success">
                  {new Date(invoice.paidAt).toLocaleString(LOCALE_BY_LANGUAGE[language])}
                </span>
              </div>
            )}
            {invoice.payerWallet && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-success">{copy.payer}</span>
                <a
                  href={stellarExpertUrl('account', invoice.payerWallet, invoice.networkPassphrase)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-stellar-600 hover:underline"
                >
                  {invoice.payerWallet.slice(0, 8)}...{invoice.payerWallet.slice(-4)}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
          {invoice.status === 'DRAFT' && (
            <>
              <button onClick={handleSend} disabled={actionLoading} className="btn-primary w-full text-sm sm:w-auto">
                {copy.sendInvoice}
              </button>
              <button onClick={handleDelete} disabled={actionLoading} className="btn-danger w-full text-sm sm:w-auto">
                {copy.delete}
              </button>
            </>
          )}
          <button onClick={handleDownloadPdf} disabled={pdfLoading} className="btn-secondary w-full text-sm sm:w-auto">
            {pdfLoading ? copy.generatingPdf : copy.downloadPdf}
          </button>
          {!['DRAFT', 'PAID', 'SETTLING', 'SETTLED_FIAT', 'CANCELLED', 'EXPIRED', 'FAILED'].includes(invoice.status) && (
            <button onClick={handleCancel} disabled={actionLoading} className="btn-danger w-full text-sm sm:w-auto">
              {copy.cancelLink}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
