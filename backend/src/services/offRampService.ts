import { InvoiceStatus, Prisma } from '@prisma/client';
import { config } from '../config';
import { railById } from '../config/rails';
import { log } from '../utils/logger';
import prisma from '../db';
import type { AnchorAdapter, Quote, OffRampIntent, AnchorStatus } from '../anchors/AnchorAdapter';
import { testAnchorAdapter } from '../anchors/adapters/TestAnchorAdapter';
import { mockBreBAdapter } from '../anchors/adapters/MockBreBAdapter';
import { abroadAdapter } from '../anchors/adapters/AbroadAdapter';
import { receiptService } from './receiptService';

function getAdapter(): AnchorAdapter {
  switch (config.anchor.provider) {
    case 'mock-breb':
      return mockBreBAdapter;
    case 'abroad':
      return abroadAdapter;
    case 'testnet':
    default:
      return testAnchorAdapter;
  }
}

/**
 * Valid BRE_B state transitions (additive — crypto path untouched).
 */
const BRE_B_TRANSITIONS: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = {
  PENDING: ['AWAITING_ANCHOR'],
  AWAITING_ANCHOR: ['AWAITING_PAYMENT', 'ANCHOR_ERROR', 'NEEDS_KYC', 'EXPIRED'],
  AWAITING_PAYMENT: ['PROCESSING', 'ANCHOR_ERROR', 'EXPIRED'],
  PROCESSING: ['SETTLING', 'ANCHOR_ERROR', 'EXPIRED'],
  SETTLING: ['SETTLED_FIAT', 'ANCHOR_ERROR', 'EXPIRED'],
};

function isValidBreBTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  const allowed = BRE_B_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export class OffRampService {
  private adapter: AnchorAdapter;
  private liquidityCache: { at: number; available: number } | null = null;

  constructor() {
    this.adapter = getAdapter();
  }

  /**
   * Best-effort pre-check that the anchor can settle `sellAmount` USDC.
   *
   * Only meaningful on the real Abroad anchor (mock/testnet adapters simulate
   * settlement). Fails OPEN when liquidity is unknown — the check is a UX
   * guard against creating invoices that cannot settle, not a security
   * control; the payout itself still fails safely at the anchor if liquidity
   * ran out in between. Result is cached for 60s because Abroad's upstream
   * liquidity feed is slow and often returns cached figures itself.
   */
  async checkLiquidity(sellAmount: string): Promise<{ ok: boolean; available?: number }> {
    if (this.adapter.id !== 'abroad') return { ok: true };
    const amount = Number(sellAmount);
    if (!Number.isFinite(amount) || amount <= 0) return { ok: true };

    const now = Date.now();
    if (!this.liquidityCache || now - this.liquidityCache.at > 60_000) {
      const liq = await abroadAdapter.getLiquidity('BREB');
      if (!liq) {
        // Unknown liquidity must not block invoicing; the anchor re-checks at payout.
        return { ok: true };
      }
      this.liquidityCache = { at: now, available: liq.available };
    }

    const { available } = this.liquidityCache;
    if (amount <= available) return { ok: true, available };
    log.warn('[OffRampService] insufficient Bre-B liquidity', { amount, available });
    return { ok: false, available };
  }

  // Display-only COP estimates for the public payment page, cached 60s per
  // invoice: each anchor reverse-quote mints a quote_id server-side, so page
  // views shouldn't hammer it. Never persisted — the firm quote at pay time
  // is still the source of truth.
  private estimateCache = new Map<string, { buyAmount: string | null; rate: string; at: number }>();

  // Abroad refuses COP payouts under this floor ("The minimum allowed amount
  // for COP is 5000 COP") — mirror it at creation so merchants can't mint
  // invoices that are guaranteed dead ends for the payer.
  static readonly FIAT_MIN_COP = 5000;

  // Cached USDC→COP anchor rate for minimum checks and open-amount previews.
  // Probed with an amount safely above the anchor's own minimum.
  private rateCache: { rate: number; at: number } | null = null;

  private async getAnchorRate(): Promise<number | null> {
    if (this.rateCache && Date.now() - this.rateCache.at < 60_000) {
      return this.rateCache.rate;
    }
    try {
      const quote = await this.adapter.getQuote({
        sellAmount: '10',
        buyCurrency: 'COP',
        payoutAlias: '',
      });
      const rate = Number(quote.rate);
      if (!Number.isFinite(rate) || rate <= 0) return null;
      this.rateCache = { rate, at: Date.now() };
      return rate;
    } catch (error) {
      log.warn('[OffRampService] Anchor rate probe failed', {
        error: (error as Error)?.message,
      });
      return null;
    }
  }

  /**
   * Anchor minimum guard: fails when the amount converts to less than the
   * anchor's COP floor. Fail-open when the rate is unknown — the anchor
   * itself is the final arbiter at quote time.
   */
  async checkMinimum(
    sellAmount: string
  ): Promise<{ ok: true } | { ok: false; minUsdc: string; minCop: number }> {
    if (this.adapter.id !== 'abroad') return { ok: true };
    const amount = Number(sellAmount);
    if (!(amount > 0)) return { ok: true };
    const rate = await this.getAnchorRate();
    if (!rate) return { ok: true };
    if (amount * rate >= OffRampService.FIAT_MIN_COP) return { ok: true };
    return {
      ok: false,
      minUsdc: (OffRampService.FIAT_MIN_COP / rate).toFixed(2),
      minCop: OffRampService.FIAT_MIN_COP,
    };
  }

  /**
   * Public estimate of what the receiver gets, for the /pay page summary.
   * No auth: reveals nothing beyond what the payment page already shows.
   */
  async getPublicEstimate(invoiceId: string): Promise<{
    available: boolean;
    buyAmount?: string;
    rate?: string;
    belowMinimum?: boolean;
    minCop?: number;
    minUsdc?: string;
  }> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.payoutMethod !== 'BRE_B') throw new Error('Invoice is not a Bre-B off-ramp');

    // Pay flow already produced a firm quote — reuse it, no anchor call.
    if (invoice.quoteBuyAmount) {
      const sell = Number(invoice.total);
      const buy = Number(invoice.quoteBuyAmount);
      return {
        available: true,
        buyAmount: invoice.quoteBuyAmount.toString(),
        rate: sell > 0 && Number.isFinite(buy / sell) ? String(buy / sell) : undefined,
      };
    }

    const cached = this.estimateCache.get(invoiceId);
    if (cached && Date.now() - cached.at < 60_000) {
      return { available: true, buyAmount: cached.buyAmount ?? undefined, rate: cached.rate };
    }

    const rail = railById(invoice.payoutMethod);
    const buyCurrency = rail?.buyCurrency ?? 'COP';
    const total = invoice.total.toString();

    try {
      if (Number(total) > 0) {
        // Below the anchor's floor the quote endpoint just 400s — answer from
        // the cached rate instead so the page can explain the minimum.
        const minimum = await this.checkMinimum(total);
        if (!minimum.ok) {
          return { available: false, belowMinimum: true, minCop: minimum.minCop, minUsdc: minimum.minUsdc };
        }
        const quote = await this.adapter.getQuote({
          sellAmount: total,
          buyCurrency,
          payoutAlias: invoice.payoutAlias ?? '',
        });
        this.estimateCache.set(invoiceId, { buyAmount: quote.buyAmount, rate: quote.rate, at: Date.now() });
        return { available: true, buyAmount: quote.buyAmount, rate: quote.rate };
      }
      // Open-amount before the payer sets it: expose the cached anchor rate so
      // the page can preview `typed amount × rate` live.
      const rate = await this.getAnchorRate();
      if (!rate) return { available: false };
      this.estimateCache.set(invoiceId, { buyAmount: null, rate: String(rate), at: Date.now() });
      return { available: true, rate: String(rate) };
    } catch (error) {
      // Estimate is best-effort UI sugar — anchor hiccups must not error the page.
      log.warn('[OffRampService] Public estimate unavailable', {
        invoiceId,
        error: (error as Error)?.message,
      });
      return { available: false };
    }
  }

  /**
   * Request a firm off-ramp quote and advance invoice to AWAITING_ANCHOR.
   * Only the receiver (freelancer) of a BRE_B PENDING invoice can call this.
   */
  async getQuote(
    invoiceId: string,
    freelancerWallet: string,
    params: { sellAmount: string; payoutAlias: string }
  ): Promise<Quote> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.freelancerWallet !== freelancerWallet) throw new Error('Unauthorized');
    if (invoice.payoutMethod !== 'BRE_B') throw new Error('Invoice is not a Bre-B off-ramp');
    // Re-quoting from AWAITING_ANCHOR is allowed: it refreshes an expired or
    // stranded quote (e.g. a failed initiate) without restarting the invoice.
    const requoting = invoice.status === 'AWAITING_ANCHOR';
    if (!requoting && !isValidBreBTransition(invoice.status as InvoiceStatus, 'AWAITING_ANCHOR')) {
      throw new Error(`Cannot request quote from status ${invoice.status}`);
    }

    // The rail (and thus the destination fiat currency) is fixed by the
    // invoice's payout method. Bre-B → COP today; Pix/Transferência 3.0 will
    // add BRL/ARS once live. Falls back to COP for the legacy single-rail case.
    const rail = railById(invoice.payoutMethod);
    const buyCurrency = rail?.buyCurrency ?? 'COP';
    let sellAmount: Prisma.Decimal;
    try {
      sellAmount = new Prisma.Decimal(params.sellAmount);
    } catch {
      throw new Error('Cannot quote an invalid invoice amount');
    }
    if (!sellAmount.isFinite() || !sellAmount.greaterThan(0)) {
      throw new Error('Cannot quote an invalid invoice amount');
    }
    if (!sellAmount.equals(invoice.total)) {
      throw new Error('Cannot quote an amount different from the invoice total');
    }
    const invoiceSellAmount = invoice.total.toString();

    // Re-check liquidity at quote time: it may have drained since the
    // invoice was created, and a firm quote the anchor cannot fill would
    // strand the payer mid-flow.
    const liquidity = await this.checkLiquidity(invoiceSellAmount);
    if (!liquidity.ok) {
      throw new Error('FIAT_LIQUIDITY_INSUFFICIENT');
    }

    log.info('[OffRampService] Requesting quote', {
      invoiceId,
      sellAmount: invoiceSellAmount,
      buyCurrency,
    });

    const quote = await this.adapter.getQuote({
      sellAmount: invoiceSellAmount,
      buyCurrency,
      payoutAlias: params.payoutAlias,
    });

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'AWAITING_ANCHOR',
          quoteId: quote.quoteId,
          quoteBuyAmount: quote.buyAmount,
          payoutAlias: params.payoutAlias,
          anchorProvider:
            this.adapter.id === 'testnet'
              ? 'TESTNET'
              : this.adapter.id === 'abroad'
                ? 'ABROAD'
                : 'MOCK_BREB',
        },
      });

      await tx.invoiceAuditLog.create({
        data: {
          invoiceId,
          action: 'OFFRAMP_INITIATED',
          actorWallet: freelancerWallet,
          changes: {
            status: { from: invoice.status, to: 'AWAITING_ANCHOR' },
            quoteId: { from: null, to: quote.quoteId },
          },
        },
      });
    });

    return quote;
  }

  /**
   * Initiate the SEP-24 withdraw and advance to AWAITING_PAYMENT.
   */
  async initiateOffRamp(
    invoiceId: string,
    freelancerWallet: string,
    params: { quoteId: string }
  ): Promise<OffRampIntent> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.freelancerWallet !== freelancerWallet) throw new Error('Unauthorized');
    if (invoice.status !== 'AWAITING_ANCHOR') {
      throw new Error('Invoice must be in AWAITING_ANCHOR status');
    }
    // Bind the initiation to the quote we issued for this invoice, not an
    // arbitrary client-supplied id.
    if (invoice.quoteId && params.quoteId !== invoice.quoteId) {
      throw new Error('Quote does not match this invoice');
    }

    log.info('[OffRampService] Initiating off-ramp', { invoiceId, quoteId: params.quoteId });

    const intent = await this.adapter.initiateOffRamp({
      quoteId: params.quoteId,
      receiverAccount: invoice.freelancerWallet,
      payoutAlias: invoice.payoutAlias || 'unknown',
    });

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'AWAITING_PAYMENT',
          anchorTxId: intent.anchorTxId,
          anchorDepositAddress: intent.depositAddress || null,
          anchorMemo: intent.memo || null,
          anchorMemoType: intent.memoType || null,
          anchorInteractiveUrl: intent.interactiveUrl || null,
        },
      });

      await tx.invoiceAuditLog.create({
        data: {
          invoiceId,
          action: 'OFFRAMP_AWAITING_PAYMENT',
          actorWallet: freelancerWallet,
          changes: {
            status: { from: 'AWAITING_ANCHOR', to: 'AWAITING_PAYMENT' },
            anchorTxId: { from: null, to: intent.anchorTxId },
            interactiveUrl: { from: null, to: intent.interactiveUrl || null },
          },
        },
      });
    });

    return intent;
  }

  /**
   * Payer-driven open-amount off-ramp. The payer supplies the amount at
   * checkout (the receiver never fixed one), so we persist it as the invoice
   * total, then run quote + initiate in one shot so the normal pay-intent /
   * submit flow can proceed. Public — no receiver auth — and gated strictly to
   * open-amount BRE_B invoices still in PENDING, so it can't touch a normal
   * receiver-driven invoice.
   */
  async prepareOpenAmountOffRamp(
    invoiceId: string,
    sellAmount: string | number
  ): Promise<{ quoteBuyAmount: string | null; depositAddress: string | null; total: string }> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.payoutMethod !== 'BRE_B') throw new Error('Invoice is not a Bre-B off-ramp');
    if (!invoice.isOpenAmount) throw new Error('Invoice is not open-amount');
    if (invoice.status !== 'PENDING') {
      throw new Error(`Amount already set for this invoice (status ${invoice.status})`);
    }
    if (!invoice.payoutAlias) throw new Error('Invoice has no Bre-B payout alias');

    const amount = new Prisma.Decimal(sellAmount);
    if (!amount.isFinite() || amount.lessThanOrEqualTo(0)) {
      throw new Error('Amount must be greater than zero');
    }
    const sellAmountStr = amount.toString();

    // Same anchor floor as invoice creation — reject before claiming the
    // invoice so the payer can simply try a larger amount.
    const minimum = await this.checkMinimum(sellAmountStr);
    if (!minimum.ok) {
      throw new Error('FIAT_AMOUNT_BELOW_MINIMUM');
    }

    // Atomically claim the invoice (PENDING → AWAITING_ANCHOR) so two concurrent
    // set-amount calls can't both pass the status check and double-quote.
    const claimed = await prisma.invoice.updateMany({
      where: { id: invoiceId, status: 'PENDING' },
      data: { status: 'AWAITING_ANCHOR' },
    });
    if (claimed.count === 0) {
      throw new Error('Amount already set for this invoice');
    }

    log.info('[OffRampService] Preparing open-amount off-ramp', { invoiceId, sellAmount: sellAmountStr });

    try {
      const payoutAlias = invoice.payoutAlias;
      // 1. Request the firm quote and persist the payer-chosen amount.
      const quote = await this.adapter.getQuote({
        sellAmount: sellAmountStr,
        buyCurrency: 'COP',
        payoutAlias,
      });

      await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          subtotal: amount,
          taxRate: null,
          taxAmount: new Prisma.Decimal(0),
          discount: new Prisma.Decimal(0),
          total: amount,
          status: 'AWAITING_ANCHOR',
          quoteId: quote.quoteId,
          quoteBuyAmount: quote.buyAmount,
          anchorProvider:
            this.adapter.id === 'testnet'
              ? 'TESTNET'
              : this.adapter.id === 'abroad'
                ? 'ABROAD'
                : 'MOCK_BREB',
        },
      });
      await tx.invoiceAuditLog.create({
        data: {
          invoiceId,
          action: 'OFFRAMP_INITIATED',
          actorWallet: invoice.freelancerWallet,
          changes: {
            status: { from: 'PENDING', to: 'AWAITING_ANCHOR' },
            total: { from: '0', to: sellAmountStr },
          },
        },
      });
    });

    // 2. Initiate the withdraw → AWAITING_PAYMENT (deposit address + memo).
    const intent = await this.adapter.initiateOffRamp({
      quoteId: quote.quoteId,
      receiverAccount: invoice.freelancerWallet,
      payoutAlias: invoice.payoutAlias,
    });

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'AWAITING_PAYMENT',
          anchorTxId: intent.anchorTxId,
          anchorDepositAddress: intent.depositAddress || null,
          anchorMemo: intent.memo || null,
          anchorMemoType: intent.memoType || null,
          anchorInteractiveUrl: intent.interactiveUrl || null,
        },
      });
      await tx.invoiceAuditLog.create({
        data: {
          invoiceId,
          action: 'OFFRAMP_AWAITING_PAYMENT',
          actorWallet: invoice.freelancerWallet,
          changes: {
            status: { from: 'AWAITING_ANCHOR', to: 'AWAITING_PAYMENT' },
            anchorTxId: { from: null, to: intent.anchorTxId },
          },
        },
      });
    });

      return {
        quoteBuyAmount: quote.buyAmount,
        depositAddress: intent.depositAddress ?? null,
        total: sellAmountStr,
      };
    } catch (err) {
      // The quote/initiate failed after we claimed the invoice — roll the claim
      // back to PENDING so the payer can retry instead of being stranded in
      // AWAITING_ANCHOR.
      await prisma.invoice.updateMany({
        where: { id: invoiceId, status: 'AWAITING_ANCHOR' },
        data: { status: 'PENDING' },
      });
      throw err;
    }
  }

  /**
   * Poll the anchor for current status and advance the state machine.
   */
  async pollStatus(invoiceId: string): Promise<{ status: InvoiceStatus; anchorStatus: AnchorStatus }> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');
    if (!invoice.anchorTxId) throw new Error('No anchor transaction for this invoice');

    const anchorStatus = await this.adapter.getStatus(invoice.anchorTxId);
    const newStatus = this.mapAnchorToInvoiceStatus(anchorStatus, invoice.status as InvoiceStatus);

    if (newStatus && newStatus !== invoice.status) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });

      // On settlement, write an on-chain receipt (no-op if not configured).
      if (newStatus === 'SETTLED_FIAT') {
        await this.writeReceipt(invoiceId);
      }
    }

    return { status: newStatus || (invoice.status as InvoiceStatus), anchorStatus };
  }

  /**
   * Mark that the anchor-bound payment was detected on-chain.
   * The submit route provides the verified on-chain payment details.
   * Advances AWAITING_PAYMENT → PROCESSING.
   */
  async markAnchorPayment(
    invoiceId: string,
    txHash: string,
    ledgerNumber: number,
    fromWallet: string,
    toWallet: string
  ): Promise<void> {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error('Invoice not found');

    if (invoice.status !== 'AWAITING_PAYMENT') {
      throw new Error(`Invoice not in AWAITING_PAYMENT (current: ${invoice.status})`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PROCESSING',
          transactionHash: txHash,
          ledgerNumber,
          payerWallet: fromWallet,
          clientWallet: fromWallet,
        },
      });

      await tx.payment.create({
        data: {
          invoiceId,
          transactionHash: txHash,
          ledgerNumber,
          fromWallet,
          toWallet,
          amount: invoice.total,
          asset: invoice.currency,
        },
      });

      await tx.invoiceAuditLog.create({
        data: {
          invoiceId,
          action: 'OFFRAMP_PROCESSING',
          actorWallet: fromWallet,
          changes: {
            status: { from: 'AWAITING_PAYMENT', to: 'PROCESSING' },
            transactionHash: { from: null, to: txHash },
          },
        },
      });
    });
  }

  /**
   * Write an on-chain receipt for a settled invoice and persist the tx hash.
   * No-op when the receipt contract/signer is not configured. Never throws —
   * receipt failures must not affect settlement.
   */
  private async writeReceipt(invoiceId: string): Promise<void> {
    if (!receiptService.enabled) return;
    try {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice || invoice.receiptTxHash) return;
      if (!invoice.payerWallet || !invoice.anchorTxId) return;

      const hash = await receiptService.writeReceipt({
        invoiceId,
        payer: invoice.payerWallet,
        payee: invoice.freelancerWallet,
        amount: invoice.total.toString(),
        asset: invoice.currency,
        anchorTxId: invoice.anchorTxId,
        memo: invoice.anchorMemo || invoice.id,
      });

      if (hash) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { receiptTxHash: hash },
        });
      }
    } catch (error: any) {
      log.error('[OffRampService] Receipt write failed', { invoiceId, error: error?.message });
    }
  }

  // Forward-only ordering so anchor polling can never regress the invoice
  // (e.g. a poll-driven mock reporting AWAITING_PAYMENT after we already
  // detected the on-chain payment and moved to PROCESSING).
  private static readonly STATE_RANK: Partial<Record<InvoiceStatus, number>> = {
    AWAITING_ANCHOR: 0,
    AWAITING_PAYMENT: 1,
    PROCESSING: 2,
    SETTLING: 3,
    SETTLED_FIAT: 4,
  };

  // Once an invoice reaches one of these, no anchor poll may move it — this
  // stops a late/duplicate/mock ERROR or EXPIRED from regressing a completed
  // settlement (the status endpoint is public).
  private static readonly TERMINAL_STATES: ReadonlySet<InvoiceStatus> = new Set<InvoiceStatus>([
    'SETTLED_FIAT',
    'ANCHOR_ERROR',
    'EXPIRED',
    'PAID',
    'CANCELLED',
  ]);

  private mapAnchorToInvoiceStatus(
    anchorStatus: AnchorStatus,
    current: InvoiceStatus
  ): InvoiceStatus | null {
    // Never transition out of a terminal state.
    if (OffRampService.TERMINAL_STATES.has(current)) return null;

    // Terminal failures override the happy-path ordering.
    if (anchorStatus === 'ERROR') return 'ANCHOR_ERROR';
    if (anchorStatus === 'EXPIRED') return 'EXPIRED';

    const target: InvoiceStatus | null = (() => {
      switch (anchorStatus) {
        case 'AWAITING_PAYMENT':
          return 'AWAITING_PAYMENT';
        case 'PAYMENT_DETECTED':
          return 'PROCESSING';
        case 'SETTLING':
          return 'SETTLING';
        case 'SETTLED':
          return 'SETTLED_FIAT';
        case 'INITIATED':
        default:
          return null;
      }
    })();

    if (!target) return null;

    const rank = OffRampService.STATE_RANK;
    const currentRank = rank[current] ?? -1;
    const targetRank = rank[target] ?? -1;
    // Only ever advance forward.
    return targetRank > currentRank ? target : null;
  }
}

export const offRampService = new OffRampService();
