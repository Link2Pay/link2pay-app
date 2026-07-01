//
// AbroadAdapter — production Bre-B (USDC→COP) off-ramp via Abroad.
//
// This is the mainnet/production path. It is a DOCUMENTED, STUBBED integration:
// Abroad has no public sandbox, so the request/response field mappings below
// follow Abroad's documented REST shape (spec §10) and MUST be confirmed against
// the live Swagger at `${ABROAD_API_BASE}/docs` once API credentials are issued.
//
// REST shape (spec §10):
//   POST /quote                  → firm quote
//   POST /transaction            → { transaction_reference, ... }
//   GET  /transaction/{id}       → status
//   Auth header:  X-API-Key
//   IMPORTANT: `transaction_reference` MUST be used as the on-chain memo.
//
// Activation: set ANCHOR_PROVIDER=abroad + ABROAD_API_BASE + ABROAD_API_KEY.
// Until then this adapter throws a clear configuration error if selected.
//
import { config } from '../../config';
import { log } from '../../utils/logger';
import type { AnchorAdapter, Quote, OffRampIntent, AnchorStatus } from '../AnchorAdapter';

interface AbroadQuoteResponse {
  quote_id?: string;
  id?: string;
  source_amount?: string | number;
  target_amount?: string | number;
  rate?: string | number;
  fee?: string | number;
  total_fee?: string | number;
  expires_at?: string;
}

interface AbroadTransactionResponse {
  id?: string;
  transaction_id?: string;
  transaction_reference?: string;
  deposit_address?: string;
  stellar_account?: string;
  amount?: string | number;
  status?: string;
}

interface AbroadStatusResponse {
  status?: string;
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
    buyCurrency: 'COP';
    payoutAlias: string;
  }): Promise<Quote> {
    // Field names per the Abroad API reference (docs.abroad.finance/reference/api):
    // crypto_currency (always USDC, the source), target_currency (COP/BRL),
    // payment_method (BREB/PIX), network (STELLAR). Off-ramp only — there is no
    // COP→USDC on-ramp. /quote/reverse exists for fixing the exact COP output.
    const data = await this.call<AbroadQuoteResponse>('/quote', {
      method: 'POST',
      body: JSON.stringify({
        crypto_currency: 'USDC',
        network: 'STELLAR',
        target_currency: params.buyCurrency,
        payment_method: 'BREB',
        amount: params.sellAmount,
      }),
    });

    const quoteId = data.quote_id || data.id;
    if (!quoteId) throw new Error('ABROAD_QUOTE_MISSING_ID');

    return {
      quoteId,
      sellAsset: 'USDC',
      buyAsset: params.buyCurrency,
      sellAmount: String(data.source_amount ?? params.sellAmount),
      buyAmount: String(data.target_amount ?? ''),
      rate: String(data.rate ?? ''),
      feeTotal: String(data.total_fee ?? data.fee ?? '0'),
      expiresAt: data.expires_at || new Date(Date.now() + 5 * 60_000).toISOString(),
    };
  }

  async initiateOffRamp(params: {
    quoteId: string;
    receiverAccount: string;
    payoutAlias: string;
  }): Promise<OffRampIntent> {
    // payment_method=BREB; the Bre-B llave is the payout account identifier.
    const data = await this.call<AbroadTransactionResponse>('/transaction', {
      method: 'POST',
      body: JSON.stringify({
        quote_id: params.quoteId,
        payment_method: 'BREB',
        account_number: params.payoutAlias,
      }),
    });

    const anchorTxId = data.transaction_id || data.id;
    const depositAddress = data.deposit_address || data.stellar_account || '';
    // Per Abroad's spec, the transaction_reference is the on-chain memo.
    const memo = data.transaction_reference || '';

    if (!anchorTxId) throw new Error('ABROAD_TX_MISSING_ID');
    if (!memo) throw new Error('ABROAD_TX_MISSING_REFERENCE');
    // Abroad references are alphanumeric strings → text memo (28-byte limit).
    if (Buffer.byteLength(memo, 'utf8') > 28) {
      throw new Error('ABROAD_REFERENCE_EXCEEDS_TEXT_MEMO');
    }

    return {
      anchorTxId,
      depositAddress,
      memo,
      memoType: 'text',
      asset: 'USDC',
      amount: String(data.amount ?? ''),
    };
  }

  async getStatus(anchorTxId: string): Promise<AnchorStatus> {
    const data = await this.call<AbroadStatusResponse>(`/transaction/${anchorTxId}`);
    return this.mapStatus(data.status);
  }

  private mapStatus(status?: string): AnchorStatus {
    switch ((status || '').toLowerCase()) {
      case 'created':
      case 'pending':
        return 'INITIATED';
      case 'awaiting_payment':
      case 'awaiting_deposit':
        return 'AWAITING_PAYMENT';
      case 'payment_received':
      case 'processing':
        return 'PAYMENT_DETECTED';
      case 'settling':
      case 'paying_out':
        return 'SETTLING';
      case 'completed':
      case 'settled':
        return 'SETTLED';
      case 'expired':
        return 'EXPIRED';
      case 'failed':
      case 'cancelled':
        return 'ERROR';
      default:
        return 'INITIATED';
    }
  }
}

export const abroadAdapter = new AbroadAdapter();
