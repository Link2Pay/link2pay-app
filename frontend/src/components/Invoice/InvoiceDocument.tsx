import type { PublicInvoice } from '../../types';

interface Props {
  invoice: PublicInvoice;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InvoiceDocument({ invoice }: Props) {
  const isService = invoice.invoiceType === 'SERVICE_INVOICE';
  const qtyLabel = isService ? 'Hrs' : 'Qty';
  const rateLabel = isService ? 'Rate/hr' : 'Unit';

  return (
    <div className="text-sm">
      {/* Header */}
      <div className="flex items-start justify-between pb-5 border-b border-surface-3 mb-5">
        <div>
          {invoice.freelancerCompany && (
            <p className="text-base font-bold text-ink-0 leading-tight">{invoice.freelancerCompany}</p>
          )}
          {invoice.freelancerName && (
            <p className={`text-sm ${!invoice.freelancerCompany ? 'font-semibold text-ink-0' : 'text-ink-2'}`}>
              {invoice.freelancerName}
            </p>
          )}
          {!invoice.freelancerName && !invoice.freelancerCompany && (
            <p className="text-sm text-ink-3">{invoice.invoiceNumber}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xl font-black uppercase tracking-widest text-ink-0">Invoice</p>
          <p className="text-xs font-mono text-ink-3 mt-0.5">{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Bill From / Bill To */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg bg-surface-1 p-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1.5 font-medium">From</p>
          {invoice.freelancerCompany && (
            <p className="font-semibold text-ink-0 text-sm">{invoice.freelancerCompany}</p>
          )}
          {invoice.freelancerName && (
            <p className="text-xs text-ink-2">{invoice.freelancerName}</p>
          )}
        </div>
        <div className="rounded-lg bg-surface-1 p-3">
          <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1.5 font-medium">Bill To</p>
          <p className="font-semibold text-ink-0 text-sm">{invoice.clientName}</p>
          {invoice.clientCompany && (
            <p className="text-xs text-ink-2">{invoice.clientCompany}</p>
          )}
        </div>
      </div>

      {/* Dates + Currency */}
      <div className="grid grid-cols-3 gap-3 mb-5 text-xs">
        <div>
          <p className="uppercase tracking-wider text-ink-3 mb-1 font-medium">Issue Date</p>
          <p className="font-medium text-ink-0">{formatDate(invoice.createdAt)}</p>
        </div>
        {invoice.dueDate && (
          <div>
            <p className="uppercase tracking-wider text-ink-3 mb-1 font-medium">Due Date</p>
            <p className="font-medium text-ink-0">{formatDate(invoice.dueDate)}</p>
          </div>
        )}
        <div>
          <p className="uppercase tracking-wider text-ink-3 mb-1 font-medium">Currency</p>
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

      {/* Line Items Table */}
      <div className="mb-5">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-3">
              <th className="text-left pb-2 text-[10px] uppercase tracking-wider text-ink-3 font-medium w-[50%]">Description</th>
              <th className="text-right pb-2 text-[10px] uppercase tracking-wider text-ink-3 font-medium">{qtyLabel}</th>
              <th className="text-right pb-2 text-[10px] uppercase tracking-wider text-ink-3 font-medium">{rateLabel}</th>
              <th className="text-right pb-2 text-[10px] uppercase tracking-wider text-ink-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr key={i} className="border-b border-surface-2">
                <td className="py-2.5 text-ink-1 pr-3">{item.description}</td>
                <td className="py-2.5 text-right font-mono text-ink-2">
                  {parseFloat(item.quantity) % 1 === 0
                    ? parseInt(item.quantity)
                    : parseFloat(item.quantity).toFixed(2)}
                </td>
                <td className="py-2.5 text-right font-mono text-ink-2">{parseFloat(item.rate).toFixed(2)}</td>
                <td className="py-2.5 text-right font-mono font-medium text-ink-0">{parseFloat(item.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="ml-auto max-w-[220px] text-xs space-y-1.5">
        <div className="flex justify-between text-ink-3">
          <span>Subtotal</span>
          <span className="font-mono">{parseFloat(invoice.subtotal).toFixed(2)}</span>
        </div>
        {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
          <div className="flex justify-between text-ink-3">
            <span>
              Tax
              {invoice.taxRate && parseFloat(invoice.taxRate) > 0
                ? ` (${parseFloat(invoice.taxRate)}%)`
                : ''}
            </span>
            <span className="font-mono">{parseFloat(invoice.taxAmount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-surface-3 text-sm font-semibold text-ink-0">
          <span>Total Due</span>
          <span className="font-mono">{parseFloat(invoice.total).toFixed(2)} {invoice.currency}</span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-5 pt-4 border-t border-surface-2">
          <p className="text-[10px] uppercase tracking-wider text-ink-3 mb-1 font-medium">Notes</p>
          <p className="text-xs text-ink-2 leading-relaxed">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
