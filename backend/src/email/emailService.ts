import { Prisma } from '@prisma/client';
import { config } from '../config';
import { EmailProvider } from './types';
import { MockEmailProvider } from './providers/MockEmailProvider';
import { ResendEmailProvider } from './providers/ResendEmailProvider';
import { renderInvoicePdf } from './invoicePdf';
import { invoicePaidHtml, invoicePaidSubject } from './templates';

type InvoiceWithLineItems = Prisma.InvoiceGetPayload<{ include: { lineItems: true } }>;

function resolveProvider(): EmailProvider {
  if (config.email.provider === 'resend') {
    return new ResendEmailProvider(config.email.resendApiKey as string, config.email.from);
  }
  return new MockEmailProvider();
}

class EmailService {
  private readonly provider = resolveProvider();

  async sendInvoicePaidCopy(invoice: InvoiceWithLineItems, merchantEmail: string): Promise<void> {
    const pdf = await renderInvoicePdf(invoice);
    const origin = config.frontendUrl.split(',')[0].trim().replace(/\/$/, '');
    await this.provider.send({
      to: merchantEmail,
      subject: invoicePaidSubject(invoice),
      html: invoicePaidHtml(invoice, `${origin}/dashboard/links/${invoice.id}`),
      attachments: [{ filename: `invoice-${invoice.invoiceNumber}.pdf`, content: pdf }],
    });
  }
}

export const emailService = new EmailService();
