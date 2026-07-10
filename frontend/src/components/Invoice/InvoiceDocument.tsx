import type { PublicCheckoutInvoice } from '../../types';
import { useI18n } from '../../i18n/I18nProvider';

interface Props {
  invoice: PublicCheckoutInvoice;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatQuantity(value: string) {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return value;
  return parsed % 1 === 0 ? String(parseInt(value, 10)) : parsed.toFixed(2);
}

export default function InvoiceDocument({ invoice }: Props) {
  const { t } = useI18n();
  const isService = invoice.invoiceType === 'SERVICE_INVOICE';
  const qtyLabel = isService ? t('payment.doc.hrs') : t('payment.doc.qty');
  const rateLabel = isService ? t('payment.doc.ratePerHr') : t('payment.doc.unit');

  return (
    <div className="text-sm">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 border-b border-surface-3 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {invoice.freelancerLogoUrl && (
            <img
              src={invoice.freelancerLogoUrl}
              alt=""
              className="h-11 w-11 flex-shrink-0 rounded-lg object-contain bg-surface-1"
            />
          )}
          <div className="min-w-0">
            {invoice.freelancerCompany && (
              <p className="break-words text-base font-bold leading-tight text-ink-0">{invoice.freelancerCompany}</p>
            )}
            {invoice.freelancerName && (
              <p className={`break-words text-sm ${!invoice.freelancerCompany ? 'font-semibold text-ink-0' : 'text-ink-2'}`}>
                {invoice.freelancerName}
              </p>
            )}
            {!invoice.freelancerName && !invoice.freelancerCompany && (
              <p className="text-sm text-ink-3">{invoice.invoiceNumber}</p>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xl font-black uppercase tracking-widest text-ink-0">{t('payment.doc.invoice')}</p>
          <p className="mt-0.5 break-all text-xs font-mono text-ink-3 sm:break-normal">{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Bill From / Bill To */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-surface-1 p-3">
          <p className="mb-1.5 text-3xs font-medium uppercase tracking-wider text-ink-3">{t('payment.from')}</p>
          {invoice.freelancerCompany && (
            <p className="break-words text-sm font-semibold text-ink-0">{invoice.freelancerCompany}</p>
          )}
          {invoice.freelancerName && (
            <p className="break-words text-xs text-ink-2">{invoice.freelancerName}</p>
          )}
          {/* Neutral placeholder so the box is never blank when the merchant
              hasn't filled in a business profile. */}
          {!invoice.freelancerCompany && !invoice.freelancerName && (
            <p className="text-xs text-ink-2">{t('payment.freelancer')}</p>
          )}
        </div>
        <div className="rounded-lg bg-surface-1 p-3">
          <p className="mb-1.5 text-3xs font-medium uppercase tracking-wider text-ink-3">{t('payment.doc.billTo')}</p>
          <p className="break-words text-sm font-semibold text-ink-0">{t('payment.doc.invoice')}</p>
        </div>
      </div>

      {/* Dates + Currency */}
      <div className="mb-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="uppercase tracking-wider text-ink-3 mb-1 font-medium">{t('payment.doc.issueDate')}</p>
          <p className="font-medium text-ink-0">{formatDate(invoice.createdAt)}</p>
        </div>
        {invoice.dueDate && (
          <div>
            <p className="uppercase tracking-wider text-ink-3 mb-1 font-medium">{t('payment.doc.dueDate')}</p>
            <p className="font-medium text-ink-0">{formatDate(invoice.dueDate)}</p>
          </div>
        )}
        <div>
          <p className="uppercase tracking-wider text-ink-3 mb-1 font-medium">{t('payment.doc.currency')}</p>
          <p className="font-medium text-ink-0">{invoice.currency}</p>
        </div>
      </div>

      {/* Title / Description */}
      {invoice.title && (
        <div className="mb-4">
          <p className="font-semibold text-ink-0">{invoice.title}</p>
          {invoice.description && (
            <p className="text-xs text-ink-3 mt-1">{invoice.description}</p>
          )}
        </div>
      )}

      {/* Line items — mobile cards */}
      <div className="mb-5">
        <div className="space-y-3 sm:hidden">
          {invoice.lineItems.map((item, i) => (
            <div key={i} className="rounded-xl border border-surface-3 bg-surface-1 p-3">
              <p className="mb-3 text-sm font-semibold text-ink-0 break-words">{item.description}</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="mb-1 text-3xs font-medium uppercase tracking-wider text-ink-3">{qtyLabel}</p>
                  <p className="font-mono text-ink-2">{formatQuantity(item.quantity)}</p>
                </div>
                <div>
                  <p className="mb-1 text-3xs font-medium uppercase tracking-wider text-ink-3">{rateLabel}</p>
                  <p className="font-mono text-ink-2">{parseFloat(item.rate).toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-surface-3 pt-3">
                <span className="text-3xs font-medium uppercase tracking-wider text-ink-3">{t('payment.doc.amount')}</span>
                <span className="font-mono text-sm font-semibold text-ink-0">{parseFloat(item.amount).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-xs">
              <thead>
                <tr className="border-b border-surface-3">
                  <th className="w-[50%] pb-2 text-left text-3xs font-medium uppercase tracking-wider text-ink-3">{t('payment.doc.description')}</th>
                  <th className="pb-2 text-right text-3xs font-medium uppercase tracking-wider text-ink-3">{qtyLabel}</th>
                  <th className="pb-2 text-right text-3xs font-medium uppercase tracking-wider text-ink-3">{rateLabel}</th>
                  <th className="pb-2 text-right text-3xs font-medium uppercase tracking-wider text-ink-3">{t('payment.doc.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, i) => (
                  <tr key={i} className="border-b border-surface-2">
                    <td className="break-words py-2.5 pr-3 text-ink-1">{item.description}</td>
                    <td className="py-2.5 text-right font-mono text-ink-2">{formatQuantity(item.quantity)}</td>
                    <td className="py-2.5 text-right font-mono text-ink-2">{parseFloat(item.rate).toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono font-medium text-ink-0">{parseFloat(item.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="w-full text-xs space-y-1.5 sm:ml-auto sm:max-w-[260px]">
        <div className="flex justify-between text-ink-3">
          <span>{t('payment.subtotal')}</span>
          <span className="font-mono [font-variant-numeric:tabular-nums]">{parseFloat(invoice.subtotal).toFixed(2)}</span>
        </div>
        {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
          <div className="flex justify-between text-ink-3">
            <span>
              {invoice.taxRate && parseFloat(invoice.taxRate) > 0
                ? t('payment.tax', { rate: String(parseFloat(invoice.taxRate)) })
                : t('payment.doc.taxLabel')}
            </span>
            <span className="font-mono [font-variant-numeric:tabular-nums]">{parseFloat(invoice.taxAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-surface-3 text-sm font-semibold text-ink-0">
          <span>{t('payment.totalDue')}</span>
          <span className="font-display font-extrabold [font-variant-numeric:tabular-nums]">{parseFloat(invoice.total).toFixed(2)} {invoice.currency}</span>
        </div>
      </div>

    </div>
  );
}
