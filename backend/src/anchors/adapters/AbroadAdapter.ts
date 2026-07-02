//
// AbroadAdapter — production Bre-B (USDC→COP) off-ramp via Abroad.
//
// This is the mainnet/production path. The request/response mappings below are
// verified against Abroad's public docs (docs.abroad.finance) AND their
// open-source server (github.com/abroad-finance/abroad) — the real TSOA
// controllers + zod schemas. They should still be smoke-tested against the live
// Swagger at `${ABROAD_API_BASE}/docs` once API credentials are issued, because
// the hosted deployment can skew from GitHub main.
//
// REST shape (api.abroad.finance):
//   POST /quote/reverse          → firm quote for a fixed USDC amount sold
//   POST /transaction            → { id, transaction_reference, kycLink, payment_context }
//   GET  /transaction/{id}       → { status, on_chain_tx_hash, kycLink, ... }
//   Auth header:  X-API-Key
//   IMPORTANT: the on-chain memo MUST equal `transaction_reference` verbatim
//   (Abroad matches deposits via base64→uuid on the memo).
//
// Activation: set ANCHOR_PROVIDER=abroad + ABROAD_API_BASE + ABROAD_API_KEY.
// Until then this adapter throws a clear configuration error if selected.
//
import { config } from '../../config';
import { log } from '../../utils/logger';
import type { AnchorAdapter, Quote, OffRampIntent, AnchorStatus, BuyCurrency } from '../AnchorAdapter';

// POST /quote/reverse response — { quote_id, value, expiration_time } only.
// `value` is the fiat (COP) the receiver gets; fees are baked in (no breakdown).
// `expiration_time` is epoch milliseconds; quotes are valid for 1 hour.
interface AbroadQuoteResponse {
  quote_id?: string;
  value?: string | number;
  expiration_time?: number;
}

// Abroad's PaymentContext (STELLAR): where + how the payer sends the crypto.
// Present only when the transaction `id` is set AND `kycLink` is null.
interface AbroadPaymentContext {
  depositAddress?: string;
  memo?: string;
  memoType?: 'text' | 'id' | 'hash';
  amount?: string | number;
}

interface AbroadTransactionResponse {
  id?: string | null;
  transaction_reference?: string | null;
  kycLink?: string | null;
  payment_context?: AbroadPaymentContext | null;
}

interface AbroadStatusResponse {
  status?: string;
  on_chain_tx_hash?: string | null;
  kycLink?: string | null;
}

export class AbroadAdapter implements AnchorAdapter {
  readonly id = 'abroad' as const;

  private get baseUrl(): string {
    if (!config.abroad.apiBase || !config.abroad.apiKey) {
      throw new Error(
        'ABROAD_NOT_CONFIGURED: set ABROAD_API_BASE and ABROAD_API_KEY to use ANCHOR_PROVIDER=abroad'
      );
    }
    return config.abroad.apiBase.replace(/\/$/, '');
  }

