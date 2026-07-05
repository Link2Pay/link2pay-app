import { InvoiceStatus, InvoiceType, Prisma } from '@prisma/client';
import { CreateInvoiceInput, InvoicePublicView } from '../types';
import { generateInvoiceNumber } from '../utils/generators';
import { config } from '../config';
import prisma from '../db';
import { offRampService } from './offRampService';
import { emailService } from '../email/emailService';
import { log } from '../utils/logger';

const HERO_PREVIEW_REFERENCE_LINE = 'Reference: __hero_preview_v1__';

export class InvoiceService {
  /**
   * Create a new invoice with line items
   */
  async createInvoice(input: CreateInvoiceInput) {
    const invoiceNumber = generateInvoiceNumber();

    // Calculate line item amounts. Open-amount invoices carry no line items —
    // the payer sets the amount at pay time, so subtotal/total start at 0.
    const lineItems = (input.lineItems ?? []).map((item) => ({
      description: item.description,
      quantity: new Prisma.Decimal(item.quantity),
      rate: new Prisma.Decimal(item.rate),
      amount: new Prisma.Decimal(item.quantity * item.rate),
    }));

    // Calculate totals
    const subtotal = lineItems.reduce(
      (sum, item) => sum.plus(item.amount),
      new Prisma.Decimal(0)
    );

    const taxRate = input.taxRate ? new Prisma.Decimal(input.taxRate) : null;
    const taxAmount = taxRate
      ? subtotal.times(taxRate).dividedBy(100)
      : new Prisma.Decimal(0);

    const discount = input.discount
      ? new Prisma.Decimal(input.discount)
      : new Prisma.Decimal(0);

    const total = subtotal.plus(taxAmount).minus(discount);

    // Bre-B invoices above the anchor's available liquidity cannot settle —
    // reject at creation instead of stranding the payer later. Open-amount
    // invoices (total 0 here) are checked at quote time instead.
    if (input.payoutMethod === 'BRE_B' && total.greaterThan(0)) {
      const liquidity = await offRampService.checkLiquidity(total.toString());
      if (!liquidity.ok) {
        throw new Error('FIAT_LIQUIDITY_INSUFFICIENT');
      }
      // Mirror the anchor's payout floor (5,000 COP) — a below-minimum
      // invoice is a guaranteed dead end for the payer at quote time.
      const minimum = await offRampService.checkMinimum(total.toString());
      if (!minimum.ok) {
        throw new Error('FIAT_AMOUNT_BELOW_MINIMUM');
      }
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          freelancerWallet: input.freelancerWallet,
          freelancerName: input.freelancerName,
          freelancerEmail: input.freelancerEmail,
          freelancerCompany: input.freelancerCompany,
          freelancerTaxId: input.freelancerTaxId,
          freelancerAddress: input.freelancerAddress,
          freelancerPhone: input.freelancerPhone,
          freelancerLogoUrl: input.freelancerLogoUrl,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          clientCompany: input.clientCompany,
          clientAddress: input.clientAddress,
          clientTaxId: input.clientTaxId,
          title: input.title,
          description: input.description,
          notes: input.notes,
          subtotal,
          taxRate,
          taxAmount,
          discount,
          total,
          currency: input.currency,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          networkPassphrase: input.networkPassphrase || config.stellar.networkPassphrase,
          payoutMethod: input.payoutMethod === 'BRE_B' ? 'BRE_B' : 'CRYPTO',
          payoutAlias: input.payoutMethod === 'BRE_B' ? input.payoutAlias : null,
          invoiceType: (input.invoiceType as InvoiceType) ?? 'DIRECT_PAYMENT',
          isOpenAmount: input.isOpenAmount ?? false,
          // Bre-B off-ramp invoices skip DRAFT so the receiver can request a quote immediately.
          status: input.payoutMethod === 'BRE_B' ? 'PENDING' : undefined,
          lineItems: {
            create: lineItems,
          },
        },
        include: { lineItems: true },
      });
      await tx.invoiceAuditLog.create({
        data: {
          invoiceId: created.id,
          action: 'CREATED',
          actorWallet: input.freelancerWallet,
        },
      });
      return created;
    });

    return invoice;
  }

  /**
   * Persist a payer-chosen amount onto an open-amount invoice.
   * Sets subtotal = total = amount and clears tax/discount so the downstream
   * payment + confirmation pipeline (which matches against invoice.total) works.
   */
  async setInvoiceAmount(id: string, amount: number | string) {
    const value = new Prisma.Decimal(amount);
    return prisma.invoice.update({
      where: { id },
      data: {
        subtotal: value,
        taxRate: null,
        taxAmount: new Prisma.Decimal(0),
        discount: new Prisma.Decimal(0),
        total: value,
      },
    });
  }

  /**
   * Get invoice by ID (full data for owner)
   */
  async getInvoice(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true, payments: true },
    });
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string) {
    return prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: { lineItems: true, payments: true },
    });
  }

  /**
   * Get public view of invoice (sanitized for payers)
   */
  async getPublicInvoice(id: string): Promise<InvoicePublicView | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!invoice) return null;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      freelancerName: invoice.freelancerName,
      freelancerEmail: invoice.freelancerEmail,
      freelancerCompany: invoice.freelancerCompany,
      freelancerTaxId: invoice.freelancerTaxId,
      freelancerAddress: invoice.freelancerAddress,
      freelancerPhone: invoice.freelancerPhone,
      freelancerLogoUrl: invoice.freelancerLogoUrl,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientCompany: invoice.clientCompany,
      clientAddress: invoice.clientAddress,
      clientTaxId: invoice.clientTaxId,
      title: invoice.title,
      description: invoice.description,
      notes: invoice.notes,
      subtotal: invoice.subtotal.toString(),
      taxRate: invoice.taxRate?.toString() ?? null,
      taxAmount: invoice.taxAmount?.toString() ?? null,
      discount: invoice.discount?.toString() ?? null,
      total: invoice.total.toString(),
      currency: invoice.currency,
      createdAt: invoice.createdAt.toISOString(),
      dueDate: invoice.dueDate?.toISOString() ?? null,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      transactionHash: invoice.transactionHash,
      networkPassphrase: invoice.networkPassphrase,
      payoutMethod: invoice.payoutMethod,
      payoutAlias: invoice.payoutAlias,
      anchorTxId: invoice.anchorTxId,
      quoteBuyAmount: invoice.quoteBuyAmount,
      receiptTxHash: invoice.receiptTxHash,
      invoiceType: invoice.invoiceType,
      isOpenAmount: invoice.isOpenAmount,
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        amount: item.amount.toString(),
      })),
    };
  }

  /**
   * List invoices for a freelancer wallet with optional pagination.
   * Excludes soft-deleted invoices.
   * Returns { invoices, total } so the frontend can display page info.
   */
  async listInvoices(
    freelancerWallet: string,
    status?: InvoiceStatus,
    limit = 50,
    offset = 0,
    excludePreview = false,
    networkPassphrase?: string,
    createdAfter?: string,
    createdBefore?: string
  ) {
    const where = {
      freelancerWallet,
      deletedAt: null, // exclude soft-deleted
      ...(status && { status }),
      ...(networkPassphrase && { networkPassphrase }),
      ...((createdAfter || createdBefore) && {
        createdAt: {
          ...(createdAfter && { gte: new Date(`${createdAfter}T00:00:00.000Z`) }),
          ...(createdBefore && { lte: new Date(`${createdBefore}T23:59:59.999Z`) }),
        },
      }),
      ...(excludePreview && {
        OR: [
          { notes: null },
          {
            NOT: {
              notes: {
                contains: HERO_PREVIEW_REFERENCE_LINE,
              },
            },
          },
        ],
      }),
    } satisfies Prisma.InvoiceWhereInput;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { lineItems: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: InvoiceStatus) {
    return prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Mark invoice as paid with blockchain reference.
   *
   * Uses SERIALIZABLE isolation to prevent the race condition where the
   * watcher and the /submit endpoint both try to mark the same invoice as
   * PAID simultaneously. The first writer wins; the second gets a
   * "Invoice already paid" error which callers should handle gracefully.
   */
  async markAsPaid(
    id: string,
    transactionHash: string,
    ledgerNumber: number,
    payerWallet: string,
    paidAmount?: string
  ) {
    const invoice = await prisma.$transaction(
      async (tx) => {
        // Re-read inside the transaction to get a fresh, locked view.
        const current = await tx.invoice.findUnique({ where: { id } });
        if (!current) throw new Error('Invoice not found');
        if (current.status === 'PAID') throw new Error('Invoice already paid');

        // Check idempotency: same transactionHash already recorded?
        const existing = await tx.payment.findUnique({
          where: { transactionHash },
        });
        if (existing) throw new Error('Invoice already paid');

        // Update invoice
        const invoice = await tx.invoice.update({
          where: { id },
          data: {
            status: 'PAID',
            transactionHash,
            ledgerNumber,
            payerWallet: payerWallet || current.payerWallet,
            clientWallet: payerWallet || current.clientWallet,
            paidAt: new Date(),
          },
          include: { lineItems: true },
        });

        // Create payment record — record the actual on-chain amount when known
        // (a payer may overpay), falling back to the invoice total.
        await tx.payment.create({
          data: {
            invoiceId: id,
            transactionHash,
            ledgerNumber,
            fromWallet: payerWallet || '',
            toWallet: invoice.freelancerWallet,
            amount: paidAmount ? new Prisma.Decimal(paidAmount) : invoice.total,
            asset: invoice.currency,
          },
        });

        // Audit log
        await tx.invoiceAuditLog.create({
          data: {
            invoiceId: id,
            action: 'PAID',
            actorWallet: payerWallet || 'unknown',
            changes: {
              status: { from: 'PROCESSING', to: 'PAID' },
              transactionHash: { from: null, to: transactionHash },
            },
          },
        });

        return invoice;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    // Merchant email copy — attached to the PAID *transition* (this method runs
    // exactly once per invoice thanks to the serializable already-paid check),
    // fire-and-forget: an email failure must never fail payment processing.
    void (async () => {
      try {
        const profile = await prisma.businessProfile.findUnique({
          where: { walletAddress: invoice.freelancerWallet },
          select: { email: true },
        });
        if (!profile?.email) {
          log.info('Invoice paid: merchant has no profile email, skipping copy', { invoiceId: invoice.id });
          return;
        }
        await emailService.sendInvoicePaidCopy(invoice, profile.email);
        log.info('Merchant invoice copy sent', { invoiceId: invoice.id });
      } catch (error) {
        log.error('Merchant invoice copy failed', {
          invoiceId: invoice.id,
          error: (error as Error)?.message,
        });
      }
    })();

    return invoice;
  }

  /**
   * Update invoice details (only for DRAFT status)
   */
  async updateInvoice(id: string, input: Partial<CreateInvoiceInput>) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'DRAFT') {
      throw new Error('Can only edit invoices in DRAFT status');
    }

    const updateData: any = {};
    if (input.clientName) updateData.clientName = input.clientName;
    if (input.clientEmail) updateData.clientEmail = input.clientEmail;
    if (input.clientCompany !== undefined) updateData.clientCompany = input.clientCompany;
    if (input.clientAddress !== undefined) updateData.clientAddress = input.clientAddress;
    if (input.title) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;

    // If line items changed, recalculate
    if (input.lineItems) {
      const lineItems = input.lineItems.map((item) => ({
        description: item.description,
        quantity: new Prisma.Decimal(item.quantity),
        rate: new Prisma.Decimal(item.rate),
        amount: new Prisma.Decimal(item.quantity * item.rate),
      }));

      const subtotal = lineItems.reduce(
        (sum, item) => sum.plus(item.amount),
        new Prisma.Decimal(0)
      );

      const taxRate = input.taxRate !== undefined
        ? (input.taxRate ? new Prisma.Decimal(input.taxRate) : null)
        : invoice.taxRate;

      const taxAmount = taxRate
        ? subtotal.times(taxRate).dividedBy(100)
        : new Prisma.Decimal(0);

      const discount = input.discount !== undefined
        ? new Prisma.Decimal(input.discount || 0)
        : invoice.discount || new Prisma.Decimal(0);

      const total = subtotal.plus(taxAmount).minus(discount);

      updateData.subtotal = subtotal;
      updateData.taxRate = taxRate;
      updateData.taxAmount = taxAmount;
      updateData.discount = discount;
      updateData.total = total;

      // Delete old line items and create new ones atomically — a failure between
      // the two would otherwise leave the invoice with no line items.
      return prisma.$transaction(async (tx) => {
        await tx.lineItem.deleteMany({ where: { invoiceId: id } });
        return tx.invoice.update({
          where: { id },
          data: {
            ...updateData,
            lineItems: { create: lineItems },
          },
          include: { lineItems: true },
        });
      });
    }

    return prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { lineItems: true },
    });
  }

  /**
   * Soft-delete invoice (only for DRAFT status).
   * Sets deletedAt instead of removing the row, preserving the audit trail.
   */
  async deleteInvoice(id: string, freelancerWallet: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.freelancerWallet !== freelancerWallet) {
      throw new Error('Unauthorized');
    }
    if (invoice.status !== 'DRAFT') {
      throw new Error('Can only delete invoices in DRAFT status');
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.invoice.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.invoiceAuditLog.create({
        data: {
          invoiceId: id,
          action: 'DELETED',
          actorWallet: freelancerWallet,
        },
      });
      return deleted;
    });
  }

  /**
   * Write an audit log entry for an invoice action.
   */
  async addAuditLog(
    invoiceId: string,
    action: 'CREATED' | 'UPDATED' | 'SENT' | 'PAID' | 'OFFRAMP_INITIATED' | 'OFFRAMP_AWAITING_PAYMENT' | 'OFFRAMP_PROCESSING' | 'OFFRAMP_SETTLED' | 'OFFRAMP_ERROR' | 'EXPIRED' | 'CANCELLED' | 'DELETED',
    actorWallet: string,
    changes?: Record<string, { from: unknown; to: unknown }>
  ) {
    return prisma.invoiceAuditLog.create({
      data: {
        invoiceId,
        action,
        actorWallet,
        changes: changes as Prisma.InputJsonValue | undefined,
      },
    });
  }

  /**
   * Get dashboard stats for a freelancer
   */
  async getDashboardStats(
    freelancerWallet: string,
    excludePreview = false,
    networkPassphrase?: string
  ) {
    const whereWithPreviewFilter = {
      freelancerWallet,
      deletedAt: null, // exclude soft-deleted, matching the list query
      ...(networkPassphrase && { networkPassphrase }),
      ...(excludePreview && {
        OR: [
          { notes: null },
          {
            NOT: {
              notes: {
                contains: HERO_PREVIEW_REFERENCE_LINE,
              },
            },
          },
        ],
      }),
    } satisfies Prisma.InvoiceWhereInput;

    const [totalInvoices, paidInvoices, pendingInvoices, allInvoices] =
      await Promise.all([
        prisma.invoice.count({ where: whereWithPreviewFilter }),
        prisma.invoice.count({
          where: { ...whereWithPreviewFilter, status: 'PAID' },
        }),
        prisma.invoice.count({
          where: { ...whereWithPreviewFilter, status: 'PENDING' },
        }),
        prisma.invoice.findMany({
          where: whereWithPreviewFilter,
          select: { total: true, status: true, currency: true },
        }),
      ]);

    const totalRevenue = allInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);

    const pendingAmount = allInvoices
      .filter((inv) => inv.status === 'PENDING')
      .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalRevenue: totalRevenue.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
    };
  }
}

export const invoiceService = new InvoiceService();
