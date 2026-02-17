import { PrismaClient } from '@prisma/client';
import { stellarService } from './stellarService';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * WatcherService monitors the Stellar network for incoming payments
 * and matches them to pending invoices using transaction memos.
 */
export class WatcherService {
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;

  /**
   * Start the payment watcher (polling mode)
   */
  async start() {
    if (this.isRunning) {
      console.log('[Watcher] Already running');
      return;
    }

    this.isRunning = true;
    console.log(
      `[Watcher] Started. Polling every ${config.watcherPollInterval}ms`
    );

    // Initial check
    await this.checkPendingInvoices();

    // Set up polling interval
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkPendingInvoices();
      } catch (error) {
        console.error('[Watcher] Poll error:', error);
      }
    }, config.watcherPollInterval);
  }

  /**
   * Stop the watcher
   */
  stop() {
    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('[Watcher] Stopped');
  }

  /**
   * Check all pending/processing invoices for on-chain payments
   */
  async checkPendingInvoices() {
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        freelancerWallet: true,
        total: true,
        currency: true,
      },
    });

    if (pendingInvoices.length === 0) return;

    // Group by freelancer wallet to minimize API calls
    const walletInvoices = new Map<string, typeof pendingInvoices>();
    for (const invoice of pendingInvoices) {
      const existing = walletInvoices.get(invoice.freelancerWallet) || [];
      existing.push(invoice);
      walletInvoices.set(invoice.freelancerWallet, existing);
    }

    for (const [wallet, invoices] of walletInvoices) {
      try {
        await this.checkWalletPayments(wallet, invoices);
      } catch (error) {
        console.error(
          `[Watcher] Error checking wallet ${wallet.substring(0, 8)}...:`,
          error
        );
      }
    }
  }

  /**
   * Check recent payments to a specific wallet and match with invoices
   */
  private async checkWalletPayments(
    walletAddress: string,
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      total: any;
      currency: string;
    }>
  ) {
    const transactions = await stellarService.getTransactionHistory(
      walletAddress,
      20
    );

    for (const tx of transactions) {
      if (!tx.successful) continue;

      // Check if memo matches any invoice ID or invoice number
      const memo = tx.memo;
      if (!memo) continue;

      const matchingInvoice = invoices.find(
        (inv) => inv.id === memo || inv.invoiceNumber === memo
      );

      if (!matchingInvoice) continue;

      // Check if we already recorded this payment
      const existingPayment = await prisma.payment.findUnique({
        where: { transactionHash: tx.hash },
      });

      if (existingPayment) continue;

      // Verify the transaction details
      const txDetails = await stellarService.verifyTransaction(tx.hash);
      if (!txDetails || !txDetails.successful) continue;

      // Find the matching payment operation
      const matchingPayment = txDetails.payments.find(
        (p: any) =>
          p.to === walletAddress &&
          p.assetCode === matchingInvoice.currency &&
          parseFloat(p.amount) >= parseFloat(matchingInvoice.total.toString())
      );

      if (!matchingPayment) continue;

      // Mark invoice as paid
      try {
        await prisma.$transaction(async (tx) => {
          await tx.invoice.update({
            where: { id: matchingInvoice.id },
            data: {
              status: 'PAID',
              transactionHash: txDetails.hash,
              ledgerNumber: txDetails.ledger,
              payerWallet: matchingPayment.from,
              clientWallet: matchingPayment.from,
              paidAt: new Date(txDetails.createdAt),
            },
          });

          await tx.payment.create({
            data: {
              invoiceId: matchingInvoice.id,
              transactionHash: txDetails.hash,
              ledgerNumber: txDetails.ledger,
              fromWallet: matchingPayment.from,
              toWallet: walletAddress,
              amount: matchingPayment.amount,
              asset: matchingPayment.assetCode,
            },
          });
        });

        console.log(
          `[Watcher] Invoice ${matchingInvoice.invoiceNumber} marked PAID. TX: ${txDetails.hash}`
        );
      } catch (error) {
        console.error(
          `[Watcher] Failed to update invoice ${matchingInvoice.id}:`,
          error
        );
      }
    }
  }
}

export const watcherService = new WatcherService();
