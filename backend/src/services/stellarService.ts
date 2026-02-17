import * as StellarSdk from '@stellar/stellar-sdk';
import { config, getAssetIssuer } from '../config';

export class StellarService {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(config.stellar.horizonUrl);
    this.networkPassphrase = config.stellar.networkPassphrase;
  }

  /**
   * Validate a Stellar public key
   */
  isValidAddress(address: string): boolean {
    try {
      StellarSdk.Keypair.fromPublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load account details from Horizon
   */
  async loadAccount(publicKey: string) {
    try {
      return await this.server.loadAccount(publicKey);
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error('ACCOUNT_NOT_FOUND');
      }
      throw error;
    }
  }

  /**
   * Get account balances
   */
  async getBalances(publicKey: string) {
    const account = await this.loadAccount(publicKey);
    return account.balances.map((balance: any) => ({
      asset:
        balance.asset_type === 'native'
          ? 'XLM'
          : `${balance.asset_code}:${balance.asset_issuer}`,
      code: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
      balance: balance.balance,
      issuer: balance.asset_type === 'native' ? null : balance.asset_issuer,
    }));
  }

  /**
   * Build a payment transaction for an invoice
   */
  async buildPaymentTransaction(params: {
    senderPublicKey: string;
    recipientPublicKey: string;
    amount: string;
    assetCode: string;
    invoiceId: string;
  }) {
    const {
      senderPublicKey,
      recipientPublicKey,
      amount,
      assetCode,
      invoiceId,
    } = params;

    // Validate addresses
    if (!this.isValidAddress(senderPublicKey)) {
      throw new Error('INVALID_SENDER_ADDRESS');
    }
    if (!this.isValidAddress(recipientPublicKey)) {
      throw new Error('INVALID_RECIPIENT_ADDRESS');
    }

    // Load sender account for sequence number
    const senderAccount = await this.loadAccount(senderPublicKey);

    // Determine asset
    const asset = this.getAsset(assetCode);

    // Build transaction
    const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: recipientPublicKey,
          asset,
          amount,
        })
      )
      .addMemo(StellarSdk.Memo.text(invoiceId.substring(0, 28)))
      .setTimeout(300) // 5 minutes
      .build();

    return {
      transactionXdr: transaction.toXDR(),
      networkPassphrase: this.networkPassphrase,
    };
  }

  /**
   * Generate SEP-7 payment URI for wallet deep linking
   */
  generateSEP7Uri(params: {
    destination: string;
    amount: string;
    assetCode: string;
    assetIssuer?: string;
    memo: string;
  }) {
    const { destination, amount, assetCode, assetIssuer, memo } = params;

    const queryParams = new URLSearchParams({
      destination,
      amount,
      asset_code: assetCode,
      memo,
      memo_type: 'MEMO_TEXT',
    });

    if (assetIssuer) {
      queryParams.set('asset_issuer', assetIssuer);
    }

    return `web+stellar:pay?${queryParams.toString()}`;
  }

  /**
   * Verify a transaction on the Stellar network
   */
  async verifyTransaction(transactionHash: string) {
    try {
      const tx = await this.server
        .transactions()
        .transaction(transactionHash)
        .call();

      // Get the operations for this transaction
      const operations = await this.server
        .operations()
        .forTransaction(transactionHash)
        .call();

      const paymentOps = operations.records.filter(
        (op: any) => op.type === 'payment'
      );

      return {
        hash: tx.hash,
        ledger: tx.ledger_attr,
        successful: tx.successful,
        memo: tx.memo,
        memoType: tx.memo_type,
        createdAt: tx.created_at,
        sourceAccount: tx.source_account,
        payments: paymentOps.map((op: any) => ({
          from: op.from,
          to: op.to,
          amount: op.amount,
          assetCode: op.asset_type === 'native' ? 'XLM' : op.asset_code,
          assetIssuer: op.asset_issuer || null,
        })),
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Submit a signed transaction to the network
   */
  async submitTransaction(signedXdr: string) {
    try {
      const transaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        this.networkPassphrase
      );

      const result = await this.server.submitTransaction(
        transaction as StellarSdk.Transaction
      );
      return {
        hash: result.hash,
        ledger: result.ledger,
        successful: true,
      };
    } catch (error: any) {
      const resultCodes = error?.response?.data?.extras?.result_codes;
      throw new Error(
        `Transaction failed: ${JSON.stringify(resultCodes || error.message)}`
      );
    }
  }

  /**
   * Stream payments to a specific account (for watcher)
   */
  streamPayments(
    accountId: string,
    onPayment: (payment: any) => void,
    cursor?: string
  ) {
    const builder = this.server.payments().forAccount(accountId).limit(1);

    if (cursor) {
      builder.cursor(cursor);
    }

    return builder.stream({
      onmessage: onPayment,
      onerror: (error: any) => {
        console.error('Stream error:', error);
      },
    });
  }

  /**
   * Get recent transactions for an account
   */
  async getTransactionHistory(accountId: string, limit = 10) {
    const transactions = await this.server
      .transactions()
      .forAccount(accountId)
      .limit(limit)
      .order('desc')
      .call();

    return transactions.records;
  }

  /**
   * Get the appropriate Stellar asset object
   */
  private getAsset(code: string): StellarSdk.Asset {
    if (code === 'XLM') {
      return StellarSdk.Asset.native();
    }

    const issuer = getAssetIssuer(code);
    if (!issuer) {
      throw new Error(`Unknown asset: ${code}`);
    }

    return new StellarSdk.Asset(code, issuer);
  }

  /**
   * Fund a testnet account via Friendbot
   */
  async fundTestnetAccount(publicKey: string) {
    if (config.stellar.network !== 'testnet') {
      throw new Error('Friendbot is only available on testnet');
    }

    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fund testnet account');
    }

    return response.json();
  }
}

export const stellarService = new StellarService();
