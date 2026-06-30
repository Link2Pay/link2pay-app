//
// MockKycProvider — default provider. Simulates a merchant KYC session with no
// external dependency, so the full gate (UNVERIFIED → PENDING → VERIFIED) is
// demoable on localhost. The VERIFIED transition is driven explicitly by
// POST /api/kyc/mock/complete (wired to a one-click "approve" in the UI),
// not by polling — getStatus is therefore a no-op that stays PENDING.
//

import {
  KycProvider,
  StartVerificationParams,
  StartVerificationResult,
  KycVerificationStatus,
} from '../KycProvider';

/** Sentinel verificationUrl: the frontend renders an inline simulated panel. */
export const MOCK_VERIFICATION_URL = 'mock:inline';

export class MockKycProvider implements KycProvider {
  readonly id = 'mock' as const;

  async startVerification(
    params: StartVerificationParams
  ): Promise<StartVerificationResult> {
    const ref = `mock_${params.walletAddress.slice(0, 8)}_${Date.now()}`;
    return { ref, verificationUrl: MOCK_VERIFICATION_URL };
  }

  async getStatus(_ref: string): Promise<KycVerificationStatus> {
    // No external state — the DB is the source of truth, transitioned by
    // POST /api/kyc/mock/complete. Polling never advances a mock session.
    return 'PENDING';
  }
}

export const mockKycProvider = new MockKycProvider();
