import { beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = vi.hoisted(() => ({
  invoice: {
    findFirst: vi.fn(),
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