  private async call<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.abroad.apiKey as string,
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      log.error('[AbroadAdapter] API error', { path, status: res.status, body: body.slice(0, 300) });
      throw new Error(`ABROAD_API_ERROR ${res.status}`);
    }
    return (await res.json()) as T;
  }

  async getQuote(params: {
    sellAmount: string;
    buyCurrency: BuyCurrency;
    payoutAlias: string;
  }): Promise<Quote> {
    // We sell a FIXED amount of USDC, so this is the REVERSE quote:
    //   POST /quote        → `amount` is the fiat (COP) TARGET, `value` = crypto needed
    //   POST /quote/reverse→ `source_amount` is the crypto SENT, `value` = fiat received
    // Amounts MUST be JSON numbers (zod z.number().positive()); a string → 400.
    const sourceAmount = Number(params.sellAmount);
    if (!Number.isFinite(sourceAmount) || sourceAmount <= 0) {
      throw new Error('ABROAD_INVALID_SELL_AMOUNT');
    }

    const data = await this.call<AbroadQuoteResponse>('/quote/reverse', {
      method: 'POST',
      body: JSON.stringify({
        crypto_currency: 'USDC',
        network: 'STELLAR',
        target_currency: params.buyCurrency,
        payment_method: 'BREB',
        source_amount: sourceAmount,
      }),
    });

    const quoteId = data.quote_id;
    if (!quoteId) throw new Error('ABROAD_QUOTE_MISSING_ID');
    if (data.value === undefined || data.value === null) throw new Error('ABROAD_QUOTE_MISSING_VALUE');

    const buyAmount = String(data.value);
    // Abroad exposes no fee breakdown — fees are baked into `value`. Derive the
    // effective rate locally for display only.
    const rate = sourceAmount > 0 ? String(Number(data.value) / sourceAmount) : '';
    const expiresAt = data.expiration_time
      ? new Date(data.expiration_time).toISOString()
      : new Date(Date.now() + 60 * 60_000).toISOString(); // real validity is 1h

    return {
      quoteId,
      sellAsset: 'USDC',
      buyAsset: params.buyCurrency,
      sellAmount: String(params.sellAmount),
      buyAmount,
      rate,
      feeTotal: '0',
      expiresAt,
    };
  }

  async initiateOffRamp(params: {
    quoteId: string;
    receiverAccount: string;
    payoutAlias: string;
  }): Promise<OffRampIntent> {
    // POST /transaction requires quote_id, account_number (the Bre-B llave), and
    // user_id (the partner's stable end-user identifier). payment_method is bound
    // at quote time, so it is NOT a field here. We use the receiver's Stellar
    // account as the stable per-merchant user_id.
    const data = await this.call<AbroadTransactionResponse>('/transaction', {
      method: 'POST',
      body: JSON.stringify({
        quote_id: params.quoteId,
        account_number: params.payoutAlias,
        user_id: params.receiverAccount,
      }),
    });

    const anchorTxId = data.id ?? undefined;
    if (!anchorTxId) throw new Error('ABROAD_TX_MISSING_ID');

    // Per Abroad's StellarListener, the on-chain memo MUST equal
    // transaction_reference verbatim. payment_context.memo mirrors it on STELLAR.
    const ctx = data.payment_context ?? null;
    const memo = ctx?.memo || data.transaction_reference || '';

    // When the end-user still needs KYC, Abroad returns a kycLink and suppresses
    // payment_context. Surface that as the interactive step instead of erroring:
    // the pay-intent route already blocks on an empty deposit address and points
    // the user at the interactive URL.
    if (!ctx || !ctx.depositAddress) {
      if (data.kycLink) {
        return {
          anchorTxId,
          interactiveUrl: data.kycLink,
          depositAddress: '',
          memo,
          memoType: ctx?.memoType || 'text',
          asset: 'USDC',
          amount: ctx?.amount != null ? String(ctx.amount) : '',
        };
      }
      throw new Error('ABROAD_TX_MISSING_DEPOSIT_ADDRESS');
    }

    if (!memo) throw new Error('ABROAD_TX_MISSING_REFERENCE');
    // transaction_reference = base64(16-byte UUID) = 24 ASCII chars, safely
    // within Stellar's 28-byte text memo. Guard anyway.
    if (Buffer.byteLength(memo, 'utf8') > 28) {
      throw new Error('ABROAD_REFERENCE_EXCEEDS_TEXT_MEMO');
    }

    return {
      anchorTxId,
      depositAddress: ctx.depositAddress,
      memo,
      memoType: ctx.memoType || 'text',
      asset: 'USDC',
      amount: ctx.amount != null ? String(ctx.amount) : '',
    };
  }

  async getStatus(anchorTxId: string): Promise<AnchorStatus> {
    const data = await this.call<AbroadStatusResponse>(`/transaction/${anchorTxId}`);
    return this.mapStatus(data.status);
  }

  private mapStatus(status?: string): AnchorStatus {
    // Abroad returns its Prisma TransactionStatus enum verbatim (UPPER_SNAKE).
    switch ((status || '').toUpperCase()) {
      case 'AWAITING_PAYMENT':
        return 'AWAITING_PAYMENT';
      case 'PROCESSING_PAYMENT':
        return 'PAYMENT_DETECTED';
      case 'PAYMENT_COMPLETED':
        return 'SETTLED';
      case 'PAYMENT_EXPIRED':
        return 'EXPIRED';
      case 'PAYMENT_FAILED':
      case 'WRONG_AMOUNT': // Abroad attempts an on-chain refund; treat as terminal error.
        return 'ERROR';
      default:
        return 'INITIATED';
    }
  }
}

export const abroadAdapter = new AbroadAdapter();
