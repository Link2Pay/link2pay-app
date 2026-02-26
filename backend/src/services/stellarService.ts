import * as StellarSdk from '@stellar/stellar-sdk';
import { config, getAssetIssuer, getHorizonUrl, NETWORK_CONFIG } from '../config';

export class StellarService {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(config.stellar.horizonUrl);
    this.networkPassphrase = config.stellar.networkPassphrase;
  }

  /**
   * Get Horizon server for a specific network
   */
  private getServerForNetwork(networkPassphrase?: string): StellarSdk.Horizon.Server {
    if (!networkPassphrase) {
      return this.server;
    }
    const horizonUrl = getHorizonUrl(networkPassphrase);
    return new StellarSdk.Horizon.Server(horizonUrl);
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
   * Exponential backoff helper for Horizon calls.
   * Retries on 429 (rate limit) and network errors, not on 4xx client errors.
   */
  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const status = error?.response?.status;
        const isRetryable =
          status === 429 ||
          status === 503 ||
          status === 502 ||
          error?.code === 'ECONNREFUSED' ||
          error?.code === 'ECONNRESET' ||
          error?.code === 'ETIMEDOUT';

        if (!isRetryable || attempt === retries - 1) throw error;

        const delayMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    // TypeScript needs this even though the loop always throws or returns
    throw new Error('Unreachable');
  }

  /**
   * Load account details from Horizon
   */
  async loadAccount(publicKey: string) {
    try {
      return await this.withRetry(() => this.server.loadAccount(publicKey));
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error('ACCOUNT_NOT_FOUND');
      }
      throw error;
    }
  }

  private async accountExists(
    server: StellarSdk.Horizon.Server,
    publicKey: string
  ): Promise<boolean> {
    try {
      await this.withRetry(() => server.loadAccount(publicKey));
      return true;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return false;
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
    networkPassphrase?: string;
    activateNewAccounts?: boolean;
  }) {
    const {
      senderPublicKey,
      recipientPublicKey,
      amount,
      assetCode,
      invoiceId,
      networkPassphrase,
      activateNewAccounts,
    } = params;

    // Use provided networkPassphrase or fall back to default
    const effectiveNetworkPassphrase = networkPassphrase || this.networkPassphrase;

    console.log('[buildPaymentTransaction] Network:', effectiveNetworkPassphrase);
    console.log('[buildPaymentTransaction] Sender:', senderPublicKey);

    // Validate addresses
    if (!this.isValidAddress(senderPublicKey)) {
      throw new Error('INVALID_SENDER_ADDRESS');
    }
    if (!this.isValidAddress(recipientPublicKey)) {
      throw new Error('INVALID_RECIPIENT_ADDRESS');
    }

    // Load sender account for sequence number (use appropriate Horizon server)
    const server = this.getServerForNetwork(effectiveNetworkPassphrase);
    const horizonUrl = getHorizonUrl(effectiveNetworkPassphrase);
    console.log('[buildPaymentTransaction] Horizon URL:', horizonUrl);

    const senderAccount = await this.withRetry(() => server.loadAccount(senderPublicKey));
    console.log('[buildPaymentTransaction] Loaded account, sequence:', senderAccount.sequence);

    // Determine asset based on network
    const asset = this.getAsset(assetCode, effectiveNetworkPassphrase);

    const shouldAutoActivate = Boolean(activateNewAccounts);
    if (shouldAutoActivate && assetCode !== 'XLM') {
      throw new Error('AUTO_ACTIVATION_XLM_ONLY');
    }

    const destinationExists = shouldAutoActivate
      ? await this.accountExists(server, recipientPublicKey)
      : true;

    const txBuilder = new StellarSdk.TransactionBuilder(senderAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: effectiveNetworkPassphrase,
    });

    if (shouldAutoActivate && !destinationExists) {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount < 1) {
        throw new Error('AUTO_ACTIVATION_MIN_1_XLM');
      }
      console.log(
        '[buildPaymentTransaction] Destination is not active, using createAccount operation'
      );
      txBuilder.addOperation(
        StellarSdk.Operation.createAccount({
          destination: recipientPublicKey,
          startingBalance: amount,
        })
      );
    } else {
      txBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: recipientPublicKey,
          asset,
          amount,
        })
      );
    }

    // Build transaction
    const transaction = txBuilder
      .addMemo(StellarSdk.Memo.text(invoiceId.substring(0, 28)))
      .setTimeout(300) // 5 minutes
      .build();

    return {
      transactionXdr: transaction.toXDR(),
      networkPassphrase: effectiveNetworkPassphrase,
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
  async verifyTransaction(transactionHash: string, networkPassphrase?: string) {
    try {
      const server = this.getServerForNetwork(networkPassphrase);

      const tx = await this.withRetry(() =>
        server.transactions().transaction(transactionHash).call()
      );

      // Get the operations for this transaction
      const operations = await this.withRetry(() =>
        server.operations().forTransaction(transactionHash).call()
      );

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
   * Validates that the signed transaction matches the expected network
   */
  async submitTransaction(signedXdr: string, expectedNetworkPassphrase?: string) {
    try {
      let transaction: StellarSdk.Transaction;
      let networkToUse: string;

      if (expectedNetworkPassphrase) {
        // Parse with the expected network passphrase from the invoice
        console.log('[submitTransaction] Expected network from invoice:', expectedNetworkPassphrase);
        try {
          transaction = StellarSdk.TransactionBuilder.fromXDR(
            signedXdr,
            expectedNetworkPassphrase
          ) as StellarSdk.Transaction;
          networkToUse = expectedNetworkPassphrase;
          console.log('[submitTransaction] Successfully parsed with invoice network');
        } catch (parseError: any) {
          // Parsing failed - Freighter signed with wrong network
          const expectedName = expectedNetworkPassphrase === NETWORK_CONFIG.testnet.networkPassphrase ? 'TESTNET' : 'MAINNET';
          const wrongName = expectedNetworkPassphrase === NETWORK_CONFIG.testnet.networkPassphrase ? 'MAINNET' : 'TESTNET';
          console.log('[submitTransaction] Parse failed - Freighter signed with wrong network');
          throw new Error(
            `Network mismatch: This invoice requires ${expectedName} but your Freighter wallet signed with ${wrongName}. Please switch your Freighter wallet to ${expectedName}, disconnect and reconnect, then try again.`
          );
        }
      } else {
        // Fallback: auto-detect for backwards compatibility
        let detectedNetworkPassphrase: string;
        try {
          transaction = StellarSdk.TransactionBuilder.fromXDR(
            signedXdr,
            NETWORK_CONFIG.testnet.networkPassphrase
          ) as StellarSdk.Transaction;
          detectedNetworkPassphrase = NETWORK_CONFIG.testnet.networkPassphrase;
        } catch {
          transaction = StellarSdk.TransactionBuilder.fromXDR(
            signedXdr,
            NETWORK_CONFIG.mainnet.networkPassphrase
          ) as StellarSdk.Transaction;
          detectedNetworkPassphrase = NETWORK_CONFIG.mainnet.networkPassphrase;
        }
        networkToUse = detectedNetworkPassphrase;
        console.log('[submitTransaction] Auto-detected network:', detectedNetworkPassphrase);
      }

      console.log('[submitTransaction] Transaction sequence:', transaction.sequence);
      console.log('[submitTransaction] Source account:', transaction.source);
      const server = this.getServerForNetwork(networkToUse);
      const horizonUrl = getHorizonUrl(networkToUse);
      console.log('[submitTransaction] Submitting to Horizon:', horizonUrl);

      const result = await server.submitTransaction(transaction);
      console.log('[submitTransaction] Success! Hash:', result.hash);
      return {
        hash: result.hash,
        ledger: result.ledger,
        successful: true,
      };
    } catch (error: any) {
      const message = error?.message ?? 'Transaction submission failed';
      const resultCodes = error?.response?.data?.extras?.result_codes;
      const httpStatus = error?.response?.status;

      console.log('[submitTransaction] FAILED:', resultCodes || message);

      // Preserve network mismatch as a user-fixable validation error.
      if (typeof message === 'string' && message.startsWith('Network mismatch:')) {
        (error as any).httpStatus = 400;
        throw error;
      }

      // Preserve structured Horizon data so route handlers can return clear user messages.
      const wrappedError = new Error(message) as Error & {
        httpStatus?: number;
        resultCodes?: any;
        details?: any;
      };
      if (typeof httpStatus === 'number') {
        wrappedError.httpStatus = httpStatus;
      }
      if (resultCodes) {
        wrappedError.resultCodes = resultCodes;
      }
      if (error?.response?.data) {
        wrappedError.details = error.response.data;
      }
      throw wrappedError;
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
  async getTransactionHistory(
    accountId: string,
    limit = 10,
    networkPassphrase?: string
  ) {
    const server = this.getServerForNetwork(networkPassphrase);
    const transactions = await server
      .transactions()
      .forAccount(accountId)
      .limit(limit)
      .order('desc')
      .call();

    return transactions.records;
  }

  /**
   * Get the appropriate Stellar asset object for the specified network
   */
  private getAsset(code: string, networkPassphrase?: string): StellarSdk.Asset {
    if (code === 'XLM') {
      return StellarSdk.Asset.native();
    }

    const issuer = getAssetIssuer(code, networkPassphrase);
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
