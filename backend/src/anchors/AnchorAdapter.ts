//
// AnchorAdapter — unified interface for anchor/off-ramp providers.
// Each adapter implements exactly these three methods.
//

import type { BuyCurrency } from '../config/rails';
export type { BuyCurrency };

export type AnchorStatus =
  | 'INITIATED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_DETECTED'
  | 'SETTLING'
  | 'SETTLED'
  | 'ERROR'
  | 'EXPIRED';

export interface Quote {
  quoteId: string;
  sellAsset: string;
  buyAsset: string;
  sellAmount: string;
  buyAmount: string;
  rate: string;
  feeTotal: string;
  expiresAt: string;
}

export interface OffRampIntent {
  /** The anchor's transaction ID (SEP-24 id). */
  anchorTxId: string;
  /** SEP-24 interactive URL where the user completes KYC/bank info. */
  interactiveUrl?: string;
  /** The Stellar address the payer sends USDC to (from withdraw_anchor_account). */
  depositAddress: string;
  /** Memo the payer must attach to their Stellar payment. */
  memo: string;
  /** Memo type: 'text', 'id', or 'hash'. */
  memoType: 'text' | 'id' | 'hash';
  /** Asset code (always USDC for the on-chain leg). */
  asset: string;
  /** Amount in the asset the payer must send (e.g. "25.00" USDC). */
  amount: string;
}

export interface AnchorAdapter {
  /** Unique identifier for the adapter. */
  readonly id: 'testnet' | 'mock-breb' | 'abroad';

  /**
   * Request a firm off-ramp quote.
   * @param sellAmount — amount of USDC the payer intends to sell (string, e.g. "50.00")
   * @param buyCurrency — destination fiat for the rail (COP today; BRL/ARS once
   *                      Pix / Transferência 3.0 go live)
   * @param payoutAlias — recipient identifier for the rail (llave, Pix key, CBU…)
   */
  getQuote(params: {
    sellAmount: string;
    buyCurrency: BuyCurrency;
    payoutAlias: string;
  }): Promise<Quote>;

  /**
   * Initiate the off-ramp after the payer has accepted a quote.
   * @param quoteId — from getQuote()
   * @param receiverAccount — the Stellar account that will receive the funds
   * @param payoutAlias — Bre-B destination alias
   */
  initiateOffRamp(params: {
    quoteId: string;
    receiverAccount: string;
    payoutAlias: string;
  }): Promise<OffRampIntent>;

  /**
   * Poll the anchor for the current status of an off-ramp transaction.
   * @param anchorTxId — the anchor's transaction ID (from OffRampIntent)
   */
  getStatus(anchorTxId: string): Promise<AnchorStatus>;
}
