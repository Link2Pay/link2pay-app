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
  offrampOpenAmountSchema,
  offrampSubmitPaymentSchema,
} from '../middleware/validation';
import { config, assetMatches } from '../config';
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

// The open-amount set-amount endpoint is public (payer-driven, no auth), so key
// its limit by IP. Bounds griefing where anyone with the link locks an invoice
// into an attacker-chosen amount.
const setAmountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  keyGenerator: (req) => req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many amount submissions, please try again later' },
});

// Public estimate reads are cheap (60s service-side cache) but still anchor-
// backed — key by IP like the other payer-facing endpoint.
const estimateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many estimate requests, please try again later' },
});

/**
 * GET /api/invoices/:id/offramp/estimate
 * Display-only "receiver gets ≈ X COP" for the public payment page.
 * Public — reveals nothing the page doesn't already show.
 */
router.get('/:id/offramp/estimate', estimateLimiter, async (req: Request, res: Response) => {
  try {
    const estimate = await offRampService.getPublicEstimate(req.params.id);
    res.json(estimate);
  } catch (error: any) {
    const status = error.message === 'Invoice not found' ? 404
      : error.message === 'Invoice is not a Bre-B off-ramp' ? 400
      : 500;
    res.status(status).json({ error: error.message });
  }
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
 * POST /api/invoices/:id/offramp/set-amount
 * Payer-driven amount for an OPEN-AMOUNT Bre-B invoice: persists the total,
 * quotes, and initiates so the pay flow can proceed. Public — the service
 * gates it to open-amount BRE_B invoices in PENDING.
 */
router.post(
  '/:id/offramp/set-amount',
  setAmountLimiter,
  validateBody(offrampOpenAmountSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await offRampService.prepareOpenAmountOffRamp(
        req.params.id,
        req.body.sellAmount
      );
      res.json(result);
    } catch (error: any) {
      const msg = error?.message || 'Failed to set amount';
      if (msg === 'FIAT_AMOUNT_BELOW_MINIMUM') {
        return res.status(422).json({
          error: 'FIAT_AMOUNT_BELOW_MINIMUM',
          message:
            'This amount is below the Bre-B payout minimum (5,000 COP, about 1.6 USDC). Enter a larger amount.',
        });
      }
      const status = msg === 'Invoice not found'
        ? 404
        : /open-amount|Bre-B|already set|greater than zero|payout alias/i.test(msg)
          ? 400
          : 500;
      log.error('[OfframpRoutes] Set-amount error', { error: msg });
      res.status(status).json({ error: msg });
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

    const { senderPublicKey, networkPassphrase, sourceAsset } = req.body;

    // Deposit instructions are captured and persisted at initiate time —
    // no re-initiation needed. If they're missing, the interactive SEP-24
    // step (e.g. KYC) hasn't produced them yet.
    if (!invoice.anchorDepositAddress) {
      return res.status(400).json({
        error: 'Deposit address not available yet. Complete the anchor interactive step first.',
      });
    }

    const memoType = (invoice.anchorMemoType as 'text' | 'id' | 'hash' | null) || undefined;

    // Phase 5: pay in a non-USDC asset via path payment (the anchor still
    // receives the exact USDC amount). Falls through to a direct payment when
    // disabled or when sourceAsset matches the invoice asset.
    const wantsPath =
      config.pathPayments.enabled && sourceAsset && sourceAsset !== invoice.currency;

    if (wantsPath) {
      try {
        const pathResult = await stellarService.buildPathPaymentTransaction({
          senderPublicKey,
          recipientPublicKey: invoice.anchorDepositAddress,
          sendAssetCode: sourceAsset,
          destAssetCode: invoice.currency,
          destAmount: invoice.total.toString(),
          memo: invoice.anchorMemo || undefined,
          memoType,
          invoiceId: invoice.id,
          slippageBps: config.pathPayments.slippageBps,
          networkPassphrase,
        });
        return res.json({
          ...pathResult,
          memo: invoice.anchorMemo,
          depositAddress: invoice.anchorDepositAddress,
          asset: invoice.currency,
          amount: invoice.total.toString(),
        });
      } catch (e: any) {
        // No route (thin liquidity) — tell the client to fall back to USDC.
        if (e?.message === 'NO_PATH_FOUND') {
          return res.status(409).json({ error: 'NO_PATH_FOUND' });
        }
        throw e;
      }
    }

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
    res.status(500).json({ error: 'Internal server error' });
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

      const { signedTransactionXdr } = req.body;

      if (!invoice.anchorDepositAddress) {
        return res.status(400).json({ error: 'Invoice has no anchor deposit address' });
      }

      // Submit the transaction
      const submitResult = await stellarService.submitTransaction(
        signedTransactionXdr,
        invoice.networkPassphrase
      );

      // Re-verify on-chain that this payment actually reaches the anchor before
      // advancing the invoice — mirrors the crypto /submit hardening. Without
      // this, any successfully-submitted signed tx (paying anyone) would mark
      // the off-ramp PROCESSING.
      const txDetails = await stellarService.verifyTransaction(
        submitResult.hash,
        invoice.networkPassphrase
      );
      const anchorPayment = txDetails?.payments.find(
        (p: any) =>
          p.to === invoice.anchorDepositAddress &&
          assetMatches(p, invoice.currency, invoice.networkPassphrase) &&
          parseFloat(p.amount) >= parseFloat(invoice.total.toString())
      );
      if (!txDetails?.successful || !anchorPayment) {
        return res.status(400).json({
          error: 'Submitted transaction does not pay the anchor deposit address for this invoice',
          transactionHash: submitResult.hash,
        });
      }
      // The anchor credits the payout by memo; a wrong/absent memo would orphan
      // the funds at the anchor, so reject before we mark it PROCESSING.
      if (invoice.anchorMemo && String(txDetails.memo ?? '') !== String(invoice.anchorMemo)) {
        return res.status(400).json({
          error: 'Payment memo does not match the anchor memo for this invoice',
          transactionHash: submitResult.hash,
        });
      }

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
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/invoices/:id/offramp/path-quote
 * Preview a path payment: how much of `sourceAsset` the payer would send to
 * deliver the exact USDC the anchor requires. Public. Returns { found:false }
 * when no route exists (thin liquidity).
 */
router.post('/:id/offramp/path-quote', async (req: Request, res: Response) => {
  try {
    if (!config.pathPayments.enabled) {
      return res.status(404).json({ error: 'Path payments are disabled' });
    }
    const invoice = await invoiceService.getInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const { sourceAsset, networkPassphrase } = req.body;
    if (!sourceAsset) return res.status(400).json({ error: 'sourceAsset is required' });
    if (sourceAsset === invoice.currency) {
      return res.status(400).json({ error: 'sourceAsset matches the invoice asset' });
    }

    const quote = await stellarService.quoteStrictReceivePath({
      sendAssetCode: sourceAsset,
      destAssetCode: invoice.currency,
      destAmount: invoice.total.toString(),
      slippageBps: config.pathPayments.slippageBps,
      networkPassphrase,
    });

    res.json(quote);
  } catch (error: any) {
    log.error('[OfframpRoutes] Path quote error', { error: error?.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
