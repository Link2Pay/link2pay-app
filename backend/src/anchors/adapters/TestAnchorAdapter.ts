//
// TestAnchorAdapter — real SEP-10/38/24 integration against testanchor.stellar.org
//
// FALLBACK NOTICE (2026-06-28):
// testanchor SEP-38 only quotes USD and CAD pairs — it does NOT quote COP.
// Therefore getQuote() returns a simulated COP quote built on the real USDC→USD
// firm quote, and initiateOffRamp() uses the real SEP-24 USDC withdrawal flow.
// The COP/FX leg is documented as "mock" until a COP-capable anchor or Bre-B
// sandbox is available.
//

import {
  Wallet,
  Anchor,
  Sep24,
  SigningKeypair,
  Types,
} from '@stellar/typescript-wallet-sdk';
import { config } from '../../config';
import { log } from '../../utils/logger';
import type {
  AnchorAdapter,
  Quote,
  OffRampIntent,
  AnchorStatus,
  BuyCurrency,
} from '../AnchorAdapter';

// ── asset identifiers ────────────────────────────────────────────────────────
const sellAsset = `stellar:USDC:${config.stellar.usdcIssuer}`;
const buyAsset = 'iso4217:USD'; // testanchor only supports USD/CAD, not COP

// ── simulated COP rate (hardcoded — real Bre-B would provide this) ────────────
const SIMULATED_USDC_COP_RATE = '4120.50'; // ~4,120 COP per USDC (demo)

// ── status normalization ──────────────────────────────────────────────────────
function normalizeStatus(sep24Status: string): AnchorStatus {
  switch (sep24Status) {
    case 'incomplete':
    case 'pending_user_transfer_start':
      return 'INITIATED';
    case 'pending_user_transfer_complete':
      return 'AWAITING_PAYMENT';
    case 'pending_external':
      return 'SETTLING';
    case 'pending_anchor':
      return 'PAYMENT_DETECTED';
    case 'pending_stellar':
    case 'pending_trust':
    case 'pending_user':
    case 'on_hold':
      return 'PAYMENT_DETECTED';
    case 'completed':
      return 'SETTLED';
    case 'refunded':
    case 'expired':
      return 'EXPIRED';
    case 'no_market':
    case 'too_small':
    case 'too_large':
    case 'error':
      return 'ERROR';
    default:
      return 'ERROR';
  }
}

const TERMINAL_STATUSES = new Set<string>([
  'completed',
  'refunded',
  'expired',
  'error',
  'no_market',
]);

export class TestAnchorAdapter implements AnchorAdapter {
  readonly id = 'testnet' as const;

  private authToken: Types.AuthToken | null = null;

  private getSdk(): { wallet: Wallet; anchor: Anchor } {
    const wallet = Wallet.TestNet();
    const anchor = wallet.anchor({
      homeDomain: config.anchor.homeDomain,
      allowHttp: false,
    });
    return { wallet, anchor };
  }

  private async authenticate(): Promise<Anchor> {
    const { anchor } = this.getSdk();
    const sep10 = await anchor.sep10();

    // Testnet demo keypair (not a funds key — only proves SEP-10 identity to the
    // test anchor). Overridable via TESTANCHOR_SEP10_SECRET; falls back to the
    // committed testnet-only key so the demo runs with no extra config.
    const accountKp = SigningKeypair.fromSecret(
      process.env.TESTANCHOR_SEP10_SECRET ||
        'SCHP7WM3EXUFNBX6H5DMSMNC4SZYPEO2VHVFQDBQLD6NGRUIOPIHMRD4'
    );

    const authToken = await sep10.authenticate({ accountKp });
    this.authToken = authToken;
    log.info('[TestAnchorAdapter] SEP-10 authenticated', {
      account: accountKp.publicKey,
    });
    return anchor;
  }

  // ── AnchorAdapter implementation ──────────────────────────────────────────

  async getQuote(params: {
    sellAmount: string;
    buyCurrency: BuyCurrency;
    payoutAlias: string;
  }): Promise<Quote> {
    const anchor = await this.authenticate();
    if (!this.authToken) throw new Error('Not authenticated');

    const sep38 = anchor.sep38(this.authToken);

    log.info('[TestAnchorAdapter] Requesting SEP-38 firm quote', {
      sellAsset,
      buyAsset,
      sellAmount: params.sellAmount,
    });

    const firmQuote = await (sep38.requestQuote as any)({
      sell_asset: sellAsset,
      buy_asset: buyAsset,
      sell_amount: params.sellAmount,
      context: 'sep24',
    });

    log.info('[TestAnchorAdapter] Got firm quote', {
      id: firmQuote.id,
      price: firmQuote.price,
      sellAmount: firmQuote.sell_amount,
      buyAmount: firmQuote.buy_amount,
      expiresAt: firmQuote.expires_at,
    });

    const sellAmountNum = parseFloat(firmQuote.sell_amount);
    const copBuyAmount = (
      sellAmountNum * parseFloat(SIMULATED_USDC_COP_RATE)
    ).toFixed(2);
    const copFee = (
      parseFloat(firmQuote.fee.total) * parseFloat(SIMULATED_USDC_COP_RATE)
    ).toFixed(2);

    return {
      quoteId: firmQuote.id,
      sellAsset: 'USDC',
      buyAsset: 'COP',
      sellAmount: firmQuote.sell_amount,
      buyAmount: copBuyAmount,
      rate: SIMULATED_USDC_COP_RATE,
      feeTotal: copFee,
      expiresAt: firmQuote.expires_at,
    };
  }

