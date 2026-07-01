import { createHash } from 'crypto';
import {
  rpc,
  Contract,
  TransactionBuilder,
  Keypair,
  Address,
  nativeToScVal,
  xdr,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { config } from '../config';
import { log } from '../utils/logger';

/**
 * Writes an on-chain receipt to the Soroban receipt contract when an invoice
 * settles. This is an ATTESTATION signer, not a funds key — the contract only
 * records receipts and never holds or moves funds (non-custodial).
 *
 * Fully optional: when RECEIPT_CONTRACT_ID or RECEIPT_SIGNER_SECRET is unset,
 * this is a no-op so the off-ramp still settles without an on-chain receipt.
 */
export interface ReceiptInput {
  invoiceId: string;
  payer: string; // G... address
  payee: string; // G... address
  amount: string; // decimal string
  asset: string; // e.g. "USDC"
  anchorTxId: string;
  memo: string; // hashed before storage — never stored as PII
}

class ReceiptService {
  get enabled(): boolean {
    return Boolean(config.receiptContractId && config.receiptSignerSecret);
  }

  /** Returns the receipt tx hash, or null if disabled / on failure. */
  async writeReceipt(input: ReceiptInput): Promise<string | null> {
    if (!this.enabled) {
      log.info('[ReceiptService] Skipped — contract id or signer not configured');
      return null;
    }

    try {
      const server = new rpc.Server(config.stellar.sorobanRpcUrl, {
        allowHttp: config.stellar.sorobanRpcUrl.startsWith('http://'),
      });
      const signer = Keypair.fromSecret(config.receiptSignerSecret as string);
      const source = await server.getAccount(signer.publicKey());
      const contract = new Contract(config.receiptContractId as string);

      // i128 amount in stroops (7 dp), matching Stellar asset precision.
      const amountStroops = BigInt(Math.round(parseFloat(input.amount) * 1e7));
      const memoHash = createHash('sha256').update(input.memo).digest(); // 32 bytes

      const op = contract.call(
        'write_receipt',
        nativeToScVal(input.invoiceId, { type: 'string' }),
        new Address(input.payer).toScVal(),
        new Address(input.payee).toScVal(),
        nativeToScVal(amountStroops, { type: 'i128' }),
        nativeToScVal(input.asset, { type: 'string' }),
        nativeToScVal(input.anchorTxId, { type: 'string' }),
        xdr.ScVal.scvBytes(memoHash)
      );

      const built = new TransactionBuilder(source, {
        fee: BASE_FEE,
        networkPassphrase: config.stellar.networkPassphrase,
      })
        .addOperation(op)
        .setTimeout(60)
        .build();

      const prepared = await server.prepareTransaction(built);
      prepared.sign(signer);

      const sent = await server.sendTransaction(prepared);
      if (sent.status === 'ERROR') {
        log.error('[ReceiptService] sendTransaction error', { hash: sent.hash });
        return null;
      }

      // Poll until the receipt transaction is confirmed.
      let result = await server.getTransaction(sent.hash);
      for (let i = 0; i < 10 && result.status === 'NOT_FOUND'; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        result = await server.getTransaction(sent.hash);
      }

      if (result.status !== 'SUCCESS') {
        log.error('[ReceiptService] Receipt tx not successful', { status: result.status, hash: sent.hash });
        return null;
      }

      log.info('[ReceiptService] Receipt written', { invoiceId: input.invoiceId, hash: sent.hash });
      return sent.hash;
    } catch (error: any) {
      // Never let receipt failure block settlement.
      log.error('[ReceiptService] Failed to write receipt', { error: error?.message });
      return null;
    }
  }
}

export const receiptService = new ReceiptService();
