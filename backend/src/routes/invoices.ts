import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { invoiceService } from '../services/invoiceService';
import { clientService } from '../services/clientService';
import {
  validateBody,
  requireWallet,
  createInvoiceSchema,
} from '../middleware/validation';
import { InvoiceStatus } from '@prisma/client';

const router = Router();

/**
 * Per-wallet invoice creation rate limiter — DoS.2 mitigation.
 * Limits each authenticated wallet to 20 invoice creations per hour.
 * Keyed on wallet address so each user has an independent quota.
 */
const createInvoiceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req) => (req as any).walletAddress || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Invoice creation limit reached. Maximum 20 invoices per hour per wallet.' },
});

/**
 * POST /api/invoices
 * Create a new invoice (requires wallet auth)
 */
router.post(
  '/',
  requireWallet,
  createInvoiceLimiter,
  validateBody(createInvoiceSchema),
  async (req: Request, res: Response) => {
    try {
      const walletAddress = (req as any).walletAddress;

      // Ensure the freelancer wallet matches the authenticated wallet
      if (req.body.freelancerWallet !== walletAddress) {
        return res.status(403).json({
          error: 'Freelancer wallet must match authenticated wallet',
        });
      }

      const invoice = await invoiceService.createInvoice(req.body);

      // Auto-save client if requested
      if (req.body.saveClient) {
        try {
          await clientService.upsertClient(walletAddress, {
            name: req.body.clientName,
            email: req.body.clientEmail,
            company: req.body.clientCompany,
            address: req.body.clientAddress,
            isFavorite: req.body.favoriteClient ?? false,
          });
        } catch (clientErr) {
          console.error('Failed to auto-save client:', clientErr);
          // Non-fatal — invoice was already created
        }
      }

      res.status(201).json(invoice);
    } catch (error: any) {
      console.error('Create invoice error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/invoices
 * List invoices for the authenticated wallet
 */
router.get('/', requireWallet, async (req: Request, res: Response) => {
  try {
    const walletAddress = (req as any).walletAddress;
    const status = req.query.status as InvoiceStatus | undefined;
    const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
    const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);

    const result = await invoiceService.listInvoices(walletAddress, status, limit, offset);
    res.json(result);
  } catch (error: any) {
    console.error('List invoices error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/invoices/stats
 * Get dashboard statistics for the authenticated wallet
 */
router.get('/stats', requireWallet, async (req: Request, res: Response) => {
  try {
    const walletAddress = (req as any).walletAddress;
    const stats = await invoiceService.getDashboardStats(walletAddress);
    res.json(stats);
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/invoices/:id/owner
 * Get full invoice details for the owner (requires wallet auth)
 */
router.get('/:id/owner', requireWallet, async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoice.freelancerWallet !== (req as any).walletAddress) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(invoice);
  } catch (error: any) {
    console.error('Get owner invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/invoices/:id
 * Get invoice details (public endpoint for payment page)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getPublicInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error: any) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/invoices/:id
 * Update invoice (DRAFT only, requires wallet auth)
 */
router.patch('/:id', requireWallet, async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
    res.json(invoice);
  } catch (error: any) {
    if (error.message.includes('DRAFT')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Invoice not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Update invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/invoices/:id/send
 * Mark invoice as PENDING (sent to client)
 */
router.post('/:id/send', requireWallet, async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoice.freelancerWallet !== (req as any).walletAddress) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Invoice must be in DRAFT status' });
    }

    const updated = await invoiceService.updateStatus(req.params.id, 'PENDING');
    // Fire-and-forget audit log — non-fatal
    invoiceService
      .addAuditLog(req.params.id, 'SENT', (req as any).walletAddress, {
        status: { from: 'DRAFT', to: 'PENDING' },
      })
      .catch(() => {});
    res.json(updated);
  } catch (error: any) {
    console.error('Send invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/invoices/:id
 * Delete invoice (DRAFT only, requires wallet auth)
 */
router.delete('/:id', requireWallet, async (req: Request, res: Response) => {
  try {
    const walletAddress = (req as any).walletAddress;
    await invoiceService.deleteInvoice(req.params.id, walletAddress);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('DRAFT')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
