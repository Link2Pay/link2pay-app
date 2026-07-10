import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  invoice: {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock('../db', () => ({ default: prisma }));
vi.mock('./offRampService', () => ({ offRampService: {} }));
vi.mock('../email/emailService', () => ({ emailService: {} }));

import { InvoiceService } from './invoiceService';

describe('InvoiceService active invoice lookups', () => {
  const service = new InvoiceService();

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.invoice.findFirst.mockResolvedValue(null);
  });

  it('does not return soft-deleted invoices to owners', async () => {
    await expect(service.getInvoice('invoice-id')).resolves.toBeNull();

    expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
      where: { id: 'invoice-id', deletedAt: null },
      include: { lineItems: true, payments: true },
    });
  });

  it('does not return soft-deleted invoices to public checkout', async () => {
    await expect(service.getPublicInvoice('invoice-id')).resolves.toBeNull();

    expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
      where: { id: 'invoice-id', deletedAt: null },
      include: { lineItems: true },
    });
  });
});

// SEC-04: open-amount claimOpenAmount must be atomic — amount + status
// transition in a single conditional updateMany.
describe('claimOpenAmount atomicity (SEC-04)', () => {
  const service = new InvoiceService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('atomically sets amount AND status to PROCESSING in one updateMany', async () => {
    prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      total: '100',
      status: 'PROCESSING',
      isOpenAmount: true,
    } as any);

    const result = await service.claimOpenAmount('inv-1', 100);

    expect(result).not.toBeNull();
    // The updateMany must include status: 'PROCESSING' in the data
    const call = prisma.invoice.updateMany.mock.calls[0][0] as any;
    expect(call.where).toEqual({ id: 'inv-1', status: 'PENDING', isOpenAmount: true });
    expect(call.data.status).toBe('PROCESSING');
    expect(call.data.total.toString()).toBe('100');
    expect(call.data.subtotal.toString()).toBe('100');
    expect(call.data.taxRate).toBeNull();
  });

  it('returns null when updateMany affects zero rows (already claimed)', async () => {
    prisma.invoice.updateMany.mockResolvedValue({ count: 0 });

    const result = await service.claimOpenAmount('inv-1', 100);

    expect(result).toBeNull();
  });

  it('clears tax and discount on claim', async () => {
    prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      total: '75',
      status: 'PROCESSING',
      isOpenAmount: true,
    } as any);

    await service.claimOpenAmount('inv-1', 75);

    const call = prisma.invoice.updateMany.mock.calls[0][0] as any;
    expect(call.data.taxRate).toBeNull();
    expect(call.data.taxAmount?.toString()).toBe('0');
    expect(call.data.discount?.toString()).toBe('0');
  });

  // Concurrency test: two simultaneous calls with different amounts result
  // in exactly one successful claim and one rejected claim. This simulates
  // the race by having updateMany return count:1 for the first call and
  // count:0 for the second (which is what PostgreSQL does with a conditional
  // updateMany — the second sees the row already in PROCESSING).
  it('two concurrent calls result in exactly one winner and one null', async () => {
    let callCount = 0;
    prisma.invoice.updateMany.mockImplementation(async () => {
      callCount++;
      // First call wins (row is PENDING), second call loses (row is now PROCESSING)
      return { count: callCount === 1 ? 1 : 0 };
    });
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      total: '50',
      status: 'PROCESSING',
      isOpenAmount: true,
    } as any);

    // Fire both concurrently
    const [result1, result2] = await Promise.all([
      service.claimOpenAmount('inv-1', 50),
      service.claimOpenAmount('inv-1', 999),
    ]);

    // Exactly one winner
    const winners = [result1, result2].filter((r) => r !== null);
    expect(winners.length).toBe(1);
    expect(winners[0]!.total).toBe('50');

    // The loser gets null
    const losers = [result1, result2].filter((r) => r === null);
    expect(losers.length).toBe(1);
  });

  it('does not call a separate updateStatus after the claim', async () => {
    // Verify that claimOpenAmount does status transition itself — no
    // separate prisma.invoice.update call should be made (only updateMany
    // + findUnique).
    prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      total: '100',
      status: 'PROCESSING',
      isOpenAmount: true,
    } as any);

    await service.claimOpenAmount('inv-1', 100);

    // updateMany was called exactly once (not an additional update)
    expect(prisma.invoice.updateMany).toHaveBeenCalledTimes(1);
    // findUnique was called exactly once (re-read after claim)
    expect(prisma.invoice.findUnique).toHaveBeenCalledTimes(1);
  });
});