  async initiateOffRamp(params: {
    quoteId: string;
    receiverAccount: string;
    payoutAlias: string;
  }): Promise<OffRampIntent> {
    const anchor = await this.authenticate();
    if (!this.authToken) throw new Error('Not authenticated');

    const sep24 = anchor.sep24();

    log.info('[TestAnchorAdapter] Initiating SEP-24 withdraw', {
      assetCode: 'USDC',
      quoteId: params.quoteId,
    });

    const withdrawal = await sep24.withdraw({
      assetCode: 'USDC',
      authToken: this.authToken,
      lang: 'en',
    });

    log.info('[TestAnchorAdapter] SEP-24 withdraw response', {
      type: withdrawal.type,
      id: withdrawal.id,
      url: withdrawal.url,
    });

    const anchorTxId = withdrawal.id;
    if (!anchorTxId) {
      throw new Error('SEP-24 withdraw did not return a transaction ID');
    }

    const depositDetails = await this.waitForDepositInstructions(
      anchorTxId,
      sep24
    );

    return {
      anchorTxId,
      interactiveUrl: withdrawal.url,
      depositAddress: depositDetails.withdraw_anchor_account || '',
      memo: depositDetails.withdraw_memo || '',
      memoType:
        (depositDetails.withdraw_memo_type as 'text' | 'id' | 'hash') ||
        'text',
      asset: 'USDC',
      amount: depositDetails.amount_in || '0',
    };
  }

  async getStatus(anchorTxId: string): Promise<AnchorStatus> {
    const anchor = await this.authenticate();
    if (!this.authToken) throw new Error('Not authenticated');

    const sep24 = anchor.sep24();
    const transaction = await sep24.getTransactionBy({
      authToken: this.authToken,
      id: anchorTxId,
    });

    return normalizeStatus((transaction.status as string) || 'error');
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private async waitForDepositInstructions(
    anchorTxId: string,
    sep24: Sep24
  ): Promise<Types.WithdrawTransaction> {
    const maxAttempts = 3; // quick check — anchor requires browser KYC anyway
    const intervalMs = 2000;

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(intervalMs);

      try {
        if (!this.authToken) throw new Error('Lost auth token');

        const tx = await sep24.getTransactionBy({
          authToken: this.authToken,
          id: anchorTxId,
        });

        const status = tx.status as string;
        log.debug(`[TestAnchorAdapter] Poll ${i + 1}/${maxAttempts}`, {
          status,
        });

        if (status === 'pending_user_transfer_start') {
          const wt = tx as Types.WithdrawTransaction;
          if (wt.withdraw_anchor_account) {
            log.info('[TestAnchorAdapter] Got deposit instructions', {
              withdraw_anchor_account: wt.withdraw_anchor_account,
              withdraw_memo: wt.withdraw_memo,
              withdraw_memo_type: wt.withdraw_memo_type,
              amount_in: wt.amount_in,
            });
            return wt;
          }
        }

        if (TERMINAL_STATUSES.has(status)) {
          throw new Error(`Transaction reached terminal state: ${status}`);
        }
      } catch (error: any) {
        if (error?.message?.startsWith('Transaction reached terminal')) {
          throw error;
        }
        // Non-terminal errors (network glitches) are retryable
        log.warn('[TestAnchorAdapter] Poll error, retrying...', {
          error: error?.message,
        });
      }
    }

    // After timeout, return whatever the tx currently looks like
    // (anchor requires interactive KYC — the caller handles the URL)
    log.info(
      '[TestAnchorAdapter] No deposit instructions after polling — returning deferred intent (interactive KYC needed)'
    );
    // Re-fetch the latest transaction state
    if (!this.authToken) throw new Error('Lost auth token');
    const tx = await sep24.getTransactionBy({
      authToken: this.authToken,
      id: anchorTxId,
    });
    const wt = tx as Types.WithdrawTransaction;
    return {
      ...wt,
      withdraw_anchor_account: wt.withdraw_anchor_account || '',
      withdraw_memo: wt.withdraw_memo || '',
      withdraw_memo_type: wt.withdraw_memo_type || 'text',
      amount_in: wt.amount_in || '0',
    } as Types.WithdrawTransaction;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const testAnchorAdapter = new TestAnchorAdapter();
