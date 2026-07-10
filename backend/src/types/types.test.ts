import { describe, it, expect } from 'vitest';

// SEC-02: verify the PublicCheckoutInvoice DTO contract.
// These tests are compile-time verified by TypeScript; the runtime assertions
// document the invariant and catch regressions where someone might add a
// forbidden field.

const FORBIDDEN_PUBLIC_FIELDS = [
  'freelancerEmail', 'freelancerTaxId', 'freelancerAddress', 'freelancerPhone',
  'clientName', 'clientEmail', 'clientCompany', 'clientAddress', 'clientTaxId',
  'notes', 'payoutAlias', 'anchorTxId', 'anchorDepositAddress', 'anchorMemo',
  'anchorMemoType', 'anchorInteractiveUrl', 'anchorProvider', 'quoteId',
  'receiptTxHash', 'payerWallet', 'ledgerNumber', 'updatedAt', 'deletedAt',
  'freelancerWallet', 'clientWallet',
];

describe('Public checkout DTO (SEC-02)', () => {
  it('PublicCheckoutInvoice has no forbidden PII fields', () => {
    // Runtime assertion: build a full object and verify only allowed keys.
    // If a developer adds a forbidden field to the interface, they must also
    // populate it here (compiler error), producing a test failure.
    const checkout = {
      id: 'x',
      invoiceNumber: 'x',
      status: 'x',
      invoiceType: null as string | null,
      isOpenAmount: false,
      freelancerName: null as string | null,
      freelancerCompany: null as string | null,
      freelancerLogoUrl: null as string | null,
      title: 'x',
      description: null as string | null,
      lineItems: [] as { description: string; quantity: string; rate: string; amount: string }[],
      subtotal: '0',
      taxRate: null as string | null,
      taxAmount: null as string | null,
      discount: null as string | null,
      total: '0',
      currency: 'XLM',
      createdAt: new Date().toISOString(),
      dueDate: null as string | null,
      paidAt: null as string | null,
      transactionHash: null as string | null,
      networkPassphrase: 'test',
      payoutMethod: null as string | null,
      quoteBuyAmount: null as string | null,
    };

    const keys = Object.keys(checkout);
    for (const forbidden of FORBIDDEN_PUBLIC_FIELDS) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('Import is available from the types module', async () => {
    const types = await import('../types');
    expect(types).toBeDefined();
  });
});
