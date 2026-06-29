import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { offRampService } from '../services/offRampService';
import { stellarService } from '../services/stellarService';
import { invoiceService } from '../services/invoiceService';
import {
  validateBody,
  requireWallet,
  offrampQuoteSchema,
  offrampInitiateSchema,
  offrampSubmitPaymentSchema,
} from '../middleware/validation';
import { log } from '../utils/logger';

const router = Router();

const offrampLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.walletAddress || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Off-ramp rate limit reached' },
});

/**
 * POST /api/invoices/:id/offramp/quote
 * Request a firm quote from the anchor. Sets AWAITING_ANCHOR.
 */
router.post(
  '/:id/offramp/quote',
  requireWallet,
  offrampLimiter,
  validateBody(offrampQuoteSchema),
  async (req: Request, res: Response) => {
    try {
      const quote = await offRampService.getQuote(
        req.params.id,
        req.walletAddress as string,
        req.body
      );
      res.json(quote);
    } catch (error: any) {
      const status = error.message === 'Unauthorized' ? 403
        : error.message === 'Invoice not found' ? 404
        : error.message.startsWith('Cannot') || error.message.startsWith('Invoice is') ? 400
        : 500;
      log.error('[OfframpRoutes] Quote error', { error: error?.message });
      res.status(status).json({ error: error.message });
    }
  }
);

/**
 * POST /api/invoices/:id/offramp/initiate
 * Initiate SEP-24 withdraw. Sets AWAITING_PAYMENT.
 */
router.post(
  '/:id/offramp/initiate',
  requireWallet,
  offrampLimiter,
  validateBody(offrampInitiateSchema),
  async (req: Request, res: Response) => {
    try {
      const intent = await offRampService.initiateOffRamp(
        req.params.id,
        req.walletAddress as string,
        req.body
      );
      res.json(intent);
    } catch (error: any) {
      const status = error.message === 'Unauthorized' ? 403
        : error.message === 'Invoice not found' ? 404
        : error.message.includes('AWAITING_ANCHOR') ? 400
        : 500;
      log.error('[OfframpRoutes] Initiate error', { error: error?.message });
      res.status(status).json({ error: error.message });
    }
  }
);

/**
 * GET /api/invoices/:id/offramp/status
 * Poll anchor status. Public endpoint — no auth required.
 */
router.get('/:id/offramp/status', async (req: Request, res: Response) => {
  try {
    const result = await offRampService.pollStatus(req.params.id);
    res.json(result);
  } catch (error: any) {
    const status = error.message === 'Invoice not found' ? 404
      : error.message === 'No anchor transaction' ? 400
      : 500;
    log.error('[OfframpRoutes] Status error', { error: error?.message });
    res.status(status).json({ error: error.message });
  }
});

/**
 * POST /api/invoices/:id/offramp/pay-intent
 * Build a payment XDR that the payer signs to send USDC to the anchor
 * deposit address with the exact memo. Public endpoint.
 */
router.post('/:id/offramp/pay-intent', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoice.payoutMethod !== 'BRE_B') {
      return res.status(400).json({ error: 'Invoice does not have off-ramp payment' });
    }
    if (invoice.status !== 'AWAITING_PAYMENT') {
      return res.status(400).json({ error: 'Invoice not ready for payment' });
    }

    const { senderPublicKey, networkPassphrase } = req.body;

    // Deposit instructions are captured and persisted at initiate time —
    // no re-initiation needed. If they're missing, the interactive SEP-24
    // step (e.g. KYC) hasn't produced them yet.
    if (!invoice.anchorDepositAddress) {
      return res.status(400).json({
        error: 'Deposit address not available yet. Complete the anchor interactive step first.',
      });
    }

    const memoType = (invoice.anchorMemoType as 'text' | 'id' | 'hash' | null) || undefined;

    const txResult = await stellarService.buildPaymentTransaction({
      senderPublicKey,
      recipientPublicKey: invoice.anchorDepositAddress,
      amount: invoice.total.toString(),
      assetCode: invoice.currency,
      invoiceId: invoice.id,
      // The anchor matches the incoming payment by this exact memo + type.
      // Honor the anchor's memoType (testanchor uses `id`, not text).
      memo: invoice.anchorMemo || undefined,
      memoType,
      networkPassphrase,
    });

    res.json({
      ...txResult,
      memo: invoice.anchorMemo,
      depositAddress: invoice.anchorDepositAddress,
      asset: invoice.currency,
      amount: invoice.total.toString(),
    });
  } catch (error: any) {
    log.error('[OfframpRoutes] Pay intent error', { error: error?.message });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/invoices/:id/offramp/submit
 * Submit a signed off-ramp payment XDR to Stellar.
 * Validates that the payment goes to the anchor's deposit address
 * with the correct memo, then marks the invoice as PROCESSING.
 */
router.post(
  '/:id/offramp/submit',
  validateBody(offrampSubmitPaymentSchema),
  async (req: Request, res: Response) => {
    try {
      const invoice = await invoiceService.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      if (invoice.status !== 'AWAITING_PAYMENT') {
        return res.status(400).json({ error: 'Invoice not awaiting payment' });
      }

      const { signedTransactionXdr, depositAddress } = req.body;

      // Submit the transaction
      const submitResult = await stellarService.submitTransaction(
        signedTransactionXdr,
        invoice.networkPassphrase
      );

      // Mark as processing with the anchor payment
      await offRampService.markAnchorPayment(
        req.params.id,
        submitResult.hash,
        req.body.senderPublicKey || 'unknown'
      );

      res.json({
        success: true,
        transactionHash: submitResult.hash,
        ledger: submitResult.ledger,
      });
    } catch (error: any) {
      log.error('[OfframpRoutes] Submit error', { error: error?.message });
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
