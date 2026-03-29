import { groth16 } from 'snarkjs';
import { buildPoseidon } from 'circomlibjs';
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Privacy Pool library for zero-knowledge payments
 */

export interface PrivacyCredentials {
  secret: string;
  nullifier: string;
  commitment: string;
  amount: string;
  recipientWallet: string;
}

export interface ProofData {
  proof: any;
  publicSignals: string[];
  nullifierHash: string;
}

class PrivacyPoolClient {
  private poseidon: any;
  private wasmPath = '/circuits/x402_payment.wasm';
  private zkeyPath = '/circuits/x402_payment_final.zkey';

  /**
   * Initialize Poseidon hash
   */
  async initialize() {
    if (!this.poseidon) {
      this.poseidon = await buildPoseidon();
    }
  }

  /**
   * Generate random secret and nullifier
   */
  generateRandomValues(): { secret: string; nullifier: string } {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);

    const secret = BigInt('0x' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    ).toString();

    crypto.getRandomValues(randomBytes);
    const nullifier = BigInt('0x' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    ).toString();

    return { secret, nullifier };
  }

  /**
   * Compute commitment hash
   * commitment = Poseidon(amount, secret, nullifier, recipientWallet)
   */
  async computeCommitment(
    amount: string,
    secret: string,
    nullifier: string,
    recipientWallet: string
  ): Promise<string> {
    await this.initialize();

    // Convert Stellar address to field element
    const recipientBytes = StellarSdk.StrKey.decodeEd25519PublicKey(recipientWallet);
    const recipientField = BigInt('0x' + Buffer.from(recipientBytes).toString('hex'));

    const commitment = this.poseidon([
      BigInt(amount),
      BigInt(secret),
      BigInt(nullifier),
      recipientField,
    ]);

    return this.poseidon.F.toString(commitment);
  }

  /**
   * Compute nullifier hash
   */
  async computeNullifierHash(nullifier: string): Promise<string> {
    await this.initialize();
    const hash = this.poseidon([BigInt(nullifier)]);
    return this.poseidon.F.toString(hash);
  }

  /**
   * Create privacy credentials for a deposit
   */
  async createDepositCredentials(
    amount: string,
    recipientWallet: string
  ): Promise<PrivacyCredentials> {
    const { secret, nullifier } = this.generateRandomValues();
    const commitment = await this.computeCommitment(amount, secret, nullifier, recipientWallet);

    return {
      secret,
      nullifier,
      commitment,
      amount,
      recipientWallet,
    };
  }

  /**
   * Generate zero-knowledge proof for payment
   */
  async generatePaymentProof(
    credentials: PrivacyCredentials,
    paymentAmount: string,
    serviceAddress: string,
    merkleProof: {
      pathElements: string[];
      pathIndices: number[];
    },
    merkleRoot: string
  ): Promise<ProofData> {
    await this.initialize();

    // Convert service address to field element
    const serviceBytes = StellarSdk.StrKey.decodeEd25519PublicKey(serviceAddress);
    const serviceField = BigInt('0x' + Buffer.from(serviceBytes).toString('hex'));

    // Convert recipient wallet to field element
    const recipientBytes = StellarSdk.StrKey.decodeEd25519PublicKey(credentials.recipientWallet);
    const recipientField = BigInt('0x' + Buffer.from(recipientBytes).toString('hex'));

    // Prepare circuit inputs
    const input = {
      // Private inputs
      amount: credentials.amount,
      secret: credentials.secret,
      nullifier: credentials.nullifier,
      pathElements: merkleProof.pathElements,
      pathIndices: merkleProof.pathIndices,

      // Public inputs
      recipientWallet: recipientField.toString(),
      paymentAmount,
      merkleRoot,
    };

    console.log('Generating ZK proof...');
    const startTime = Date.now();

    // Generate proof
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      this.wasmPath,
      this.zkeyPath
    );

    const duration = Date.now() - startTime;
    console.log(`✓ Proof generated in ${duration}ms`);

    // Compute nullifier hash
    const nullifierHash = await this.computeNullifierHash(credentials.nullifier);

    return {
      proof,
      publicSignals,
      nullifierHash,
    };
  }

  /**
   * Save credentials to file for backup
   */
  downloadCredentials(credentials: PrivacyCredentials, invoiceNumber: string) {
    const data = JSON.stringify(credentials, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-credentials-${invoiceNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Load credentials from file
   */
  async loadCredentials(file: File): Promise<PrivacyCredentials> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const credentials = JSON.parse(e.target?.result as string);
          resolve(credentials);
        } catch (error) {
          reject(new Error('Invalid credentials file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Calculate privacy score based on anonymity set size
   */
  calculatePrivacyScore(anonymitySetSize: number): {
    score: number;
    level: string;
    recommendation: string;
  } {
    let score = 0;
    let level = '';
    let recommendation = '';

    if (anonymitySetSize < 5) {
      score = 20;
      level = 'LOW';
      recommendation = 'Wait for more deposits before withdrawing for better privacy';
    } else if (anonymitySetSize < 20) {
      score = 50;
      level = 'MEDIUM';
      recommendation = 'Reasonable privacy, but more deposits would improve anonymity';
    } else if (anonymitySetSize < 50) {
      score = 75;
      level = 'GOOD';
      recommendation = 'Strong anonymity set';
    } else {
      score = 95;
      level = 'EXCELLENT';
      recommendation = 'Very strong anonymity set';
    }

    return { score, level, recommendation };
  }
}

export const privacyPool = new PrivacyPoolClient();
