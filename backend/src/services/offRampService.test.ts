import { beforeEach, describe, expect, it, vi } from 'vitest';

const transaction = vi.hoisted(() => ({
  invoice: { update: vi.fn() },
  payment: { create: vi.fn() },
  invoiceAuditLog: { create: vi.fn() },
}));

const prisma = vi.hoisted(() => ({
  invoice: { findUnique: vi.fn() },
  $transaction: vi.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
}));

vi.mock('../db', () => ({ default: prisma }));
vi.mock('../anchors/adapters/TestAnchorAdapter', () => ({ testAnchorAdapter: { id: 'testnet' } }));
vi.mock('../anchors/adapters/MockBreBAdapter', () => ({ mockBreBAdapter: { id: 'mock-breb' } }));
vi.mock('../anchors/adapters/AbroadAdapter', () => ({ abroadAdapter: { id: 'abroad' } }));
vi.mock('./receiptService', () => ({ receiptService: { enabled: false } }));

import { OffRampService } from './offRampService';

describe('OffRampService.markAnchorPayment', () => {
  const service = new OffRampService();

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.invoice.findUnique.mockResolvedValue({
      status: 'AWAITING_PAYMENT',
      total: '12.50',
      currency: 'USDC',
    });
  });

  it('persists the verified Stellar ledger and anchor destination', async () => {
    await service.markAnchorPayment('invoice-id', 'tx-hash', 12345, 'payer-wallet', 'anchor-wallet');

    expect(transaction.invoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice-id' },
      data: {
        status: 'PROCESSING',
        transactionHash: 'tx-hash',
        ledgerNumber: 12345,
        payerWallet: 'payer-wallet',
        clientWallet: 'payer-wallet',
      },
    });
    expect(transaction.payment.create).toHaveBeenCalledWith({
      data: {
        invoiceId: 'invoice-id',
        transactionHash: 'tx-hash',
        ledgerNumber: 12345,
        fromWallet: 'payer-wallet',
        toWallet: 'anchor-wallet',
        amount: '12.50',
        asset: 'USDC',
      },
    });
  });

  it('rejects a firm quote for an amount different from the invoice total', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      freelancerWallet: 'merchant-wallet',
      payoutMethod: 'BRE_B',
      status: 'PENDING',
      total: '12.50',
    });

    await expect(
      service.getQuote('invoice-id', 'merchant-wallet', {
        sellAmount: '10.00',
        payoutAlias: '@nequi-3001234567',
      })
    ).rejects.toThrow('Cannot quote an amount different from the invoice total');
  });
});
