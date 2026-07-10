import { describe, it, expect } from 'vitest';
import { invoicePaidHtml, invoicePaidSubject } from './templates';

const invoice: Parameters<typeof invoicePaidHtml>[0] = {
  id: 'inv_1',
  invoiceNumber: 'INV-0001',
  clientName: 'ACME Corp',
  title: 'Website redesign',
  total: '150.50',
  currency: 'USDC',
  transactionHash: 'abc123def456',
  paidAt: new Date('2026-07-05T12:00:00Z'),
  lineItems: [
    { description: 'Design', quantity: '1', rate: '150.50', amount: '150.50' },
  ],
} as never;

describe('invoice paid email', () => {
  it('subject names the invoice and amount', () => {
    expect(invoicePaidSubject(invoice)).toBe('Invoice INV-0001 paid — 150.50 USDC');
  });

  it('html includes client, line items, tx hash and dashboard link', () => {
    const html = invoicePaidHtml(invoice, 'https://www.link2pay.xyz/dashboard/links/inv_1');
    expect(html).toContain('ACME Corp');
    expect(html).toContain('Design');
    expect(html).toContain('abc123def456');
    expect(html).toContain('https://www.link2pay.xyz/dashboard/links/inv_1');
    expect(html).not.toContain('undefined');
  });

  it('uses the payer wallet for legacy anonymous quick links', () => {
    const html = invoicePaidHtml(
      {
        ...invoice,
        clientName: 'Payer',
        clientEmail: 'payer@link2pay.local',
        payerWallet: 'GBUMVWB7KO2R25AJHZP6V3HI4PNQNBNNZIR4BJMPN2NUZZN5ER3IQMO3',
      },
      'https://www.link2pay.xyz/dashboard/links/inv_1'
    );

    expect(html).toContain('GBUMVW…QMO3');
  });
});
