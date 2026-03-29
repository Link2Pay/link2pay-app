import { apiClient } from './api';

export interface MerkleProof {
  leafIndex: number;
  pathElements: string[];
  pathIndices: number[];
}

export interface PrivacyDeposit {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  commitment: string;
  leafIndex: number | null;
  status: 'PENDING' | 'CONFIRMED' | 'WITHDRAWN' | 'FAILED';
  depositTxHash: string | null;
  withdrawTxHash: string | null;
  createdAt: string;
  withdrawnAt: string | null;
}

export interface PrivacyScore {
  anonymitySetSize: number;
  score: number;
  recommendation: string;
}

export interface ProofGenerationRequest {
  invoiceId: string;
  secret: string;
  nullifier: string;
  paymentAmount: string;
  serviceAddress: string;
}

export interface ProofGenerationResponse {
  proof: any;
  publicSignals: string[];
  nullifierHash: string;
}

export const privacyApi = {
  /**
   * Generate ZK proof for payment
   */
  async generateProof(request: ProofGenerationRequest): Promise<ProofGenerationResponse> {
    const response = await apiClient.post('/privacy/generate-proof', request);
    return response.data;
  },

  /**
   * Get Merkle proof for leaf index
   */
  async getMerkleProof(leafIndex: number): Promise<MerkleProof> {
    const response = await apiClient.get(`/privacy/merkle-proof/${leafIndex}`);
    return response.data;
  },

  /**
   * Get current Merkle root
   */
  async getMerkleRoot(): Promise<{ root: string; commitmentCount: number }> {
    const response = await apiClient.get('/privacy/merkle-root');
    return response.data;
  },

  /**
   * Get privacy score
   */
  async getPrivacyScore(): Promise<PrivacyScore> {
    const response = await apiClient.get('/privacy/score');
    return response.data;
  },

  /**
   * Get user's privacy deposits
   */
  async getDeposits(): Promise<{ deposits: PrivacyDeposit[] }> {
    const response = await apiClient.get('/privacy/deposits');
    return response.data;
  },

  /**
   * Compute commitment hash (for validation)
   */
  async computeCommitment(
    amount: string,
    secret: string,
    nullifier: string,
    recipientWallet: string
  ): Promise<{ commitment: string }> {
    const response = await apiClient.post('/privacy/compute-commitment', {
      amount,
      secret,
      nullifier,
      recipientWallet,
    });
    return response.data;
  },
};
