//
// MockBreBAdapter — demo anchor that simulates Bre-B COP settlement
//
// The on-chain USDC leg is ALWAYS a real testnet payment to the
// Link2Pay-generated testnet address. The COP payout is simulated using
// a fixed exchange rate. Every UI surface rendering this settlement
// MUST say "Simulated Bre-B settlement (testnet demo)".
//
import type { AnchorAdapter, Quote, OffRampIntent, AnchorStatus } from '../AnchorAdapter';
import { config } from '../../config';
import { log } from '../../utils/logger';

const SIMULATED_USDC_COP_RATE = '4120.50';

// Testnet deposit address the payer sends USDC to. Override via
// MOCK_DEPOSIT_ADDRESS env so it points at a real funded account that holds a
// USDC trustline. In production this would come from the Bre-B rail.
const DEFAULT_MOCK_DEPOSIT_ADDRESS = 'GBKZZZWCJUUVUXNBFYGZ3EKWB725DKCLJECUSO3EG2CCFAFOX7XD3GIW';

export class MockBreBAdapter implements AnchorAdapter {
  readonly id = 'mock-breb' as const;

  // In-memory simulated state — maps anchorTxId → { status, quote }
  private stores: Map<string, { status: AnchorStatus; quote: Quote }> = new Map();
  private quoteCounter = 0;

  async getQuote(params: {
    sellAmount: string;
    buyCurrency: 'COP';
    payoutAlias: string;
  }): Promise<Quote> {
    const sellAmountNum = parseFloat(params.sellAmount);
    const buyAmountNum = sellAmountNum * parseFloat(SIMULATED_USDC_COP_RATE);
    const feeNum = buyAmountNum * 0.005; // 0.5% simulated anchor fee

    const quoteId = `mock-breb-${Date.now()}-${++this.quoteCounter}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

    const quote: Quote = {
      quoteId,
      sellAsset: 'USDC',
      buyAsset: 'COP',
      sellAmount: params.sellAmount,
      buyAmount: buyAmountNum.toFixed(2),
      rate: SIMULATED_USDC_COP_RATE,
      feeTotal: feeNum.toFixed(2),
      expiresAt,
    };

    log.info('[MockBreBAdapter] Generated simulated quote', {
      quoteId,
      sellAmount: quote.sellAmount,
      buyAmount: quote.buyAmount,
      expiresAt,
    });

    return quote;
  }

  async initiateOffRamp(params: {
    quoteId: string;
    receiverAccount: string;
    payoutAlias: string;
  }): Promise<OffRampIntent> {
    const anchorTxId = `mock-breb-tx-${Date.now()}`;

    // Short text memo (<=28 bytes) so it fits a Stellar text memo on the
    // real on-chain USDC payment. Derived from the tx timestamp.
    const memo = `brb-${anchorTxId.slice(-12)}`;
    const amount = '0'; // Will be filled by the actual USDC payment

    // Store initial state
    this.stores.set(anchorTxId, {
      status: 'INITIATED',
      quote: {
        quoteId: params.quoteId,
        sellAsset: 'USDC',
        buyAsset: 'COP',
        sellAmount: '0',
        buyAmount: '0',
        rate: SIMULATED_USDC_COP_RATE,
        feeTotal: '0',
        expiresAt: '',
      },
    });

    log.info('[MockBreBAdapter] Initiated simulated off-ramp', {
      anchorTxId,
      payoutAlias: params.payoutAlias,
      memo,
    });

    if (!config.anchor.mockDepositAddress) {
      log.warn(
        '[MockBreBAdapter] MOCK_DEPOSIT_ADDRESS is unset — using the built-in ' +
          'testnet placeholder. Payer funds go to an address you may not control. ' +
          'This adapter is testnet-demo only; never select mock-breb on mainnet.'
      );
    }

    return {
      anchorTxId,
      depositAddress: config.anchor.mockDepositAddress || DEFAULT_MOCK_DEPOSIT_ADDRESS,
      memo,
      memoType: 'text',
      asset: 'USDC',
      amount,
    };
  }

  async getStatus(anchorTxId: string): Promise<AnchorStatus> {
    const stored = this.stores.get(anchorTxId);

    // If this is a new lookup (from polling after payment is detected),
    // advance the simulation
    if (stored) {
      // Simulate state machine: INITIATED → AWAITING_PAYMENT → PAYMENT_DETECTED → SETTLING → SETTLED
      // The real watcher advances on actual on-chain detection;
      // this simulation just handles the settlement steps.
      switch (stored.status) {
        case 'INITIATED':
          // After 1 poll cycle, simulate payment being awaited
          stored.status = 'AWAITING_PAYMENT';
          break;
        case 'AWAITING_PAYMENT':
          // After 2 poll cycles, simulate payment detected
          stored.status = 'PAYMENT_DETECTED';
          break;
        case 'PAYMENT_DETECTED':
          // After 3 poll cycles, simulate settling
          stored.status = 'SETTLING';
          break;
        case 'SETTLING':
          // After 4 poll cycles, simulate settlement complete
          stored.status = 'SETTLED';
          break;
      }
      log.info('[MockBreBAdapter] State transition', {
        anchorTxId,
        newStatus: stored.status,
      });
      return stored.status;
    }

    // Unknown tx — the in-memory store was lost (e.g. a server restart). Rather
    // than flip an in-flight demo invoice to ANCHOR_ERROR, re-seed it and resume
    // the simulation from AWAITING_PAYMENT.
    log.warn('[MockBreBAdapter] Unknown anchorTxId — re-seeding after restart', { anchorTxId });
    this.stores.set(anchorTxId, {
      status: 'AWAITING_PAYMENT',
      quote: {
        quoteId: '',
        sellAsset: 'USDC',
        buyAsset: 'COP',
        sellAmount: '0',
        buyAmount: '0',
        rate: SIMULATED_USDC_COP_RATE,
        feeTotal: '0',
        expiresAt: '',
      },
    });
    return 'AWAITING_PAYMENT';
  }
}

export const mockBreBAdapter = new MockBreBAdapter();
