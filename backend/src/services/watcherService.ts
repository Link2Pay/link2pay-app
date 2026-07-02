import { stellarService } from './stellarService';
import { config, assetMatches } from '../config';
import prisma from '../db';
import { log } from '../utils/logger';
import { offRampService } from './offRampService';
import { invoiceService } from './invoiceService';

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
      log.info('[Watcher] Already running');
      return;
    }

    this.isRunning = true;
    log.info('[Watcher] Started', { pollIntervalMs: config.watcherPollInterval });

    // Initial check
    await this.checkPendingInvoices();

    // Set up polling interval
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkPendingInvoices();
      } catch (error) {
        log.error('[Watcher] Poll error', { error: (error as Error)?.message });
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
    log.info('[Watcher] Stopped');
  }

  /**
   * Expire invoices whose dueDate has passed and are still awaiting payment.
   */
  private async expireOverdueInvoices() {
    const now = new Date();
    const result = await prisma.invoice.updateMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
        dueDate: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });
    if (result.count > 0) {
      log.info('[Watcher] Expired overdue invoices', { count: result.count });
    }
  }

  /**
   * Check all pending/processing/awaiting-payment invoices for on-chain payments
   */
  async checkPendingInvoices() {
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING', 'AWAITING_PAYMENT', 'SETTLING'] },
      },
      select: {
        id: true,
        invoiceNumber: true,
        freelancerWallet: true,
        networkPassphrase: true,
        total: true,
        currency: true,
        payoutMethod: true,
        anchorTxId: true,
        status: true,
      },
    });

    if (pendingInvoices.length === 0) return;

    // Handle BRE_B invoices by polling anchor status
    const brebInvoices = pendingInvoices.filter(
      (inv) => inv.payoutMethod === 'BRE_B'
    );
    for (const invoice of brebInvoices) {
      try {
        if (invoice.anchorTxId) {
          await offRampService.pollStatus(invoice.id);
        }
      } catch (error: any) {
        log.warn('[Watcher] BRE_B poll skipped', {
          invoiceId: invoice.id,
          error: error?.message,
        });
      }
    }

    // Handle crypto invoices via wallet monitoring
    const cryptoInvoices = pendingInvoices.filter(
      (inv) => inv.payoutMethod !== 'BRE_B'
    );

    // Group by wallet + network so we query the correct Horizon endpoint.
    const walletInvoices = new Map<string, typeof cryptoInvoices>();
    for (const invoice of cryptoInvoices) {
      const key = `${invoice.freelancerWallet}:${invoice.networkPassphrase}`;
      const existing = walletInvoices.get(key) || [];
      existing.push(invoice);
      walletInvoices.set(key, existing);
    }

    for (const [key, invoices] of walletInvoices) {
      try {
        const [walletAddress, networkPassphrase] = key.split(':');
        await this.checkWalletPayments(walletAddress, networkPassphrase, invoices);
      } catch (error: any) {
        log.error('[Watcher] Error checking wallet', {
          key,
          error: error?.message,
        });
      }
    }

    // Expire overdue invoices AFTER scanning for payments, so an invoice paid
    // right at its due moment is marked PAID rather than EXPIRED.
    await this.expireOverdueInvoices();
  }

  /**
   * Check recent payments to a specific wallet and match with invoices
   */
  private async checkWalletPayments(
    walletAddress: string,
    networkPassphrase: string,
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      total: any;
      currency: string;
      networkPassphrase: string;
    }>
  ) {
    const transactions = await stellarService.getTransactionHistory(
      walletAddress,
      20,
      networkPassphrase
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
      const txDetails = await stellarService.verifyTransaction(
        tx.hash,
        networkPassphrase
      );
      if (!txDetails || !txDetails.successful) continue;

      // Find the matching payment operation
      const matchingPayment = txDetails.payments.find(
        (p: any) =>
          p.to === walletAddress &&
          assetMatches(p, matchingInvoice.currency, matchingInvoice.networkPassphrase) &&
          parseFloat(p.amount) >= parseFloat(matchingInvoice.total.toString())
      );

      if (!matchingPayment) continue;

      // Mark invoice as paid through invoiceService.markAsPaid, which re-reads
      // status under SERIALIZABLE isolation and is idempotent by tx hash — this
      // is what prevents a double-mark when two same-memo txs land in one poll
      // window, or when /submit races the watcher.
      try {
        await invoiceService.markAsPaid(
          matchingInvoice.id,
          txDetails.hash,
          txDetails.ledger,
          matchingPayment.from,
          matchingPayment.amount
        );
        // Drop it from this cycle's working set so a second matching tx in the
        // same wallet history can't re-enter the mark path.
        invoices = invoices.filter((inv) => inv.id !== matchingInvoice.id);

        log.info('[Watcher] Invoice marked PAID', {
          invoiceNumber: matchingInvoice.invoiceNumber,
          txHash: txDetails.hash,
        });
      } catch (error: any) {
        // Already paid is expected if submit and watcher race — not an error.
        // Keep scanning the wallet's other transactions/invoices.
        if (error?.message === 'Invoice already paid') {
          invoices = invoices.filter((inv) => inv.id !== matchingInvoice.id);
          continue;
        }
        log.error('[Watcher] Failed to mark invoice as paid', {
          invoiceId: matchingInvoice.id,
          error: error?.message,
        });
      }
    }
  }
}

export const watcherService = new WatcherService();
