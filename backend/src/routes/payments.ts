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

const router = Router();

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
      const { senderPublicKey } = req.body;

      // Get invoice
      const invoice = await invoiceService.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Validate invoice can be paid
      if (!['PENDING', 'DRAFT'].includes(invoice.status)) {
        return res.status(400).json({
          error: `Invoice cannot be paid. Current status: ${invoice.status}`,
        });
      }

      // Prevent self-payment
      if (senderPublicKey === invoice.freelancerWallet) {
        return res.status(400).json({ error: 'Cannot pay your own invoice' });
      }

      const amount = formatStellarAmount(invoice.total.toString());
      const assetCode = invoice.currency;
      const assetIssuer = getAssetIssuer(assetCode);

      // Build the unsigned transaction
      const { transactionXdr, networkPassphrase } =
        await stellarService.buildPaymentTransaction({
          senderPublicKey,
          recipientPublicKey: invoice.freelancerWallet,
          amount,
          assetCode,
          invoiceId: invoice.invoiceNumber, // Use invoice number as memo
        });

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
        destination: invoice.freelancerWallet,
        amount,
        asset: {
          code: assetCode,
          issuer: assetIssuer || null,
        },
        memo: invoice.invoiceNumber,
        networkPassphrase,
        timeout: 300,
      });
    } catch (error: any) {
      console.error('Pay intent error:', error);

      if (error.message === 'ACCOUNT_NOT_FOUND') {
        return res.status(400).json({
          error: 'Sender account not found on the Stellar network',
        });
      }

      res.status(500).json({ error: error.message });
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

      // Submit to Stellar
      const result = await stellarService.submitTransaction(
        signedTransactionXdr
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
      console.error('Submit payment error:', error);
      res.status(500).json({ error: error.message });
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
        return res.json({ status: 'already_paid', invoice });
      }

      // Verify on-chain
      const txDetails = await stellarService.verifyTransaction(transactionHash);
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
        invoice: updated,
      });
    } catch (error: any) {
      console.error('Confirm payment error:', error);
      res.status(500).json({ error: error.message });
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
