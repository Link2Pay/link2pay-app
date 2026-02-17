import { Router, Request, Response } from 'express';
import { invoiceService } from '../services/invoiceService';
import {
  validateBody,
  requireWallet,
  createInvoiceSchema,
} from '../middleware/validation';
import { InvoiceStatus } from '@prisma/client';

const router = Router();

/**
 * POST /api/invoices
 * Create a new invoice (requires wallet auth)
 */
router.post(
  '/',
  requireWallet,
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

    const invoices = await invoiceService.listInvoices(walletAddress, status);
    res.json(invoices);
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

    const updated = await invoiceService.updateStatus(
      req.params.id,
      'PENDING'
    );
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
