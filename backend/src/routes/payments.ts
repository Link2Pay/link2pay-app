import { Router, Request, Response } from 'express';
import { invoiceService } from '../services/invoiceService';
import { stellarService } from '../services/stellarService';
import {
  validateBody,
  payIntentSchema,
  submitPaymentSchema,
  confirmPaymentSchema,
} from '../middleware/validation';
import { getAssetIssuer } from '../config';
import { formatStellarAmount } from '../utils/generators';
import { mapStellarError } from '../utils/stellarErrors';
import { log } from '../utils/logger';

const router = Router();

type StellarResultCodes = {
  transaction?: string;
  operations?: string[];
};

function parseResultCodesFromMessage(message: string): StellarResultCodes | null {
  const marker = 'Transaction failed:';
  const markerIndex = message.indexOf(marker);
  if (markerIndex === -1) return null;

  const payload = message.slice(markerIndex + marker.length).trim();
  if (!payload) return null;

  try {
    const parsed = JSON.parse(payload);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as StellarResultCodes;
  } catch {
    return null;
  }
}

function getResultCodes(error: any): StellarResultCodes | null {
  const message = typeof error?.message === 'string' ? error.message : '';
  const resultCodes =
    error?.resultCodes ??
    error?.response?.data?.extras?.result_codes ??
    parseResultCodesFromMessage(message);

  if (!resultCodes || typeof resultCodes !== 'object') return null;

  const hasTransaction = typeof resultCodes.transaction === 'string';
  const hasOperations = Array.isArray(resultCodes.operations) && resultCodes.operations.length > 0;
  if (!hasTransaction && !hasOperations) return null;

  return resultCodes as StellarResultCodes;
}

function resolveSubmitPaymentStatus(error: any): number {
  const explicitStatus = error?.httpStatus;
  if (typeof explicitStatus === 'number') {
    if (explicitStatus === 429 || explicitStatus === 503) return explicitStatus;
    if (explicitStatus >= 400 && explicitStatus < 500) return explicitStatus;
  }

  const responseStatus = error?.response?.status;
  if (typeof responseStatus === 'number') {
    if (responseStatus === 429 || responseStatus === 503) return responseStatus;
    if (responseStatus >= 400 && responseStatus < 500) return responseStatus;
  }

  const message = typeof error?.message === 'string' ? error.message : '';
  if (message.startsWith('Network mismatch:')) return 400;

  if (getResultCodes(error)) return 400;

  return 500;
}

/**
 * POST /api/payments/:invoiceId/pay-intent
 * Generate a payment transaction for the client to sign
 */
router.post(
  '/:invoiceId/pay-intent',
  validateBody(payIntentSchema),
  async (req: Request, res: Response) => {
    try {
      const { invoiceId } = req.params;
      const { senderPublicKey, networkPassphrase } = req.body;

      // Get invoice
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Validate invoice can be paid
      // PROCESSING is included to allow retries if signing/submission failed
      if (!['PENDING', 'DRAFT', 'PROCESSING'].includes(invoice.status)) {
        return res.status(400).json({
          error: `Invoice cannot be paid. Current status: ${invoice.status}`,
        });
      }

      // Prevent self-payment when sender is known (desktop extension flow).
      if (senderPublicKey && senderPublicKey === invoice.freelancerWallet) {
        return res.status(400).json({ error: 'Cannot pay your own invoice' });
      }

      const amount = formatStellarAmount(invoice.total.toString());
      const assetCode = invoice.currency;

      if (networkPassphrase !== invoice.networkPassphrase) {
        return res.status(400).json({
          error: 'Selected wallet network does not match the invoice network',
        });
      }

      // Desktop flow returns an unsigned XDR for extension signing.
      // Mobile app flow may skip senderPublicKey and use SEP-7 only.
      let transactionXdr: string | null = null;
      if (senderPublicKey) {
        const built = await stellarService.buildPaymentTransaction({
          senderPublicKey,
          recipientPublicKey: invoice.freelancerWallet,
          amount,
          assetCode,
          invoiceId: invoice.invoiceNumber, // Use invoice number as memo
          networkPassphrase, // Pass the client's network passphrase
        });
        transactionXdr = built.transactionXdr;
      }

      // Get asset issuer for the invoice network
      const assetIssuer = getAssetIssuer(assetCode, invoice.networkPassphrase);

      // Generate SEP-7 URI
      const sep7Uri = stellarService.generateSEP7Uri({
        destination: invoice.freelancerWallet,
        amount,
        assetCode,
        assetIssuer,
        memo: invoice.invoiceNumber,
      });

      // Update invoice status to PROCESSING
      await invoiceService.updateStatus(invoiceId, 'PROCESSING');

      res.json({
        invoiceId,
        transactionXdr,
        sep7Uri,
        amount,
        asset: {
          code: assetCode,
          issuer: assetIssuer || null,
        },
        memo: invoice.invoiceNumber,
        networkPassphrase: invoice.networkPassphrase,
        timeout: 300,
      });
    } catch (error: any) {
      log.error('Pay intent error', { invoiceId: req.params.invoiceId, error: error?.message });
      res.status(error.message?.includes('not found') ? 400 : 500).json({
        error: mapStellarError(error),
      });
    }
  }
);

