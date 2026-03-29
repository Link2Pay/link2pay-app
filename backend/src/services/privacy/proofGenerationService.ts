import { groth16 } from 'snarkjs';
import path from 'path';
import { readFile } from 'fs/promises';

export interface ProofInput {
  // Private inputs
  amount: string;
  secret: string;
  nullifier: string;
  pathElements: string[];
  pathIndices: number[];

  // Public inputs
  recipientWallet: string;
  paymentAmount: string;
  merkleRoot: string;
}

export interface ProofData {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

/**
 * Service for generating zero-knowledge proofs for private x402 payments
 */
export class ProofGenerationService {
  private wasmPath: string;
  private zkeyPath: string;
  private vkeyPath: string;

  constructor() {
    // Paths to circuit artifacts (relative to backend root)
    const circuitsDir = path.join(__dirname, '../../../circuits');
    this.wasmPath = path.join(circuitsDir, 'build/x402_payment_js/x402_payment.wasm');
    this.zkeyPath = path.join(circuitsDir, 'keys/x402_payment_final.zkey');
    this.vkeyPath = path.join(circuitsDir, 'keys/verification_key.json');
  }

  /**
   * Generate a zero-knowledge proof for an x402 payment
   */
  async generatePaymentProof(input: ProofInput): Promise<ProofData> {
    try {
      console.log('Generating x402 payment proof...');
      const startTime = Date.now();

      // Generate proof using snarkjs
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        this.wasmPath,
        this.zkeyPath
      );

      const duration = Date.now() - startTime;
      console.log(`✓ Proof generated in ${duration}ms`);

      return {
        proof,
        publicSignals,
      };
    } catch (error) {
      console.error('Error generating proof:', error);
      throw new Error(`Proof generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a proof locally (for testing/debugging)
   */
  async verifyProof(proof: ProofData['proof'], publicSignals: string[]): Promise<boolean> {
    try {
      const vkeyData = await readFile(this.vkeyPath, 'utf-8');
      const vkey = JSON.parse(vkeyData);

      const verified = await groth16.verify(vkey, publicSignals, proof);
      return verified;
    } catch (error) {
      console.error('Error verifying proof:', error);
      return false;
    }
  }

  /**
   * Export verification key (for contract deployment)
   */
  async getVerificationKey(): Promise<any> {
    const vkeyData = await readFile(this.vkeyPath, 'utf-8');
    return JSON.parse(vkeyData);
  }
}

export const proofGenerationService = new ProofGenerationService();
