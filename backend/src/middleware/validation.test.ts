import { describe, expect, it } from 'vitest';
import { createInvoiceSchema } from './validation';

const WALLET = 'GBUMVWB7KO2R25AJHZP6V3HI4PNQNBNNZIR4BJMPN2NUZZN5ER3IQMO3';

const baseInvoice = {
  freelancerWallet: WALLET,
  clientName: 'Client',
  clientEmail: 'client@example.com',
  title: 'Invoice',
  lineItems: [{ description: 'Work', quantity: 1, rate: 10 }],
};

describe('createInvoiceSchema', () => {
  it('allows USDC invoices for Bre-B payouts', () => {
    expect(
      createInvoiceSchema.safeParse({
        ...baseInvoice,
        currency: 'USDC',
        payoutMethod: 'BRE_B',
        payoutAlias: '@nequi-3001234567',
      }).success
    ).toBe(true);
  });

  it('rejects non-USDC invoices for Bre-B payouts', () => {
    const result = createInvoiceSchema.safeParse({
      ...baseInvoice,
      currency: 'XLM',
      payoutMethod: 'BRE_B',
      payoutAlias: '@nequi-3001234567',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ['currency'],
            message: 'Bre-B payouts require USDC invoices',
          }),
        ])
      );
    }
  });

  it('continues to allow XLM invoices for crypto payouts', () => {
    expect(
      createInvoiceSchema.safeParse({
        ...baseInvoice,
        currency: 'XLM',
        payoutMethod: 'CRYPTO',
      }).success
    ).toBe(true);
  });
});
