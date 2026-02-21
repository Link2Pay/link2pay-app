import { Router, Request, Response } from 'express';
import { config } from '../config';
import { invoiceService } from '../services/invoiceService';
import {
  createPaymentLinkSchema,
  requireWallet,
  validateBody,
} from '../middleware/validation';
import { log } from '../utils/logger';

type LinkStatus =
  | 'CREATED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'FAILED'
  | 'CANCELLED';

function mapInvoiceStatusToLinkStatus(status: string): LinkStatus {
  switch (status) {
    case 'DRAFT':
      return 'CREATED';
    case 'PENDING':
    case 'PROCESSING':
      return 'PENDING';
    case 'PAID':
      return 'CONFIRMED';
    case 'EXPIRED':
      return 'EXPIRED';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

function getCheckoutUrl(linkId: string): string {
  return `${config.frontendUrl.replace(/\/+$/, '')}/pay/${linkId}`;
}

function extractReference(notes?: string | null): string | null {
  if (!notes) return null;
  const prefix = 'Reference: ';
  return notes.startsWith(prefix) ? notes.slice(prefix.length) : null;
}

const router = Router();

/**
 * POST /api/links
 * Create a payment link (payment intent) and return hosted checkout URL.
 */
router.post(
  '/',
  requireWallet,
  validateBody(createPaymentLinkSchema),
  async (req: Request, res: Response) => {
    try {
      const walletAddress = (req as any).walletAddress as string;
      const { amount, asset, recipientWallet, expiresAt, metadata } = req.body;

      const targetWallet = recipientWallet ?? walletAddress;
      if (targetWallet !== walletAddress) {
        return res.status(403).json({
          error: 'Recipient wallet must match authenticated wallet in this version',
        });
      }

      const expirationDate = expiresAt
        ? new Date(expiresAt)
        : new Date(Date.now() + 15 * 60 * 1000);

      if (Number.isNaN(expirationDate.getTime())) {
        return res.status(400).json({ error: 'Invalid expiresAt date' });
      }
      if (expirationDate.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'expiresAt must be in the future' });
      }

      const title = metadata?.title?.trim() || 'Payment Link';
      const description = metadata?.description?.trim() || undefined;
      const reference = metadata?.reference?.trim();
      const payerName = metadata?.payerName?.trim() || 'Payer';
      const payerEmail = metadata?.payerEmail?.trim() || 'payer@link2pay.local';

      const created = await invoiceService.createInvoice({
        freelancerWallet: targetWallet,
        clientName: payerName,
        clientEmail: payerEmail,
        title,
        description,
        notes: reference ? `Reference: ${reference}` : undefined,
        currency: asset,
        dueDate: expirationDate.toISOString(),
        lineItems: [
          {
            description: title,
            quantity: 1,
            rate: amount,
          },
        ],
      });

      await invoiceService.updateStatus(created.id, 'PENDING');
      invoiceService
        .addAuditLog(created.id, 'SENT', walletAddress, {
          status: { from: 'DRAFT', to: 'PENDING' },
        })
        .catch(() => {});

      res.status(201).json({
        id: created.id,
        status: 'PENDING' as LinkStatus,
        checkoutUrl: getCheckoutUrl(created.id),
        amount: created.total.toString(),
        asset: created.currency,
        createdAt: created.createdAt.toISOString(),
        expiresAt: created.dueDate?.toISOString() || expirationDate.toISOString(),
        metadata: {
          title: created.title,
          description: created.description,
          reference: extractReference(created.notes),
          payerName: created.clientName,
          payerEmail: created.clientEmail,
        },
        legacyInvoiceId: created.id,
        legacyInvoiceNumber: created.invoiceNumber,
      });
    } catch (error: any) {
      log.error('Create payment link error', { error: error?.message });
      res.status(500).json({ error: error?.message || 'Failed to create payment link' });
    }
  }
);

/**
 * GET /api/links/:id/status
 * Lightweight status endpoint for polling.
 */
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({
      id: invoice.id,
      status: mapInvoiceStatusToLinkStatus(invoice.status),
      transactionHash: invoice.transactionHash,
      confirmedAt: invoice.paidAt?.toISOString() || null,
      expiresAt: invoice.dueDate?.toISOString() || null,
    });
  } catch (error: any) {
    log.error('Get payment link status error', {
      linkId: req.params.id,
      error: error?.message,
    });
    res.status(500).json({ error: 'Failed to fetch link status' });
  }
});

/**
 * GET /api/links/:id
 * Fetch link details + current status.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getPublicInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({
      id: invoice.id,
      status: mapInvoiceStatusToLinkStatus(invoice.status),
      checkoutUrl: getCheckoutUrl(invoice.id),
      amount: invoice.total,
      asset: invoice.currency,
      createdAt: invoice.createdAt,
      expiresAt: invoice.dueDate,
      metadata: {
        title: invoice.title,
        description: invoice.description,
        reference: extractReference(invoice.notes),
        payerName: invoice.clientName,
        payerEmail: null,
      },
      transactionHash: invoice.transactionHash,
      confirmedAt: invoice.paidAt,
      legacyInvoiceId: invoice.id,
      legacyInvoiceNumber: invoice.invoiceNumber,
    });
  } catch (error: any) {
    log.error('Get payment link error', {
      linkId: req.params.id,
      error: error?.message,
    });
    res.status(500).json({ error: 'Failed to fetch link' });
  }
});

export default router;