/**
 * POST /api/payments/submit
 * Submit a signed transaction to the Stellar network
 */
router.post(
  '/submit',
  validateBody(submitPaymentSchema),
  async (req: Request, res: Response) => {
    try {
      const { invoiceId, signedTransactionXdr } = req.body;

      // Verify invoice exists
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      console.log('[/submit] Invoice network:', invoice.networkPassphrase);
      console.log('[/submit] Invoice ID:', invoiceId);

      // Submit to Stellar with network validation
      const result = await stellarService.submitTransaction(
        signedTransactionXdr,
        invoice.networkPassphrase
      );

      if (result.successful) {
        // Mark as paid
        await invoiceService.markAsPaid(
          invoiceId,
          result.hash,
          result.ledger,
          '' // Will be filled by watcher or verification
        );
      }

      res.json({
        success: result.successful,
        transactionHash: result.hash,
        ledger: result.ledger,
      });
    } catch (error: any) {
      // "already paid" is idempotent — not an error to surface
      if (error?.message === 'Invoice already paid') {
        return res.json({ success: true, alreadyPaid: true });
      }
      log.error('Submit payment error', { error: error?.message });
      const status = resolveSubmitPaymentStatus(error);
      res.status(status).json({ error: mapStellarError(error) });
    }
  }
);

/**
 * POST /api/payments/confirm
 * Manually confirm a payment by transaction hash
 * (alternative to watcher - client reports the hash)
 */
router.post(
  '/confirm',
  validateBody(confirmPaymentSchema),
  async (req: Request, res: Response) => {
    try {
      const { invoiceId, transactionHash } = req.body;

      // Get invoice
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      if (invoice.status === 'PAID') {
        return res.json({
          status: 'already_paid',
          transactionHash: invoice.transactionHash,
          paidAt: invoice.paidAt?.toISOString() || null,
        });
      }

      // Verify on-chain
      const txDetails = await stellarService.verifyTransaction(
        transactionHash,
        invoice.networkPassphrase
      );
      if (!txDetails) {
        return res.status(404).json({ error: 'Transaction not found on network' });
      }

      if (!txDetails.successful) {
        return res.status(400).json({ error: 'Transaction was not successful' });
      }

      // Verify payment details match
      const matchingPayment = txDetails.payments.find(
        (p: any) =>
          p.to === invoice.freelancerWallet &&
          p.assetCode === invoice.currency
      );

      if (!matchingPayment) {
        return res.status(400).json({
          error: 'Transaction does not match invoice payment details',
        });
      }

      const paidAmount = parseFloat(matchingPayment.amount);
      const expectedAmount = parseFloat(invoice.total.toString());

      if (paidAmount < expectedAmount) {
        return res.status(400).json({
          error: `Underpayment: paid ${paidAmount}, expected ${expectedAmount}`,
        });
      }

      // Mark as paid
      const updated = await invoiceService.markAsPaid(
        invoiceId,
        transactionHash,
        txDetails.ledger,
        matchingPayment.from
      );

      res.json({
        status: 'confirmed',
        transactionHash,
        ledger: txDetails.ledger,
        paidAt: txDetails.createdAt,
      });
    } catch (error: any) {
      log.error('Confirm payment error', { error: error?.message });
      res.status(500).json({ error: mapStellarError(error) });
    }
  }
);

/**
 * GET /api/payments/:invoiceId/status
 * Check payment status for an invoice
 */
router.get('/:invoiceId/status', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getInvoice(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      invoiceId: invoice.id,
      status: invoice.status,
      transactionHash: invoice.transactionHash,
      ledgerNumber: invoice.ledgerNumber,
      paidAt: invoice.paidAt?.toISOString() || null,
      payerWallet: invoice.payerWallet,
    });
  } catch (error: any) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/payments/verify-tx
 * Verify a transaction on the Stellar network
 */
router.post('/verify-tx', async (req: Request, res: Response) => {
  try {
    const { transactionHash } = req.body;
    if (!transactionHash) {
      return res.status(400).json({ error: 'transactionHash required' });
    }

    const details = await stellarService.verifyTransaction(transactionHash);
    if (!details) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(details);
  } catch (error: any) {
    console.error('Verify TX error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
