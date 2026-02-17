import { PrismaClient, InvoiceStatus, Prisma } from '@prisma/client';
import { CreateInvoiceInput, InvoicePublicView } from '../types';
import { generateInvoiceNumber } from '../utils/generators';

const prisma = new PrismaClient();

export class InvoiceService {
  /**
   * Create a new invoice with line items
   */
  async createInvoice(input: CreateInvoiceInput) {
    const invoiceNumber = generateInvoiceNumber();

    // Calculate line item amounts
    const lineItems = input.lineItems.map((item) => ({
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

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        freelancerWallet: input.freelancerWallet,
        freelancerName: input.freelancerName,
        freelancerEmail: input.freelancerEmail,
        freelancerCompany: input.freelancerCompany,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientCompany: input.clientCompany,
        clientAddress: input.clientAddress,
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
        lineItems: {
          create: lineItems,
        },
      },
      include: { lineItems: true },
    });

    return invoice;
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
      freelancerWallet: invoice.freelancerWallet,
      freelancerName: invoice.freelancerName,
      freelancerCompany: invoice.freelancerCompany,
      clientName: invoice.clientName,
      clientCompany: invoice.clientCompany,
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
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        amount: item.amount.toString(),
      })),
    };
  }

  /**
   * List invoices for a freelancer wallet
   */
  async listInvoices(freelancerWallet: string, status?: InvoiceStatus) {
    return prisma.invoice.findMany({
      where: {
        freelancerWallet,
        ...(status && { status }),
      },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: InvoiceStatus) {
    return prisma.invoice.update({
      where: { id },
      data: {
        status,
        ...(status === 'PENDING' ? {} : {}),
      },
    });
  }

  /**
   * Mark invoice as paid with blockchain reference
   */
  async markAsPaid(
    id: string,
    transactionHash: string,
    ledgerNumber: number,
    payerWallet: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Update invoice
      const invoice = await tx.invoice.update({
        where: { id },
        data: {
          status: 'PAID',
          transactionHash,
          ledgerNumber,
          payerWallet,
          clientWallet: payerWallet,
          paidAt: new Date(),
        },
        include: { lineItems: true },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          invoiceId: id,
          transactionHash,
          ledgerNumber,
          fromWallet: payerWallet,
          toWallet: invoice.freelancerWallet,
          amount: invoice.total,
          asset: invoice.currency,
        },
      });

      return invoice;
    });
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

      // Delete old line items and create new ones
      await prisma.lineItem.deleteMany({ where: { invoiceId: id } });

      updateData.subtotal = subtotal;
      updateData.taxRate = taxRate;
      updateData.taxAmount = taxAmount;
      updateData.discount = discount;
      updateData.total = total;

      return prisma.invoice.update({
        where: { id },
        data: {
          ...updateData,
          lineItems: { create: lineItems },
        },
        include: { lineItems: true },
      });
    }

    return prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { lineItems: true },
    });
  }

  /**
   * Delete invoice (only for DRAFT status)
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

    return prisma.invoice.delete({ where: { id } });
  }

  /**
   * Get dashboard stats for a freelancer
   */
  async getDashboardStats(freelancerWallet: string) {
    const [totalInvoices, paidInvoices, pendingInvoices, allInvoices] =
      await Promise.all([
        prisma.invoice.count({ where: { freelancerWallet } }),
        prisma.invoice.count({
          where: { freelancerWallet, status: 'PAID' },
        }),
        prisma.invoice.count({
          where: { freelancerWallet, status: 'PENDING' },
        }),
        prisma.invoice.findMany({
          where: { freelancerWallet },
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
