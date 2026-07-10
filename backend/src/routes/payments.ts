import { Router, Request, Response } from 'express';
import { invoiceService } from '../services/invoiceService';
import { stellarService } from '../services/stellarService';
import { verifyInvoicePayment } from '../services/paymentVerifier';
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
import { hasActivateNewAccountsFlag } from '../utils/paymentLinks';
import prisma from '../db';

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
      const { senderPublicKey, networkPassphrase, amount: payerAmount } = req.body;

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

      // Open-amount invoices: the payer supplies the amount. Persist it so the
      // confirmation/matching pipeline (which compares against invoice.total)
      // and receipts reflect what was actually charged.
      let effectiveTotal = invoice.total.toString();
      if (invoice.isOpenAmount) {
        if (!payerAmount || payerAmount <= 0) {
          return res.status(400).json({
            error: 'This payment link requires you to enter an amount',
          });
        }
        const updated = await invoiceService.setInvoiceAmount(invoiceId, payerAmount);
        effectiveTotal = updated.total.toString();
      }

      const amount = formatStellarAmount(effectiveTotal);
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
        const activateNewAccounts = hasActivateNewAccountsFlag(invoice.notes);
        const built = await stellarService.buildPaymentTransaction({
          senderPublicKey,
          recipientPublicKey: invoice.freelancerWallet,
          amount,
          assetCode,
          invoiceId: invoice.invoiceNumber, // Use invoice number as memo
          networkPassphrase, // Pass the client's network passphrase
          activateNewAccounts,
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
        networkPassphrase: invoice.networkPassphrase,
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

      // Submit to Stellar with network validation
      const result = await stellarService.submitTransaction(
        signedTransactionXdr,
        invoice.networkPassphrase
      );

      if (result.successful) {
        // Horizon accepting the transaction only proves it's validly signed —
        // not that it pays *this* invoice.  Use the centralized verifier
        // (SEC-03) which enforces memo, asset, amount, time, and uniqueness.
        const txDetails = await stellarService.verifyTransaction(
          result.hash,
          invoice.networkPassphrase
        );

        if (!txDetails) {
          return res.status(400).json({ error: 'Transaction not found on network' });
        }

        // Check uniqueness before verification so we reject duplicate tx, not
        // "check failed".
        const alreadyPaid = !!(await prisma.payment.findUnique({
          where: { transactionHash: result.hash },
        }));
        if (alreadyPaid) {
          return res.json({ success: true, alreadyPaid: true });
        }

        const canonicalIssuer = getAssetIssuer(invoice.currency, invoice.networkPassphrase);
        const verification = verifyInvoicePayment(
          {
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            freelancerWallet: invoice.freelancerWallet,
            networkPassphrase: invoice.networkPassphrase,
            total: invoice.total.toString(),
            currency: invoice.currency,
            createdAt: invoice.createdAt,
          },
          txDetails,
          canonicalIssuer,
          alreadyPaid
        );

        if ('status' in verification) {
          return res.status(verification.status).json({ error: verification.message, transactionHash: result.hash });
        }

        // Mark as paid with the verified payment details
        await invoiceService.markAsPaid(
          invoiceId,
          result.hash,
          result.ledger,
          verification.payment.from,
          verification.payment.amount
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

      // Verify on-chain (centralized verifier — SEC-03)
      const txDetails = await stellarService.verifyTransaction(
        transactionHash,
        invoice.networkPassphrase
      );
      if (!txDetails) {
        return res.status(404).json({ error: 'Transaction not found on network' });
      }

      // Check uniqueness
      const existing = await prisma.payment.findUnique({
        where: { transactionHash },
      });

      const canonicalIssuer = getAssetIssuer(invoice.currency, invoice.networkPassphrase);
      const verification = verifyInvoicePayment(
        {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          freelancerWallet: invoice.freelancerWallet,
          networkPassphrase: invoice.networkPassphrase,
          total: invoice.total.toString(),
          currency: invoice.currency,
          createdAt: invoice.createdAt,
        },
        txDetails,
        canonicalIssuer,
        !!existing
      );

      if ('status' in verification) {
        return res.status(verification.status).json({ error: verification.message });
      }

      // Mark as paid with the verified payment
      await invoiceService.markAsPaid(
        invoiceId,
        transactionHash,
        txDetails.ledger,
        verification.payment.from,
        verification.payment.amount
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
 * Check payment status for an invoice (public — never exposes payerWallet).
 */
router.get('/:invoiceId/status', async (req: Request, res: Response) => {
  try {
    const invoice = await invoiceService.getPublicCheckout(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      invoiceId: invoice.id,
      status: invoice.status,
      transactionHash: invoice.transactionHash,
      ledgerNumber: null,
      paidAt: invoice.paidAt,
    });
  } catch (error: any) {
    log.error('Payment status error', {
      invoiceId: req.params.invoiceId,
      error: error?.message,
    });
    res.status(500).json({ error: 'Failed to fetch payment status' });
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
    log.error('Verify transaction error', { error: error?.message });
    res.status(500).json({ error: 'Failed to verify transaction' });
  }
});

export default router;
