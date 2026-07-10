import { Prisma } from '@prisma/client';

type InvoiceWithLineItems = Prisma.InvoiceGetPayload<{ include: { lineItems: true } }>;

const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const amount = (v: unknown): string => String(v ?? '0');

// Older quick links used the .local sentinel; new links use the same .io
// sentinel as the frontend. Paid notices show the payer wallet for either.
const ANONYMOUS_PAYER_EMAILS = new Set(['payer@link2pay.io', 'payer@link2pay.local']);

const payerLabel = (inv: InvoiceWithLineItems): string => {
  if (inv.clientName !== 'Payer' || !ANONYMOUS_PAYER_EMAILS.has(inv.clientEmail ?? '')) {
    return inv.clientName;
  }
  const wallet = inv.payerWallet || inv.clientWallet;
  return wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : 'A payer';
};

export function invoicePaidSubject(invoice: InvoiceWithLineItems): string {
  return `Invoice ${invoice.invoiceNumber} paid — ${amount(invoice.total)} ${invoice.currency}`;
}

export function invoicePaidHtml(invoice: InvoiceWithLineItems, dashboardUrl: string): string {
  const rows = invoice.lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${esc(item.description)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${esc(amount(item.quantity))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${esc(amount(item.amount))} ${esc(invoice.currency)}</td>
        </tr>`
    )
    .join('');

  const paidAt = invoice.paidAt ? new Date(invoice.paidAt).toUTCString() : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f4f4f6;font-family:Helvetica,Arial,sans-serif;color:#1a1a2e;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#4F51B8;padding:20px 24px;">
          <span style="color:#ffffff;font-size:18px;font-weight:bold;letter-spacing:1px;">LINK2PAY</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">
          <h1 style="margin:0 0 4px;font-size:18px;">Invoice ${esc(invoice.invoiceNumber)} was paid</h1>
          <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">
            ${esc(payerLabel(invoice))} paid <strong>${esc(amount(invoice.total))} ${esc(invoice.currency)}</strong>${paidAt ? ` on ${esc(paidAt)}` : ''}.
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;">
            <tr>
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #4F51B8;">Item</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #4F51B8;">Qty</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #4F51B8;">Amount</th>
            </tr>
            ${rows}
            <tr>
              <td></td>
              <td style="padding:10px 12px;text-align:right;font-weight:bold;">Total</td>
              <td style="padding:10px 12px;text-align:right;font-weight:bold;">${esc(amount(invoice.total))} ${esc(invoice.currency)}</td>
            </tr>
          </table>

          ${invoice.transactionHash ? `
          <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">
            Transaction: <span style="font-family:monospace;">${esc(invoice.transactionHash)}</span>
          </p>` : ''}

          <p style="margin:20px 0 0;">
            <a href="${esc(dashboardUrl)}" style="display:inline-block;background:#4F51B8;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:bold;">
              View in dashboard
            </a>
          </p>

          <p style="margin:20px 0 0;font-size:11px;color:#9ca3af;">
            The invoice PDF is attached. You are receiving this because a payment link you created on Link2Pay was paid.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
