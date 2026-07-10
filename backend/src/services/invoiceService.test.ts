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

// SEC-04: open-amount setInvoiceAmount must be atomic
describe('setInvoiceAmount atomicity (SEC-04)', () => {
  const service = new InvoiceService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when updateMany affects zero rows (already claimed)', async () => {
    prisma.invoice.updateMany.mockResolvedValue({ count: 0 });

    const result = await service.setInvoiceAmount('inv-1', 100);

    expect(result).toBeNull();
    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', status: 'PENDING', isOpenAmount: true },
      data: expect.objectContaining({
        total: expect.anything(),
      }),
    });
  });

  it('returns the invoice when updateMany affects one row', async () => {
    prisma.invoice.updateMany.mockResolvedValue({ count: 1 });
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'inv-1',
      total: '100',
      status: 'PENDING',
      isOpenAmount: true,
    } as any);

    const result = await service.setInvoiceAmount('inv-1', 100);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('inv-1');
  });

  it('only updates invoices where status is PENDING and isOpenAmount is true', async () => {
    prisma.invoice.updateMany.mockResolvedValue({ count: 0 });

    await service.setInvoiceAmount('inv-1', 50);

    const call = prisma.invoice.updateMany.mock.calls[0][0] as any;
    expect(call.where.status).toBe('PENDING');
    expect(call.where.isOpenAmount).toBe(true);
  });
});
