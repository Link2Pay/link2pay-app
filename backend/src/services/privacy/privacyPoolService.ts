import * as StellarSdk from '@stellar/stellar-sdk';
import { buildHash } from 'circomlibjs';
import { prisma } from '../prismaClient';
import { proofGenerationService, ProofInput } from './proofGenerationService';

const TREE_DEPTH = 10;
const MAX_LEAVES = 1 << TREE_DEPTH; // 1,024

/**
 * Service for managing privacy pool operations
 */
export class PrivacyPoolService {
  private poseidon: any;
  private zeros: string[];

  constructor() {
    this.zeros = [];
  }

  /**
   * Initialize Poseidon hash function
   */
  async initialize() {
    if (!this.poseidon) {
      this.poseidon = await buildHash();
      this.computeZeros();
    }
  }

  /**
   * Pre-compute zero values for sparse Merkle tree
   */
  private computeZeros() {
    this.zeros = new Array(TREE_DEPTH);

    // Level 0: hash of zero
    this.zeros[0] = this.poseidon.F.toString(this.poseidon([0, 0]));

    // Each level: hash of previous level with itself
    for (let i = 1; i < TREE_DEPTH; i++) {
      this.zeros[i] = this.poseidon.F.toString(
        this.poseidon([this.zeros[i - 1], this.zeros[i - 1]])
      );
    }
  }

  /**
   * Compute Poseidon hash of commitment
   * commitment = H(amount, secret, nullifier, recipientWallet)
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
   * Get all commitments from database
   */
  async getCommitments(): Promise<string[]> {
    const deposits = await prisma.privacyDeposit.findMany({
      where: {
        status: 'CONFIRMED',
      },
      orderBy: {
        leafIndex: 'asc',
      },
      select: {
        commitment: true,
      },
    });

    return deposits.map(d => d.commitment);
  }

  /**
   * Compute Merkle root from commitments
   */
  async computeMerkleRoot(commitments: string[]): Promise<string> {
    await this.initialize();

    if (commitments.length === 0) {
      return this.zeros[TREE_DEPTH - 1];
    }

    if (commitments.length > MAX_LEAVES) {
      throw new Error(`Too many commitments: ${commitments.length} > ${MAX_LEAVES}`);
    }

    let currentLevel = [...commitments];

    for (let level = 0; level < TREE_DEPTH; level++) {
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length
          ? currentLevel[i + 1]
          : this.zeros[level];

        const parent = this.poseidon.F.toString(
          this.poseidon([BigInt(left), BigInt(right)])
        );
        nextLevel.push(parent);
      }

      if (nextLevel.length === 1 && level < TREE_DEPTH - 1) {
        // Pad to root with zeros
        let node = nextLevel[0];
        for (let l = level + 1; l < TREE_DEPTH; l++) {
          node = this.poseidon.F.toString(
            this.poseidon([BigInt(node), BigInt(this.zeros[l])])
          );
        }
        return node;
      }

      currentLevel = nextLevel;

      if (currentLevel.length === 1) {
        return currentLevel[0];
      }
    }

    return currentLevel[0];
  }

  /**
   * Generate Merkle proof for commitment at index
   */
  async getMerkleProof(leafIndex: number): Promise<{
    pathElements: string[];
    pathIndices: number[];
  }> {
    await this.initialize();

    const commitments = await this.getCommitments();

    if (leafIndex >= commitments.length) {
      throw new Error(`Invalid leaf index: ${leafIndex} >= ${commitments.length}`);
    }

    const pathElements: string[] = [];
    const pathIndices: number[] = [];

    let currentLevel = [...commitments];
    let index = leafIndex;

    for (let level = 0; level < TREE_DEPTH; level++) {
      const isRight = index % 2 === 1;
      pathIndices.push(isRight ? 1 : 0);

      const siblingIndex = isRight ? index - 1 : index + 1;
      const sibling = siblingIndex < currentLevel.length
        ? currentLevel[siblingIndex]
        : this.zeros[level];

      pathElements.push(sibling);

      // Build next level
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length
          ? currentLevel[i + 1]
          : this.zeros[level];

        const parent = this.poseidon.F.toString(
          this.poseidon([BigInt(left), BigInt(right)])
        );
        nextLevel.push(parent);
      }

      currentLevel = nextLevel;
      index = Math.floor(index / 2);

      if (currentLevel.length <= 1) {
        break;
      }
    }

    return { pathElements, pathIndices };
  }

  /**
   * Generate proof for x402 payment
   */
  async generatePaymentProof(params: {
    invoiceId: string;
    secret: string;
    nullifier: string;
    paymentAmount: string;
    serviceAddress: string;
  }): Promise<{
    proof: any;
    publicSignals: string[];
    nullifierHash: string;
  }> {
    await this.initialize();

    // Get deposit details
    const deposit = await prisma.privacyDeposit.findUnique({
      where: { invoiceId: params.invoiceId },
    });

    if (!deposit || deposit.leafIndex === null) {
      throw new Error('Deposit not found or not confirmed');
    }

    // Get Merkle proof
    const { pathElements, pathIndices } = await this.getMerkleProof(deposit.leafIndex);

    // Get current Merkle root
    const commitments = await this.getCommitments();
    const merkleRoot = await this.computeMerkleRoot(commitments);

    // Convert service address to field element
    const serviceBytes = StellarSdk.StrKey.decodeEd25519PublicKey(params.serviceAddress);
    const serviceField = BigInt('0x' + Buffer.from(serviceBytes).toString('hex'));

    // Prepare proof input
    const proofInput: ProofInput = {
      amount: deposit.amount.toString(),
      secret: params.secret,
      nullifier: params.nullifier,
      pathElements,
      pathIndices,
      recipientWallet: serviceField.toString(),
      paymentAmount: params.paymentAmount,
      merkleRoot,
    };

    // Generate proof
    const { proof, publicSignals } = await proofGenerationService.generatePaymentProof(proofInput);

    // Compute nullifier hash
    const nullifierHash = await this.computeNullifierHash(params.nullifier);

    return {
      proof,
      publicSignals,
      nullifierHash,
    };
  }

  /**
   * Calculate privacy score based on anonymity set
   */
  async calculatePrivacyScore(): Promise<{
    anonymitySetSize: number;
    score: number;
    recommendation: string;
  }> {
    const activeDeposits = await prisma.privacyDeposit.count({
      where: {
        status: 'CONFIRMED',
      },
    });

    let score = 0;
    let recommendation = '';

    if (activeDeposits < 5) {
      score = 20;
      recommendation = 'LOW: Wait for more deposits before withdrawing for better privacy';
    } else if (activeDeposits < 20) {
      score = 50;
      recommendation = 'MEDIUM: Reasonable privacy, but more deposits would improve anonymity';
    } else if (activeDeposits < 50) {
      score = 75;
      recommendation = 'GOOD: Strong anonymity set';
    } else {
      score = 95;
      recommendation = 'EXCELLENT: Very strong anonymity set';
    }

    return {
      anonymitySetSize: activeDeposits,
      score,
      recommendation,
    };
  }
}

export const privacyPoolService = new PrivacyPoolService();
